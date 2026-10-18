import type { IncomingMessage } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterEach, describe, expect, it } from 'vitest';
import WebSocket, { WebSocketServer } from 'ws';
import {
  decodeRelayEnvelope,
  encodeRelayEnvelope,
  type RelayEnvelope,
} from '@remote-sheep/protocol';
import type { Link } from '../../../src/L1_domain/ports/link';
import { RelayTransport } from '../../../src/L3_periphery/relay/relay-transport';

/** A relay stand-in: a real WebSocket server that records what the agent sends. */
class FakeRelay {
  readonly server: WebSocketServer;
  readonly sockets: WebSocket[] = [];
  readonly requests: IncomingMessage[] = [];
  readonly envelopes: RelayEnvelope[] = [];
  readonly texts: string[] = [];

  constructor(refuseWith?: number) {
    this.server = new WebSocketServer({
      port: 0,
      verifyClient: (info, done) => {
        this.requests.push(info.req);
        if (refuseWith === undefined) done(true);
        else done(false, refuseWith, 'refused');
      },
    });
    this.server.on('connection', (socket) => {
      this.sockets.push(socket);
      socket.on('message', (data, isBinary) => {
        if (!isBinary) {
          this.texts.push((data as Buffer).toString());
          return;
        }
        const envelope = decodeRelayEnvelope(new Uint8Array(data as Buffer));
        if (envelope) this.envelopes.push(envelope);
      });
    });
  }

  get url(): string {
    return 'http://127.0.0.1:' + (this.server.address() as AddressInfo).port;
  }

