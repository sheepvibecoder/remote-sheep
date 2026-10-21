import { describe, expect, it } from 'vitest';
import { SECURITY_HEADERS } from '@remote-sheep/protocol';
import {
  handleWorkerRequest,
  type RoomNamespace,
  type WorkerEnv,
} from '../../../src/L3_periphery/cloudflare/relay-worker';

const ROOM = '0123456789abcdef';

function fakeEnv() {
  const asked: string[] = [];
  const forwarded: Request[] = [];
  const namespace: RoomNamespace = {
    idFromName: (name) => name,
    get: (id) => ({
      fetch: async (request) => {
        asked.push(id as string);
        forwarded.push(request);
        return new Response('forwarded');
      },
    }),
  };
  const served: string[] = [];
  const env: WorkerEnv = {
    RELAY: namespace,
    ASSETS: {
      fetch: async (request) => {
        served.push(new URL(request.url).pathname);
        return new Response('app');
      },
    },
  };
  return { env, asked, forwarded, served };
}

const upgrade = (path: string) =>
  new Request('https://relay.test' + path, { headers: { Upgrade: 'websocket' } });

describe('handleWorkerRequest', () => {
  it('adds the security headers to what the app assets answer', async () => {
    const { env } = fakeEnv();
    const response = await handleWorkerRequest(new Request('https://relay.test/'), env);
    expect(await response.text()).toBe('app');
    for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
      expect(response.headers.get(name), name).toBe(value);
    }
  });

  it('sends the agent socket to the room named in its path', async () => {
    const { env, asked } = fakeEnv();
    const response = await handleWorkerRequest(upgrade('/agent/' + ROOM), env);
    expect(await response.text()).toBe('forwarded');
    expect(asked).toEqual([ROOM]);
  });

  it('sends the phone socket to the room named in its query', async () => {
    const { env, asked } = fakeEnv();
    await handleWorkerRequest(upgrade('/ws?agent=' + ROOM), env);
    expect(asked).toEqual([ROOM]);
  });

  it.each(['/ws', '/ws?agent=', '/ws?agent=ABCDEF0123456789', '/agent/', '/agent/short'])(
    'answers 400 before upgrading for %s',
    async (path) => {
      const { env, asked } = fakeEnv();
      const response = await handleWorkerRequest(upgrade(path), env);
      expect(response.status).toBe(400);
      expect(asked).toEqual([]);
    },
  );

  it('answers 426 to a plain GET of a socket path', async () => {
    const { env } = fakeEnv();
    const response = await handleWorkerRequest(
      new Request('https://relay.test/ws?agent=' + ROOM),
      env,
    );
    expect(response.status).toBe(426);
  });

  it.each(['/', '/index.html', '/sw.js', '/other'])(
    'serves the phone app for %s without touching a room',
    async (path) => {
      const { env, asked, served } = fakeEnv();
      const response = await handleWorkerRequest(new Request('https://relay.test' + path), env);
      expect(await response.text()).toBe('app');
      expect(served).toEqual([path]);
      expect(asked).toEqual([]);
    },
  );

  it('does not serve the app for a socket path', async () => {
    const { env, served } = fakeEnv();
    await handleWorkerRequest(upgrade('/agent/' + ROOM), env);
    await handleWorkerRequest(new Request('https://relay.test/ws?agent=' + ROOM), env);
    expect(served).toEqual([]);
  });
});
