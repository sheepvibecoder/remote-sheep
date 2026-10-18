// The Durable Object of one room. Thin on purpose: it accepts sockets with the Hibernation API
// and hands every event to RelayRoom, which holds the rules.

import { RelayRoom } from '../../L2_application/relay-room';
import { CloudflareRoomSockets } from './cloudflare-room-sockets';
import { workerdPlatform } from './cloudflare-platform';
import { CloudflareSocket } from './cloudflare-socket';
import type {
  DurableObjectStateLike,
  RelayEnv,
  WebSocketLike,
  WorkerPlatform,
} from './cloudflare-types';
import { DurableObjectRoomStore } from './durable-object-room-store';
import { EnvAccessCodes } from './env-access-codes';

const BEARER = /^Bearer (.+)$/;

export class RelayDurableObject {
  private readonly room: RelayRoom;

  /** workerd constructs it with (state, env); the platform is a seam for tests. */
  constructor(
    private readonly state: DurableObjectStateLike,
    env: RelayEnv,
    private readonly platform: WorkerPlatform = workerdPlatform,
  ) {
    this.room = new RelayRoom(
      new CloudflareRoomSockets(state),
      new DurableObjectRoomStore(state),
      new EnvAccessCodes(env),
    );
    state.setWebSocketAutoResponse(platform.keepaliveAutoResponse());
  }

  async fetch(request: Request): Promise<Response> {
    if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') {
      return new Response('Expected a WebSocket upgrade', { status: 426 });
    }
    const isAgent = new URL(request.url).pathname.startsWith('/agent/');
    // Refusals are plain HTTP responses decided before a socket exists: a socket closed inside
    // the upgrade keeps its TCP connection open, so clients would learn of it ~10-30 s late.
    let ticket: string | null = null;
    if (isAgent) {
      const code = BEARER.exec(request.headers.get('Authorization') ?? '')?.[1] ?? null;
      ticket = await this.room.admitAgent(code);
      if (ticket === null) return new Response('access refused', { status: 403 });
    } else if (!this.room.agentOnline()) {
      return new Response('agent offline', { status: 503 });
    }
    const { client, server } = this.platform.createPair();
    this.state.acceptWebSocket(server);
    const socket = new CloudflareSocket(server);
    if (ticket !== null) await this.room.connectAgent(socket, ticket);
    else await this.room.connectPhone(socket);
    return this.platform.upgradeResponse(client);
  }

  webSocketMessage(socket: WebSocketLike, message: string | ArrayBuffer): void {
    this.room.onMessage(new CloudflareSocket(socket), message);
  }

  webSocketClose(socket: WebSocketLike, code: number): void {
    this.room.onClose(new CloudflareSocket(socket), code);
  }

  webSocketError(socket: WebSocketLike): void {
    this.room.onError(new CloudflareSocket(socket));
  }
}
