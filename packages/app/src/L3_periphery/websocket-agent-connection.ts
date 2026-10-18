// The one line between the phone and the agent, encrypted end to end.
//
// Every (re)connection runs the stage 2 handshake with fresh ephemeral keys:
// `hello` and `welcome` in clear, then a sealed `confirm` (with the pairing
// proof while pairing) and a sealed `ready`. A `ready` that decrypts is the
// proof the agent of the QR is on the other end; until then the link is not
// open. After it every frame both ways is sealed, and one that fails to open
// ends the connection for good, because a stream that was tampered with once
// cannot be trusted again.
//
// It reconnects on its own, because a phone walks in and out of Wi-Fi all day,
// and it re-sends whatever the page was watching once it is back. Through the
// relay an idle socket would be dropped by Cloudflare's proxy, so a text ping
// goes out every so often; the relay and the LAN agent both answer it.

import {
  CLOSE_PAIRING_EXPIRED,
  CLOSE_PROTOCOL,
  CLOSE_UNAUTHORIZED,
  decodeServerMessage,
  decodeWelcome,
  encodeClientMessage,
  encodeHello,
  pairingProof,
  publicKeyId,
  RELAY_PING,
  RELAY_PONG,
  startHandshake,
  type ClientMessage,
  type PhoneHandshake,
  type Request,
  type ResultOf,
  type SecureSession,
  type ServerMessage,
} from '@remote-sheep/protocol';
import type { LinkState } from '../L1_domain/link-state';
import type {
  AgentConnection,
  ConnectionHandlers,
  Credentials,
} from '../L1_domain/ports/agent-connection';

const FIRST_RETRY_MS = 1000;
const MAX_RETRY_MS = 10000;
// A request the agent never answers must not leave a button disabled forever.
const REQUEST_TIMEOUT_MS = 30000;
const KEEPALIVE_MS = 30000;

/** Close codes that retrying cannot fix, and what the page is told. */
const FINAL_CLOSES = new Map<number, LinkState>([
  [CLOSE_UNAUTHORIZED, 'unauthorized'],
  [CLOSE_PROTOCOL, 'outdated'],
  [CLOSE_PAIRING_EXPIRED, 'expired'],
]);

interface Pending {
  resolve(value: unknown): void;
  reject(error: Error): void;
  timer: ReturnType<typeof setTimeout>;
}

/** Where one socket is in the handshake. */
type Phase =
  | { step: 'welcome'; handshake: PhoneHandshake }
  | { step: 'ready'; session: SecureSession }
  | { step: 'open'; session: SecureSession };

export interface ConnectionOptions {
  keepaliveMs?: number;
}

export class WebSocketAgentConnection implements AgentConnection {
  private socket: WebSocket | null = null;
  private phase: Phase | null = null;
  private nextId = 1;
  private readonly pending = new Map<number, Pending>();
  private retryMs = FIRST_RETRY_MS;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private keepalive: ReturnType<typeof setInterval> | null = null;
  private readonly keepaliveMs: number;
  private stopped = false;
  /** The scanned invite until a pairing succeeds; it is single use, so reconnections go without. */
  private invite: Credentials['invite'];

  constructor(
    private readonly url: string,
    private readonly credentials: Credentials,
    private readonly handlers: ConnectionHandlers,
    options: ConnectionOptions = {},
  ) {
    this.keepaliveMs = options.keepaliveMs ?? KEEPALIVE_MS;
    this.invite = credentials.invite;
    this.connect();
    // A phone that wakes up should not wait out a backoff timer.
    document.addEventListener('visibilitychange', this.onVisible);
  }

