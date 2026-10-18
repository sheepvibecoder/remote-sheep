import type { AccessCodes } from '../../src/L1_domain/ports/access-codes';
import type { RelaySocket, SocketRole } from '../../src/L1_domain/ports/relay-socket';
import type { RoomSockets } from '../../src/L1_domain/ports/room-sockets';
import type { RoomStore } from '../../src/L1_domain/ports/room-store';

export class FakeSocket implements RelaySocket {
  readonly sent: Uint8Array[] = [];
  closed: { code: number; reason: string } | null = null;
  private current: SocketRole | null = null;

  send(data: Uint8Array): void {
    this.sent.push(data);
  }
  close(code: number, reason: string): void {
    this.closed = { code, reason };
  }
  role(): SocketRole | null {
    return this.current;
  }
  setRole(role: SocketRole): void {
    this.current = role;
  }
}

export class FakeSockets implements RoomSockets {
  readonly list: FakeSocket[] = [];
  /** Like the platform: a socket is in the list once accepted, before the room names it. */
  accept(): FakeSocket {
    const socket = new FakeSocket();
    this.list.push(socket);
    return socket;
  }
  all(): RelaySocket[] {
    return this.list;
  }
}

export class FakeStore implements RoomStore {
  ownerHash: string | null = null;
  streams = 0;
  async owner(): Promise<string | null> {
    return this.ownerHash;
  }
  async setOwner(codeHash: string): Promise<void> {
    this.ownerHash = codeHash;
  }
  async nextStream(): Promise<number> {
    return ++this.streams;
  }
}

export class FakeCodes implements AccessCodes {
  constructor(public codes: string[]) {}
  issued(): readonly string[] {
    return this.codes;
  }
  async fingerprint(code: string): Promise<string> {
    return 'hash:' + code;
  }
}
