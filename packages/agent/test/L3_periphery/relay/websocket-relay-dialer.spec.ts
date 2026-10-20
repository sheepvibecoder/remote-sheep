import type { IncomingMessage } from 'node:http';
import { createServer, type AddressInfo, type Server, type Socket } from 'node:net';
import { afterEach, describe, expect, it } from 'vitest';
import { WebSocketServer } from 'ws';
import { WebSocketRelayDialer } from '../../../src/L3_periphery/relay/websocket-relay-dialer';

/** A relay stand-in that records who dialled it and with which code. */
class FakeRelay {
  readonly server: WebSocketServer;
  readonly requests: IncomingMessage[] = [];
  open = 0;

  /** Accepts only `code` when given, refusing others with HTTP 403 as the real relay does. */
  constructor(code?: string) {
    this.server = new WebSocketServer({
      port: 0,
      verifyClient: (info, done) => {
        if (code === undefined || info.req.headers.authorization === 'Bearer ' + code) done(true);
        else done(false, 403, 'access refused');
      },
    });
    this.server.on('connection', (socket, request) => {
      this.requests.push(request);
      this.open++;
      socket.on('close', () => this.open--);
    });
  }

  get url(): string {
    return 'http://127.0.0.1:' + String((this.server.address() as AddressInfo).port);
  }

  async close(): Promise<void> {
    for (const client of this.server.clients) client.terminate();
    await new Promise<void>((done) => this.server.close(() => done()));
  }
}

async function until(check: () => boolean, tries = 150) {
  for (let i = 0; i < tries && !check(); i++) await new Promise((r) => setTimeout(r, 20));
  if (!check()) throw new Error('condition not reached in time');
}

const closers: (() => Promise<void>)[] = [];
afterEach(async () => {
  for (const close of closers.splice(0)) await close();
});

function relay(code?: string) {
  const fake = new FakeRelay(code);
  closers.push(() => fake.close());
  return fake;
}

function dialer(logs: string[] = []) {
  const made = new WebSocketRelayDialer({
    room: 'room1',
    accept: () => undefined,
    log: (line) => logs.push(line),
  });
  closers.push(() => made.hangUp());
  return made;
}

describe('WebSocketRelayDialer', () => {
  it('dials the room with the code, reports the socket open, and hangs up', async () => {
    const fake = relay();
    const relayDialer = dialer();
    expect(relayDialer.connected()).toBe(false);
    await relayDialer.dial({ url: fake.url, code: 'c0de' });
    await until(() => relayDialer.connected());
    expect(fake.requests[0]?.url).toBe('/agent/room1');
    expect(fake.requests[0]?.headers.authorization).toBe('Bearer c0de');
    await relayDialer.hangUp();
    expect(relayDialer.connected()).toBe(false);
    await until(() => fake.open === 0);
  });

  it('replaces the earlier relay when another is dialled, with no restart', async () => {
    const first = relay();
    const second = relay();
    const relayDialer = dialer();
    await relayDialer.dial({ url: first.url, code: 'one' });
    await until(() => first.open === 1);
    await relayDialer.dial({ url: second.url, code: 'two' });
    await until(() => second.open === 1 && first.open === 0);
    expect(second.requests[0]?.headers.authorization).toBe('Bearer two');
    await until(() => relayDialer.connected());
  });

  it('logs the relay state with its URL and never the access code', async () => {
    const fake = relay();
    const logs: string[] = [];
    const relayDialer = dialer(logs);
    await relayDialer.dial({ url: fake.url, code: 'secret-code-123' });
    await until(() => relayDialer.connected());
    await relayDialer.hangUp();
    expect(logs).toContain('relay connected (' + fake.url + ')');
    expect(logs.join('\n')).not.toContain('secret-code-123');
  });
});

describe('WebSocketRelayDialer outcome', () => {
  it('reports connected once the relay accepts', async () => {
    const fake = relay('c0de');
    const relayDialer = dialer();
    await relayDialer.dial({ url: fake.url, code: 'c0de' });
    expect(await relayDialer.settled(2000)).toEqual({ connected: true, problem: null });
  });

  it('says the relay refused the access code, without repeating it', async () => {
    const fake = relay('right');
    const logs: string[] = [];
    const relayDialer = dialer(logs);
    await relayDialer.dial({ url: fake.url, code: 'wrong-code-77' });
    const outcome = await relayDialer.settled(2000);
    expect(outcome.connected).toBe(false);
    expect(outcome.problem).toMatch(/refused the access code/);
    expect(JSON.stringify(outcome) + logs.join(' ')).not.toContain('wrong-code-77');
    expect(relayDialer.problem()).toBe(outcome.problem);
  });

  it('says the relay cannot be reached', async () => {
    const closed = await listening(createServer());
    const port = (closed.address() as AddressInfo).port;
    await new Promise<void>((done) => closed.close(() => done()));
    const relayDialer = dialer();
    await relayDialer.dial({ url: 'http://127.0.0.1:' + String(port), code: 'c0de' });
    const outcome = await relayDialer.settled(2000);
    expect(outcome.connected).toBe(false);
    expect(outcome.problem).toMatch(/^Cannot reach the relay/);
  });

  it('says it is still connecting when the relay is slow to answer', async () => {
    const held: Socket[] = [];
    const silent = await listening(createServer((socket) => held.push(socket)));
    closers.push(() => {
      for (const socket of held) socket.destroy();
      return new Promise<void>((done) => silent.close(() => done()));
    });
    const relayDialer = dialer();
    const port = (silent.address() as AddressInfo).port;
    await relayDialer.dial({ url: 'http://127.0.0.1:' + String(port), code: 'c0de' });
    const began = Date.now();
    expect(await relayDialer.settled(200)).toEqual({ connected: false, problem: null });
    expect(Date.now() - began).toBeLessThan(1500);
  });
});

async function listening(server: Server): Promise<Server> {
  await new Promise<void>((done) => server.listen(0, '127.0.0.1', () => done()));
  return server;
}
