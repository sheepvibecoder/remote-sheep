/**
 * A raw, ordered pipe of binary messages to one phone. It knows nothing about
 * who is on the other end: the LAN socket today, a relay socket in stage 3.
 */
export interface Link {
  send(data: Uint8Array): void;
  close(code: number, reason: string): void;
  /** Set once, by the channel, as soon as the link is accepted. */
  onMessage(handler: (data: Uint8Array) => void): void;
  onClose(handler: () => void): void;
}

/** Where links come from. */
export interface LinkServer {
  start(accept: (link: Link) => void): Promise<void>;
  stop(): Promise<void>;
}

/**
 * Turns a link into an authenticated connection for the core: a paired phone
 * and an end-to-end encrypted session.
 */
export interface Channel {
  accept(link: Link): void;
}
