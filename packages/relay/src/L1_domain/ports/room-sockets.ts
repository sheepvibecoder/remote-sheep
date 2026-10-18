import type { RelaySocket } from './relay-socket';

/** The sockets a room currently holds, as the platform remembers them across hibernation. */
export interface RoomSockets {
  all(): RelaySocket[];
}
