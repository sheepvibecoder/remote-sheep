/** What a socket of a room is for. Survives hibernation, so the room never keeps it in memory. */
export type SocketRole =
  | { readonly role: 'agent' }
  | { readonly role: 'phone'; readonly stream: number }
  /** Closed by the relay itself: the close event that follows must not be relayed again. */
  | { readonly role: 'closed' };

/** One accepted WebSocket of a room, agent or phone. */
export interface RelaySocket {
  send(data: Uint8Array): void;
  close(code: number, reason: string): void;
  /** Null until the room has decided what the socket is. */
  role(): SocketRole | null;
  setRole(role: SocketRole): void;
}
