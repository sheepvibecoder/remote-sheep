// Binds WorkerPlatform to workerd globals. Only workerd has `WebSocketPair`, so this file is
// exercised by `wrangler dev`, not by the unit tests.

import { RELAY_PING, RELAY_PONG } from '@remote-sheep/protocol';
import type { WebSocketLike, WorkerPlatform } from './cloudflare-types';

export const workerdPlatform: WorkerPlatform = {
  createPair() {
    const pair = new WebSocketPair();
    return { client: pair[0], server: pair[1] as unknown as WebSocketLike };
  },
  upgradeResponse(client) {
    return new Response(null, { status: 101, webSocket: client as WebSocket });
  },
  keepaliveAutoResponse() {
    return new WebSocketRequestResponsePair(RELAY_PING, RELAY_PONG);
  },
};
