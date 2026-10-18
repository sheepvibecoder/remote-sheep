// The agent dials out to a relay and serves the phones that reach it there, so no
// port has to be open on the PC. Many phones share the agent's one socket: each is a
// "stream" of relay envelopes, and each stream is handed to the channel as a Link,
// exactly like a LAN socket. The frames inside stay sealed; the relay never opens them.

import { type RawData, WebSocket } from 'ws';
import {
  decodeRelayEnvelope,
  encodeRelayEnvelope,
  RELAY_PING,
  RELAY_PONG,
} from '@remote-sheep/protocol';
import type { Link, LinkServer } from '../../L1_domain/ports/link';

export type RelayState = 'connected' | 'disconnected';

export interface RelayOptions {
  /** Relay origin, http(s). https becomes wss and http becomes ws (local `wrangler dev`). */
  url: string;
  /** The agent's room: the id of its public key. */
  room: string;
  /** Access code the relay owner issued. */
  code: string;
  log?: (message: string) => void;
  onState?: (state: RelayState) => void;
  /** Tuning, exposed so tests do not wait for real intervals. */
  pingIntervalMs?: number;
  backoffInitialMs?: number;
  backoffMaxMs?: number;
}

const MAX_MESSAGE_BYTES = 16 * 1024 * 1024;
const DEFAULT_PING_MS = 30_000;
const DEFAULT_BACKOFF_INITIAL_MS = 1000;
const DEFAULT_BACKOFF_MAX_MS = 30_000;

const toBytes = (data: RawData): Uint8Array =>
  Array.isArray(data)
    ? Buffer.concat(data)
    : data instanceof ArrayBuffer
      ? new Uint8Array(data)
      : data;

// Handlers start as no-ops: a frame can arrive before the channel subscribes.
const ignore = (): void => undefined;

class RelayLink implements Link {
  private message: (data: Uint8Array) => void = ignore;
  private end: () => void = ignore;
  private ended = false;

  constructor(
    private readonly sendEnvelope: (bytes: Uint8Array) => void,
    private readonly stream: number,
    private readonly release: () => void,
  ) {}

  send(data: Uint8Array): void {
    if (this.ended) return;
    this.sendEnvelope(encodeRelayEnvelope({ kind: 'data', stream: this.stream, data }));
  }

  close(code: number, reason: string): void {
    if (this.ended) return;
    this.sendEnvelope(encodeRelayEnvelope({ kind: 'close', stream: this.stream, code, reason }));
    this.finish();
  }

  onMessage(handler: (data: Uint8Array) => void): void {
    this.message = handler;
  }

  onClose(handler: () => void): void {
    this.end = handler;
  }

  /** The relay delivered a sealed frame from the phone. */
  receive(data: Uint8Array): void {
    if (!this.ended) this.message(data);
  }

  /** The phone left, or the relay socket dropped. */
  finish(): void {
    if (this.ended) return;
    this.ended = true;
    this.release();
    this.end();
  }
}

export class RelayTransport implements LinkServer {
  private accept: (link: Link) => void = ignore;
  private socket: WebSocket | null = null;
  private readonly links = new Map<number, RelayLink>();
  private stopped = true;
  private retryTimer: NodeJS.Timeout | null = null;
  private pingTimer: NodeJS.Timeout | null = null;
  private delayMs: number;
  private warnedText = false;
  private refused = false;

  private readonly pingIntervalMs: number;
  private readonly backoffInitialMs: number;
  private readonly backoffMaxMs: number;

  constructor(private readonly options: RelayOptions) {
    this.pingIntervalMs = options.pingIntervalMs ?? DEFAULT_PING_MS;
    this.backoffInitialMs = options.backoffInitialMs ?? DEFAULT_BACKOFF_INITIAL_MS;
    this.backoffMaxMs = options.backoffMaxMs ?? DEFAULT_BACKOFF_MAX_MS;
    this.delayMs = this.backoffInitialMs;
  }

