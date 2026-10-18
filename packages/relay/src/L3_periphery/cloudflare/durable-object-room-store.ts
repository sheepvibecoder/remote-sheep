import type { RoomStore } from '../../L1_domain/ports/room-store';
import type { DurableObjectStateLike } from './cloudflare-types';

const OWNER_KEY = 'owner';
const STREAM_KEY = 'stream';

export class DurableObjectRoomStore implements RoomStore {
  constructor(private readonly state: DurableObjectStateLike) {}

  async owner(): Promise<string | null> {
    const value = await this.state.storage.get(OWNER_KEY);
    return typeof value === 'string' ? value : null;
  }

  async setOwner(codeHash: string): Promise<void> {
    await this.state.storage.put(OWNER_KEY, codeHash);
  }

  async nextStream(): Promise<number> {
    const last = await this.state.storage.get(STREAM_KEY);
    const next = (typeof last === 'number' ? last : 0) + 1;
    await this.state.storage.put(STREAM_KEY, next);
    return next;
  }
}
