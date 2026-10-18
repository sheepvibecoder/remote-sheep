import type { Request, ServerMessage } from '@remote-sheep/protocol';

/** One phone, already authenticated by its channel. */
export interface Connection {
  /** Who is on the other end: the paired device's id (`publicKeyId` of its key). */
  readonly device: string;
  send(message: ServerMessage): void;
  close(code: number, reason: string): void;
}

/** What the core offers a channel. The channel owns auth and framing. */
export interface ConnectionEvents {
  open(connection: Connection): void;
  request(connection: Connection, request: Request): Promise<unknown>;
  close(connection: Connection): void;
}
