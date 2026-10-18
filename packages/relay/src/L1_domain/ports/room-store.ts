/** The little state of a room that must outlive its sockets. */
export interface RoomStore {
  /** SHA-256 hex of the access code that claimed the room, or null if nobody did. */
  owner(): Promise<string | null>;
  setOwner(codeHash: string): Promise<void>;
  /** A stream id never handed out before in this room. */
  nextStream(): Promise<number>;
}