  send(envelope: RelayEnvelope): void {
    this.sockets.at(-1)?.send(encodeRelayEnvelope(envelope));
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

const FAST = { backoffInitialMs: 20, backoffMaxMs: 80, pingIntervalMs: 60_000 };

describe('RelayTransport', () => {
  let relay: FakeRelay | undefined;
  let transport: RelayTransport | undefined;

  afterEach(async () => {
    await transport?.stop();
    await relay?.close();
    transport = undefined;
    relay = undefined;
  });

  async function setup(
    accept: (link: Link) => void = () => {},
    extra: Partial<ConstructorParameters<typeof RelayTransport>[0]> = {},
    refuseWith?: number,
  ) {
    relay = new FakeRelay(refuseWith);
    transport = new RelayTransport({
      url: relay.url,
      room: '0123456789abcdef',
      code: 'secret-code',
      ...FAST,
      ...extra,
    });
    await transport.start(accept);
    return relay;
  }

  it('dials /agent/<room> with the access code as a bearer token', async () => {
    const fake = await setup();
    await until(() => fake.requests.length > 0);
    expect(fake.requests[0]?.url).toBe('/agent/0123456789abcdef');
    expect(fake.requests[0]?.headers.authorization).toBe('Bearer secret-code');
  });

  it('turns open into a link and moves data both ways byte for byte', async () => {
    const links: Link[] = [];
    const received: Uint8Array[] = [];
    const fake = await setup((link) => {
      links.push(link);
      link.onMessage((data) => received.push(data));
    });
    await until(() => fake.sockets.length > 0);
    fake.send({ kind: 'open', stream: 7 });
    await until(() => links.length === 1);
    fake.send({ kind: 'data', stream: 7, data: new Uint8Array([1, 2, 3]) });
    await until(() => received.length === 1);
    expect([...received[0]!]).toEqual([1, 2, 3]);

    links[0]!.send(new Uint8Array([9, 8]));
    await until(() => fake.envelopes.length === 1);
    expect(fake.envelopes[0]).toEqual({ kind: 'data', stream: 7, data: new Uint8Array([9, 8]) });
  });

  it('keeps phones apart by stream', async () => {
    const received: Record<number, number[]> = {};
    let opened = 0;
    const fake = await setup((link) => {
      const id = ++opened;
      link.onMessage((data) => (received[id] = [...data]));
    });
    await until(() => fake.sockets.length > 0);
    fake.send({ kind: 'open', stream: 1 });
    fake.send({ kind: 'open', stream: 2 });
    fake.send({ kind: 'data', stream: 2, data: new Uint8Array([2]) });
    fake.send({ kind: 'data', stream: 1, data: new Uint8Array([1]) });
    await until(() => Object.keys(received).length === 2);
    expect(received).toEqual({ 1: [1], 2: [2] });
  });

  it('sends a close envelope with the code the channel chose', async () => {
    const links: Link[] = [];
    const fake = await setup((link) => links.push(link));
    await until(() => fake.sockets.length > 0);
    fake.send({ kind: 'open', stream: 3 });
    await until(() => links.length === 1);
    links[0]!.close(4003, 'revoked');
    await until(() => fake.envelopes.length === 1);
    expect(fake.envelopes[0]).toEqual({ kind: 'close', stream: 3, code: 4003, reason: 'revoked' });
  });

  it('reports the end of a link when the phone leaves, and ignores later data', async () => {
    let ended = 0;
    const received: Uint8Array[] = [];
    const fake = await setup((link) => {
      link.onClose(() => ended++);
      link.onMessage((data) => received.push(data));
    });
    await until(() => fake.sockets.length > 0);
    fake.send({ kind: 'open', stream: 4 });
    fake.send({ kind: 'close', stream: 4, code: 1000, reason: '' });
    await until(() => ended === 1);
    fake.send({ kind: 'data', stream: 4, data: new Uint8Array([1]) });
    fake.send({ kind: 'data', stream: 99, data: new Uint8Array([1]) });
    await new Promise((r) => setTimeout(r, 60));
    expect(received).toEqual([]);
    expect(ended).toBe(1);
  });

  it('closes every link when the relay socket drops, and reconnects', async () => {
    let ended = 0;
    const fake = await setup((link) => link.onClose(() => ended++));
    await until(() => fake.sockets.length > 0);
    fake.send({ kind: 'open', stream: 1 });
    fake.send({ kind: 'open', stream: 2 });
    await new Promise((r) => setTimeout(r, 40));
    fake.sockets[0]!.terminate();
    await until(() => ended === 2);
    await until(() => fake.sockets.length === 2);
  });

  it('does not reconnect or report connected after the relay answers 403', async () => {
    const logs: string[] = [];
    const states: string[] = [];
    const fake = await setup(
      () => {},
      { log: (m) => logs.push(m), onState: (s) => states.push(s) },
      403,
    );
    await until(() => fake.requests.length > 0);
    await new Promise((r) => setTimeout(r, 250));
    expect(fake.requests).toHaveLength(1);
    expect(states).not.toContain('connected');
    expect(logs.join('\n')).toMatch(/refused this agent: check the access code/);
  });

  it.each([500, 503])('retries with backoff when the relay answers %i', async (status) => {
    const states: string[] = [];
    const fake = await setup(() => {}, { onState: (s) => states.push(s) }, status);
    await until(() => fake.requests.length >= 3);
    expect(states).not.toContain('connected');
  });

  it('pings on the interval and ignores a pong', async () => {
    const logs: string[] = [];
    const fake = await setup(() => {}, { pingIntervalMs: 30, log: (m) => logs.push(m) });
    await until(() => fake.sockets.length > 0);
    await until(() => fake.texts.length >= 2);
    expect(fake.texts.every((text) => text === 'ping')).toBe(true);
    fake.sockets[0]!.send('pong');
    await new Promise((r) => setTimeout(r, 40));
    expect(logs).toEqual([]);
  });

  it('logs other text from the relay only once', async () => {
    const logs: string[] = [];
    const fake = await setup(() => {}, { log: (m) => logs.push(m) });
    await until(() => fake.sockets.length > 0);
    fake.sockets[0]!.send('hello');
    fake.sockets[0]!.send('again');
    await new Promise((r) => setTimeout(r, 60));
    expect(logs.filter((m) => m.includes('unexpected'))).toHaveLength(1);
  });

  it('reports connected and disconnected states', async () => {
    const states: string[] = [];
    const fake = await setup(() => {}, { onState: (s) => states.push(s) });
    await until(() => states.includes('connected'));
    fake.sockets[0]!.terminate();
    await until(() => states.includes('disconnected'));
  });

  it('stop closes the socket, ends links and stops reconnecting', async () => {
    let ended = 0;
    const fake = await setup((link) => link.onClose(() => ended++));
    await until(() => fake.sockets.length > 0);
    fake.send({ kind: 'open', stream: 1 });
    await new Promise((r) => setTimeout(r, 40));
    await transport!.stop();
    expect(ended).toBe(1);
    await new Promise((r) => setTimeout(r, 200));
    expect(fake.requests).toHaveLength(1);
  });
});