  start(accept: (link: Link) => void): Promise<void> {
    this.accept = accept;
    this.stopped = false;
    this.connect();
    // The relay may be unreachable for a while; that is retried, never a start failure.
    return Promise.resolve();
  }

  stop(): Promise<void> {
    this.stopped = true;
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.retryTimer = null;
    this.stopPing();
    const socket = this.socket;
    this.socket = null;
    if (socket) {
      socket.removeAllListeners('close');
      socket.on('error', ignore);
      socket.terminate();
    }
    this.endLinks();
    return Promise.resolve();
  }

  private log(message: string): void {
    this.options.log?.(message);
  }

  private connect(): void {
    const url = this.options.url.replace(/^http/, 'ws') + '/agent/' + this.options.room;
    const socket = new WebSocket(url, {
      headers: { authorization: 'Bearer ' + this.options.code },
      maxPayload: MAX_MESSAGE_BYTES,
    });
    this.socket = socket;

    socket.on('open', () => {
      this.delayMs = this.backoffInitialMs;
      this.warnedText = false;
      this.startPing(socket);
      this.options.onState?.('connected');
    });
    socket.on('message', (data, isBinary) => {
      if (isBinary) this.receive(toBytes(data));
      else this.receiveText(new TextDecoder().decode(toBytes(data)));
    });
    // The relay refuses with an HTTP status instead of upgrading: 403 is final (wrong access
    // code), anything else is an outage and is retried. the 'close' that follows decides which.
    socket.on('unexpected-response', (_request, response) => {
      response.resume();
      if (response.statusCode === 403) this.refused = true;
      else this.log('relay answered HTTP ' + String(response.statusCode));
      // With a listener ws no longer aborts the handshake by itself; terminate ends in 'close'.
      socket.terminate();
    });
    // An unreachable host also ends in 'close'.
    socket.on('error', (err) => this.log('relay connection error: ' + err.message));
    socket.on('close', () => this.dropped(socket));
  }

  private receive(bytes: Uint8Array): void {
    const envelope = decodeRelayEnvelope(bytes);
    if (!envelope) return;
    if (envelope.kind === 'open') {
      if (this.links.has(envelope.stream)) return;
      const link = new RelayLink(
        (out) => this.sendBytes(out),
        envelope.stream,
        () => this.links.delete(envelope.stream),
      );
      this.links.set(envelope.stream, link);
      this.accept(link);
    } else if (envelope.kind === 'data') {
      this.links.get(envelope.stream)?.receive(envelope.data);
    } else {
      this.links.get(envelope.stream)?.finish();
    }
  }

  private receiveText(text: string): void {
    if (text === RELAY_PONG || this.warnedText) return;
    this.warnedText = true;
    this.log('relay sent unexpected text and it was ignored: ' + text.slice(0, 40));
  }

  private sendBytes(bytes: Uint8Array): void {
    if (this.socket?.readyState === WebSocket.OPEN) this.socket.send(bytes);
  }

  private startPing(socket: WebSocket): void {
    this.stopPing();
    this.pingTimer = setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) socket.send(RELAY_PING);
    }, this.pingIntervalMs);
  }

  private stopPing(): void {
    if (this.pingTimer) clearInterval(this.pingTimer);
    this.pingTimer = null;
  }

  private endLinks(): void {
    for (const link of [...this.links.values()]) link.finish();
    this.links.clear();
  }

  private dropped(socket: WebSocket): void {
    if (this.socket !== socket) return;
    this.socket = null;
    this.stopPing();
    this.endLinks();
    this.options.onState?.('disconnected');
    if (this.stopped) return;
    if (this.refused) {
      this.log('the relay refused this agent: check the access code');
      return;
    }
    const wait = this.delayMs;
    this.delayMs = Math.min(this.delayMs * 2, this.backoffMaxMs);
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null;
      if (!this.stopped) this.connect();
    }, wait);
  }
}