  request<R extends Request>(request: R): Promise<ResultOf<R>> {
    if (this.phase?.step !== 'open') {
      return Promise.reject(new Error('not connected to your computer'));
    }
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error('your computer did not answer'));
      }, REQUEST_TIMEOUT_MS);
      this.pending.set(id, { resolve: resolve, reject, timer });
      this.send({ type: 'request', id, request });
    });
  }

  close(): void {
    this.stopped = true;
    document.removeEventListener('visibilitychange', this.onVisible);
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.stopKeepalive();
    this.socket?.close();
  }

  private onVisible = () => {
    if (document.hidden || this.stopped) return;
    if (!this.socket || this.socket.readyState === WebSocket.CLOSED) {
      if (this.retryTimer) clearTimeout(this.retryTimer);
      this.retryMs = FIRST_RETRY_MS;
      this.connect();
    }
  };

  private connect(): void {
    this.retryTimer = null;
    this.phase = null;
    this.handlers.state('connecting');
    const socket = new WebSocket(this.url);
    socket.binaryType = 'arraybuffer';
    this.socket = socket;

    socket.addEventListener('open', () => {
      // Fresh ephemeral keys on every connection: forward secrecy per connection.
      const handshake = startHandshake(this.credentials.phone, this.invite !== null);
      this.phase = { step: 'welcome', handshake };
      socket.send(encodeHello(handshake.hello));
      this.stopKeepalive();
      this.keepalive = setInterval(() => socket.send(RELAY_PING), this.keepaliveMs);
    });

    socket.addEventListener('message', (event) => {
      if (this.socket !== socket) return;
      if (event.data === RELAY_PONG) return;
      try {
        if (!(event.data instanceof ArrayBuffer)) throw new Error('text frame');
        this.receive(new Uint8Array(event.data));
      } catch {
        this.reject(socket);
      }
    });

    socket.addEventListener('close', (event) => {
      if (this.socket !== socket) return;
      this.phase = null;
      this.stopKeepalive();
      this.failPending();
      const final = FINAL_CLOSES.get(event.code);
      if (final) {
        this.stop(final);
        return;
      }
      this.handlers.state('closed');
      if (this.stopped || document.hidden) return;
      this.retryTimer = setTimeout(() => this.connect(), this.retryMs);
      this.retryMs = Math.min(this.retryMs * 2, MAX_RETRY_MS);
    });
  }

  /** Advances the handshake, or delivers a message; throws on anything out of place. */
  private receive(data: Uint8Array): void {
    const phase = this.phase;
    if (!phase) throw new Error('frame before the handshake');
    if (phase.step === 'welcome') {
      const welcome = decodeWelcome(data);
      if (!welcome) throw new Error('malformed welcome');
      const session = phase.handshake.finish(welcome, this.credentials.agentKey);
      this.phase = { step: 'ready', session };
      const invite = this.invite;
      this.send(
        invite
          ? { type: 'confirm', proof: pairingProof(invite.secret, session.transcript) }
          : { type: 'confirm' },
      );
      return;
    }
    const message = decodeServerMessage(phase.session.open(data));
    if (!message) throw new Error('malformed message');
    if (phase.step === 'ready') {
      if (message.type !== 'ready') throw new Error('expected ready');
      this.phase = { step: 'open', session: phase.session };
      this.invite = null;
      this.retryMs = FIRST_RETRY_MS;
      this.handlers.state('open');
      this.handlers.ready(message.device);
      return;
    }
    this.deliver(message);
  }

  private deliver(message: ServerMessage): void {
    if (message.type === 'ready') throw new Error('ready after the handshake');
    if (message.type !== 'reply') {
      this.handlers.message(message);
      return;
    }
    const waiting = this.pending.get(message.id);
    if (!waiting) return;
    this.pending.delete(message.id);
    clearTimeout(waiting.timer);
    if (message.ok) waiting.resolve(message.result);
    else waiting.reject(new Error(message.error));
  }

  /**
   * A bad handshake or a frame that fails to open: hang up and do not retry.
   * The verdict is the phone's own, not whatever close code the peer echoes.
   */
  private reject(socket: WebSocket): void {
    this.socket = null;
    this.phase = null;
    this.stopKeepalive();
    socket.close(CLOSE_UNAUTHORIZED);
    this.failPending();
    this.stop('unauthorized');
  }

  private stop(state: LinkState): void {
    this.stopped = true;
    document.removeEventListener('visibilitychange', this.onVisible);
    this.handlers.state(state);
  }

  private stopKeepalive(): void {
    if (this.keepalive) clearInterval(this.keepalive);
    this.keepalive = null;
  }

  private failPending(): void {
    for (const waiting of this.pending.values()) {
      clearTimeout(waiting.timer);
      waiting.reject(new Error('connection lost'));
    }
    this.pending.clear();
  }

  private send(message: ClientMessage): void {
    const phase = this.phase;
    if (!phase || phase.step === 'welcome') throw new Error('no secure session yet');
    this.socket?.send(phase.session.seal(encodeClientMessage(message)));
  }
}

/**
 * The socket lives on the host that served this page: the agent on the LAN, or
 * the relay, which needs the agent's room. The LAN agent ignores the room.
 */
export function agentUrl(page: { protocol: string; host: string }, agentKey: Uint8Array): string {
  const scheme = page.protocol === 'https:' ? 'wss:' : 'ws:';
  return scheme + '//' + page.host + '/ws?agent=' + publicKeyId(agentKey);
}
