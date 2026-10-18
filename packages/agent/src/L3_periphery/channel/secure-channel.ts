// Stage 2 security: phones paired by QR, every frame sealed end to end.
//
// Each link runs the handshake of `@remote-sheep/protocol` before the core
// hears of it: a clear `hello`, which is judged before anything is answered,
// the agent's clear `welcome`, then the phone's sealed `confirm` (with the
// pairing proof when it scanned a QR) and the agent's sealed `ready`. Only then
// is the connection opened to the core, and from then on every frame in both
// directions goes through the session cipher. A frame that fails to open ends
// the connection, because the stream can no longer be trusted.
//
// While a phone stays connected its pairing is re-checked on a timer, so a
// `remote-sheep revoke` from another process, or the 24-hour idle limit,
// closes it within one interval.

import {
  acceptHandshake,
  AUTH_TIMEOUT_MS,
  CLOSE_PAIRING_EXPIRED,
  CLOSE_PROTOCOL,
  CLOSE_UNAUTHORIZED,
  decodeClientMessage,
  decodeHello,
  encodeServerMessage,
  encodeWelcome,
  PROTOCOL,
  readUnknownRequest,
  type ClientMessage,
  type Hello,
  type KeyPair,
  type SecureSession,
  type ServerMessage,
} from '@remote-sheep/protocol';
import type { Connection, ConnectionEvents } from '../../L1_domain/ports/connection';
import type { Device } from '../../L1_domain/ports/device-registry';
import type { Channel, Link } from '../../L1_domain/ports/link';
import type { PairingService, PendingInvite } from '../../L2_application/pairing-service';

export interface SecureChannelOptions {
  /** The agent's static key pair; its public half is in every QR. */
  keys: KeyPair;
  pairing: PairingService;
  version: string;
  events: ConnectionEvents;
  /** The whole handshake, hello to confirm, must fit in this window. */
  authTimeoutMs?: number;
  /** How often an open connection's pairing is re-checked. */
  checkIntervalMs?: number;
  log?: (message: string) => void;
}

export const PAIRING_CHECK_INTERVAL_MS = 5000;

// A hello or a confirm is a few hundred bytes; nothing larger is even parsed
// before the phone has proved who it is.
const MAX_HANDSHAKE_BYTES = 4096;
// A frame that decrypts, so it really came from the paired phone, but is not a
// request: a bug, not an attack, so it keeps the stage 1 policy code.
const CLOSE_POLICY = 1008;

class SecureConnection implements Connection {
  constructor(
    readonly device: string,
    private readonly link: Link,
    private readonly session: SecureSession,
  ) {}

  send(message: ServerMessage): void {
    this.link.send(this.session.seal(encodeServerMessage(message)));
  }

  close(code: number, reason: string): void {
    this.link.close(code, reason);
  }
}

/** Where a handshake stands after the `welcome` went out. */
interface Accepted {
  hello: Hello;
  session: SecureSession;
  /** Set when pairing with a QR; null when a paired phone reconnects. */
  invite: PendingInvite | null;
  device: Device | null;
}

