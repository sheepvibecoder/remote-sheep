import type { RelaySocket } from '../../L1_domain/ports/relay-socket';
import type { RoomSockets } from '../../L1_domain/ports/room-sockets';
import { CloudflareSocket } from './cloudflare-socket';
import type { DurableObjectStateLike } from './cloudflare-types';

/** The sockets the runtime keeps for a Durable Object, awake or hibernating. */
export class CloudflareRoomSockets implements RoomSockets {
  constructor(private readonly state: DurableObjectStateLike) {}

  all(): RelaySocket[] {
    return this.state.getWebSockets().map((socket) => new CloudflareSocket(socket));
  }
}
