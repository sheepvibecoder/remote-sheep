import type { IncomingMessage } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterEach, describe, expect, it } from 'vitest';
import { WebSocketServer } from 'ws';
import { WebSocketRelayDialer } from '../../../src/L3_periphery/relay/websocket-relay-dialer';

/** A relay stand-in that records who dialled it and with which code. */
class FakeRelay {
  readonly server = new WebSocketServer({ port: 0 });
  readonly requests: IncomingMessage[] = [];
  open = 0;

  constructor() {
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

function relay() {
  const fake = new FakeRelay();
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