/** One link from its first frame to its close. */
class PhoneLink {
  private accepted: Accepted | null = null;
  private connection: SecureConnection | null = null;
  private closed = false;
  // Frames are handled strictly in order: the handshake awaits the registry,
  // and the session cipher expects frames in the order they were sent.
  private queue: Promise<void> = Promise.resolve();
  private readonly deadline: ReturnType<typeof setTimeout>;
  private check: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly link: Link,
    private readonly options: SecureChannelOptions,
  ) {
    this.deadline = setTimeout(
      () => this.refuse(CLOSE_UNAUTHORIZED, 'unauthorized'),
      options.authTimeoutMs ?? AUTH_TIMEOUT_MS,
    );
    link.onMessage((data) => {
      this.queue = this.queue.then(
        () => this.handle(data),
        () => undefined,
      );
      // A failure while handling a frame closes the link; nothing else waits.
      void this.queue.catch((error: unknown) => {
        this.log('handshake failed: ' + (error instanceof Error ? error.message : String(error)));
        this.refuse(CLOSE_UNAUTHORIZED, 'unauthorized');
      });
    });
    link.onClose(() => this.ended());
  }

  private async handle(data: Uint8Array): Promise<void> {
    if (this.closed) return;
    if (this.connection && this.accepted) {
      this.receive(this.connection, this.accepted.session, data);
      return;
    }
    if (data.length > MAX_HANDSHAKE_BYTES) {
      this.refuse(CLOSE_UNAUTHORIZED, 'unauthorized');
      return;
    }
    if (this.accepted) await this.confirm(this.accepted, data);
    else await this.hello(data);
  }

  private async hello(data: Uint8Array): Promise<void> {
    // A stage 1 token hello does not decode either, and gets the same answer.
    const hello = decodeHello(data);
    if (!hello) {
      this.refuse(CLOSE_UNAUTHORIZED, 'unauthorized');
      return;
    }
    if (hello.protocol !== PROTOCOL) {
      this.refuse(CLOSE_PROTOCOL, 'protocol ' + PROTOCOL);
      return;
    }
    const admission = await this.options.pairing.admit(hello.identity, hello.pair);
    if (this.closed) return;
    switch (admission.kind) {
      case 'unknown':
      case 'no-invite':
        this.refuse(CLOSE_UNAUTHORIZED, 'unauthorized');
        return;
      case 'expired':
      case 'revoked':
        this.refuse(CLOSE_PAIRING_EXPIRED, 'pairing ' + admission.kind);
        return;
      case 'pair':
      case 'paired': {
        const { welcome, session } = acceptHandshake(this.options.keys, hello);
        this.accepted = {
          hello,
          session,
          invite: admission.kind === 'pair' ? admission.invite : null,
          device: admission.kind === 'paired' ? admission.device : null,
        };
        this.link.send(encodeWelcome(welcome));
        return;
      }
    }
  }

  private async confirm(accepted: Accepted, data: Uint8Array): Promise<void> {
    const message = this.openFrame(accepted.session, data);
    const confirm = message?.type === 'confirm' ? message : null;
    const { pairing } = this.options;

    let device = accepted.device;
    if (accepted.invite) {
      // Called even when the frame did not open, so any failed attempt burns the QR.
      device = await pairing.completePairing(
        accepted.invite,
        accepted.hello.identity,
        accepted.session.transcript,
        confirm?.proof,
      );
    } else if (device && confirm) {
      await pairing.touch(device.id);
    }
    if (this.closed) return;
    if (!device || !confirm) {
      this.refuse(CLOSE_UNAUTHORIZED, 'unauthorized');
      return;
    }

    clearTimeout(this.deadline);
    const connection = new SecureConnection(device.id, this.link, accepted.session);
    this.connection = connection;
    connection.send({
      type: 'ready',
      protocol: PROTOCOL,
      version: this.options.version,
      device: device.id,
    });
    this.options.events.open(connection);
    this.check = setInterval(
      () => void this.recheck(connection),
      this.options.checkIntervalMs ?? PAIRING_CHECK_INTERVAL_MS,
    );
  }

  private receive(connection: SecureConnection, session: SecureSession, data: Uint8Array): void {
    let plain: Uint8Array;
    try {
      plain = session.open(data);
    } catch {
      this.refuse(CLOSE_UNAUTHORIZED, 'unauthorized');
      return;
    }
    const message = decodeClientMessage(plain);
    if (message?.type !== 'request') {
      const unknown = readUnknownRequest(plain);
      if (unknown) {
        connection.send({
          type: 'reply',
          id: unknown.id,
          ok: false,
          error:
            'your computer runs an older remote-sheep that does not know "' +
            unknown.kind +
            '"; restart it',
        });
        return;
      }
      this.refuse(CLOSE_POLICY, 'malformed message');
      return;
    }
    // Every request is use, so the 24 hours count from the last one.
    this.options.pairing.touch(connection.device).catch((error: unknown) => {
      this.log('could not record device use: ' + String(error));
    });
    this.options.events.request(connection, message.request).then(
      (result) => connection.send({ type: 'reply', id: message.id, ok: true, result }),
      (err: unknown) =>
        connection.send({
          type: 'reply',
          id: message.id,
          ok: false,
          error: err instanceof Error ? err.message : String(err),
        }),
    );
  }

  private async recheck(connection: SecureConnection): Promise<void> {
    try {
      const state = await this.options.pairing.state(connection.device);
      if (state !== 'valid') this.refuse(CLOSE_PAIRING_EXPIRED, 'pairing ' + state);
    } catch (error) {
      // A registry that cannot be read right now is retried on the next tick
      // rather than dropping every phone on a transient file error.
      this.log('could not check device ' + connection.device + ': ' + String(error));
    }
  }

  private openFrame(session: SecureSession, data: Uint8Array): ClientMessage | null {
    try {
      return decodeClientMessage(session.open(data));
    } catch {
      return null;
    }
  }

  private refuse(code: number, reason: string): void {
    if (this.closed) return;
    this.closed = true;
    clearTimeout(this.deadline);
    this.link.close(code, reason);
  }

  private ended(): void {
    this.closed = true;
    clearTimeout(this.deadline);
    if (this.check) clearInterval(this.check);
    if (this.connection) this.options.events.close(this.connection);
  }

  private log(message: string): void {
    this.options.log?.(message);
  }
}

export class SecureChannel implements Channel {
  constructor(private readonly options: SecureChannelOptions) {}

  accept(link: Link): void {
    new PhoneLink(link, this.options);
  }
}
