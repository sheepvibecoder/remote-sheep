// The Worker in front of everything: validates the room id and forwards the upgrade to the
// room's Durable Object, and hands every other path to Workers Static Assets (the phone app).
//
// The Worker runs first for every request (`run_worker_first = true`) on purpose: with only the
// socket paths listed, Cloudflare's asset router failed every WebSocket upgrade with an HTTP 500
// ("Callback returned incorrect type; expected 'Promise'") before this code ran.

import { SECURITY_HEADERS } from '@remote-sheep/protocol';
import { isRoomId } from '../../L1_domain/room-id';

export interface RoomStub {
  fetch(request: Request): Promise<Response>;
}

export interface RoomNamespace {
  idFromName(name: string): unknown;
  get(id: unknown): RoomStub;
}

export interface AssetFetcher {
  fetch(request: Request): Promise<Response>;
}

export interface WorkerEnv {
  readonly RELAY: RoomNamespace;
  readonly ASSETS: AssetFetcher;
}

// The asset response may be immutable, so the headers go on a copy.
function withSecurityHeaders(response: Response): Response {
  const secured = new Response(response.body, response);
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) secured.headers.set(name, value);
  return secured;
}

const AGENT_PATH = /^\/agent\/([^/]*)$/;

export function handleWorkerRequest(request: Request, env: WorkerEnv): Promise<Response> {
  const url = new URL(request.url);
  const agentRoom = AGENT_PATH.exec(url.pathname)?.[1] ?? null;
  const room = agentRoom ?? (url.pathname === '/ws' ? url.searchParams.get('agent') : undefined);
  if (room === undefined) return env.ASSETS.fetch(request).then(withSecurityHeaders);
  if (!isRoomId(room)) return Promise.resolve(new Response('Invalid room id', { status: 400 }));
  if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') {
    return Promise.resolve(new Response('Expected a WebSocket upgrade', { status: 426 }));
  }
  return env.RELAY.get(env.RELAY.idFromName(room)).fetch(request);
}
