import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CLOSE_PAIRING_EXPIRED,
  CLOSE_PROTOCOL,
  CLOSE_UNAUTHORIZED,
  decodeServerMessage,
  decodeWelcome,
  encodeClientMessage,
  encodeFrame,
  encodeHello,
  generateKeyPair,
  pairingProof,
  PROTOCOL,
  publicKeyId,
  startHandshake,
  type ClientMessage,
  type KeyPair,
  type PhoneHandshake,
  type Request,
  type SecureSession,
} from '@remote-sheep/protocol';
import type { Connection, ConnectionEvents } from '../../../src/L1_domain/ports/connection';
import type { Link } from '../../../src/L1_domain/ports/link';
import { PairingService } from '../../../src/L2_application/pairing-service';
import { SecureChannel } from '../../../src/L3_periphery/channel/secure-channel';
import { MemoryDeviceRegistry } from '../../fakes/memory-device-registry';

const T0 = 1_700_000_000_000;
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const CHECK_MS = 5000;

class FakeLink implements Link {
  sent: Uint8Array[] = [];
  closed: [number, string] | null = null;
  private message: (data: Uint8Array) => void = () => {};
  private end: () => void = () => {};

  send(data: Uint8Array) {
    this.sent.push(data);
  }
  close(code: number, reason: string) {
    if (this.closed) return;
    this.closed = [code, reason];
    this.end();
  }
  onMessage(handler: (data: Uint8Array) => void) {
    this.message = handler;
  }
  onClose(handler: () => void) {
    this.end = handler;
  }
  deliver(data: Uint8Array) {
    this.message(data);
  }
}

/** Plays the phone with the protocol package's own handshake, as the app does. */
class Phone {
  readonly link = new FakeLink();
  session: SecureSession | null = null;
  private handshake: PhoneHandshake | null = null;
  private read = 1;

  constructor(readonly keys: KeyPair = generateKeyPair()) {}

  get id() {
    return publicKeyId(this.keys.publicKey);
  }

  hello(pair: boolean) {
    this.handshake = startHandshake(this.keys, pair);
    this.link.deliver(encodeHello(this.handshake.hello));
  }

  /** Completes the handshake against the agent key the phone trusts. */
  finish(agentKey: Uint8Array) {
    const welcome = decodeWelcome(this.link.sent[0]!);
    if (!welcome || !this.handshake) throw new Error('no welcome');
    this.session = this.handshake.finish(welcome, agentKey);
    return this.session;
  }

  sealed(message: ClientMessage) {
    return this.session!.seal(encodeClientMessage(message));
  }

  send(message: ClientMessage) {
    this.link.deliver(this.sealed(message));
  }

  /** Decrypts every frame the agent sent since the last call. */
  inbox() {
    const fresh = this.link.sent.slice(this.read);
    this.read = this.link.sent.length;
    return fresh.map((data) => decodeServerMessage(this.session!.open(data)));
  }
}

interface Log {
  opened: Connection[];
  requests: Request[];
  closed: Connection[];
}

function events(log: Log): ConnectionEvents {
  return {
    open: (connection) => {
      log.opened.push(connection);
    },
    request: async (_connection, request) => {
      log.requests.push(request);
      if (request.kind === 'image') return { media: 'image/png', data: new Uint8Array([137, 80]) };
      if (request.kind === 'prompt') return undefined;
      throw new Error('boom');
    },
    close: (connection) => {
      log.closed.push(connection);
    },
  };
}

function setup() {
  const registry = new MemoryDeviceRegistry();
  const clock = { time: T0, now: () => clock.time };
  const random = { bytes: (n: number) => crypto.getRandomValues(new Uint8Array(n)) };
  const agent = generateKeyPair();
  const pairing = new PairingService({ registry, clock, random, agentKey: agent.publicKey });
  const log: Log = { opened: [], requests: [], closed: [] };
  const channel = new SecureChannel({
    keys: agent,
    pairing,
    version: '0.3.0',
    events: events(log),
    authTimeoutMs: 1000,
    checkIntervalMs: CHECK_MS,
  });
  const connect = (phone = new Phone()) => {
    channel.accept(phone.link);
    return phone;
  };
  const pairedPhone = async (pairedAt = T0, lastSeen = T0) => {
    const phone = new Phone();
    await registry.save({ id: phone.id, publicKey: phone.keys.publicKey, pairedAt, lastSeen });
    return connect(phone);
  };
  return { registry, clock, pairing, agent, log, connect, pairedPhone };
}

// The registry is in memory, so every pending step ends within one macrotask.
const flush = () => vi.advanceTimersByTimeAsync(0);

/** Runs the whole pairing as a phone that scanned `invite`. */
async function pair(phone: Phone, agentKey: Uint8Array, secret: Uint8Array) {
  phone.hello(true);
  await flush();
  const session = phone.finish(agentKey);
  phone.send({ type: 'confirm', proof: pairingProof(secret, session.transcript) });
  await flush();
}

function expectRefused(phone: Phone, log: Log, code: number) {
  expect(phone.link.closed?.[0]).toBe(code);
  expect(log.opened).toEqual([]);
  expect(log.requests).toEqual([]);
  expect(log.closed).toEqual([]);
}

describe('SecureChannel', () => {
  beforeEach(() => vi.useFakeTimers({ now: T0 }));
  afterEach(() => vi.useRealTimers());

  it('pairs a phone from a QR, then serves sealed requests and replies', async () => {
    const { pairing, agent, log, connect, registry } = setup();
    const invite = pairing.createInvite();
    const phone = connect();

    await pair(phone, agent.publicKey, invite.secret);

    expect(phone.link.closed).toBeNull();
    expect(phone.inbox()).toEqual([
      { type: 'ready', protocol: PROTOCOL, version: '0.3.0', device: phone.id },
    ]);
    expect(log.opened.map((c) => c.device)).toEqual([phone.id]);
    expect(await registry.list()).toEqual([
      { id: phone.id, publicKey: phone.keys.publicKey, pairedAt: T0, lastSeen: T0 },
    ]);

    phone.send({ type: 'request', id: 1, request: { kind: 'prompt', target: 'p', text: 'hola' } });
    phone.send({ type: 'request', id: 2, request: { kind: 'keys', target: 'p', keys: ['esc'] } });
    phone.send({ type: 'request', id: 3, request: { kind: 'image', target: 'p', id: 'u:0' } });
    phone.send({
      type: 'request',
      id: 4,
      request: { kind: 'upload', media: 'image/jpeg', data: new Uint8Array([1, 2, 3]) },
    });
    await flush();
    expect(phone.inbox()).toEqual([
      { type: 'reply', id: 1, ok: true },
      { type: 'reply', id: 2, ok: false, error: 'boom' },
      {
        type: 'reply',
        id: 3,
        ok: true,
        result: { media: 'image/png', data: new Uint8Array([137, 80]) },
      },
      { type: 'reply', id: 4, ok: false, error: 'boom' },
    ]);
    expect(log.requests[3]).toEqual({
      kind: 'upload',
      media: 'image/jpeg',
      data: new Uint8Array([1, 2, 3]),
    });

    log.opened[0]!.send({ type: 'status', herdrError: null });
    expect(phone.inbox()).toEqual([{ type: 'status', herdrError: null }]);
    phone.link.close(1000, 'bye');
    expect(log.closed).toEqual(log.opened);
  });

  it('lets a paired phone reconnect without an invite, and records the use', async () => {
    const { agent, log, pairedPhone, registry, clock } = setup();
    clock.time = T0 + HOUR;
    const phone = await pairedPhone();

    phone.hello(false);
    await flush();
    phone.finish(agent.publicKey);
    phone.send({ type: 'confirm' });
    await flush();

    expect(phone.inbox()).toEqual([
      { type: 'ready', protocol: PROTOCOL, version: '0.3.0', device: phone.id },
    ]);
    expect(log.opened.map((c) => c.device)).toEqual([phone.id]);
    expect(registry.touches).toEqual([[phone.id, T0 + HOUR]]);
  });

  it('closes an unpaired phone with 4001 before answering it', async () => {
    const { log, connect, registry } = setup();
    const phone = connect();
    phone.hello(false);
    await flush();
    expectRefused(phone, log, CLOSE_UNAUTHORIZED);
    expect(phone.link.sent).toEqual([]);
    expect(await registry.list()).toEqual([]);
  });

  it('closes a phone whose pairing expired, by idleness or by age, with 4003', async () => {
    const { log, pairedPhone, clock } = setup();
    clock.time = T0 + DAY;
    const idle = await pairedPhone(T0, T0);
    idle.hello(false);
    await flush();
    expectRefused(idle, log, CLOSE_PAIRING_EXPIRED);
    expect(idle.link.sent).toEqual([]);

    clock.time = T0 + 7 * DAY;
    const old = await pairedPhone(T0, T0 + 7 * DAY - HOUR);
    old.hello(false);
    await flush();
    expectRefused(old, log, CLOSE_PAIRING_EXPIRED);
    expect(old.link.sent).toEqual([]);
  });

  it('closes a revoked phone with 4003 when it reconnects', async () => {
    const { log, pairedPhone, registry } = setup();
    const phone = await pairedPhone();
    await registry.remove(phone.id);
    phone.hello(false);
    await flush();
    expectRefused(phone, log, CLOSE_PAIRING_EXPIRED);
    expect(phone.link.sent).toEqual([]);
  });

  it('closes a connected phone with 4003 within the check interval once it is revoked', async () => {
    const { agent, log, pairedPhone, registry } = setup();
    const phone = await pairedPhone();
    phone.hello(false);
    await flush();
    phone.finish(agent.publicKey);
    phone.send({ type: 'confirm' });
    await flush();
    expect(log.opened).toHaveLength(1);

    await vi.advanceTimersByTimeAsync(CHECK_MS);
    expect(phone.link.closed).toBeNull();
    await registry.remove(phone.id);
    await vi.advanceTimersByTimeAsync(CHECK_MS);
    expect(phone.link.closed?.[0]).toBe(CLOSE_PAIRING_EXPIRED);
    expect(log.closed).toEqual(log.opened);
  });

  it('closes a phone unlinked from another phone with 4003 on its next re-check', async () => {
    const { agent, log, pairedPhone, pairing, connect } = setup();
    const phone = await pairedPhone();
    phone.hello(false);
    await flush();
    phone.finish(agent.publicKey);
    phone.send({ type: 'confirm' });
    await flush();

    await vi.advanceTimersByTimeAsync(CHECK_MS - 1);
    await pairing.unlink(phone.id);
    expect(phone.link.closed).toBeNull();
    await vi.advanceTimersByTimeAsync(1);
    expect(phone.link.closed).toEqual([CLOSE_PAIRING_EXPIRED, 'pairing revoked']);
    expect(log.closed).toEqual(log.opened);

    // A phone that comes back after an unlink gets the same code.
    const back = new Phone(phone.keys);
    connect(back);
    back.hello(false);
    await flush();
    expect(back.link.closed?.[0]).toBe(CLOSE_PAIRING_EXPIRED);
  });

  it('closes a connected phone with 4003 once its pairing expires', async () => {
    const { agent, log, pairedPhone, clock } = setup();
    const phone = await pairedPhone();
    phone.hello(false);
    await flush();
    phone.finish(agent.publicKey);
    phone.send({ type: 'confirm' });
    await flush();

    clock.time = T0 + DAY;
    await vi.advanceTimersByTimeAsync(CHECK_MS);
    expect(phone.link.closed?.[0]).toBe(CLOSE_PAIRING_EXPIRED);
    expect(log.closed).toEqual(log.opened);
  });

  it('refuses a QR secret that already paired a phone', async () => {
    const { pairing, agent, log, connect, registry } = setup();
    const invite = pairing.createInvite();
    const first = connect();
    await pair(first, agent.publicKey, invite.secret);
    log.opened.length = 0;

    const second = connect();
    second.hello(true);
    await flush();
    expectRefused(second, log, CLOSE_UNAUTHORIZED);
    expect(second.link.sent).toEqual([]);
    expect((await registry.list()).map((d) => d.id)).toEqual([first.id]);
  });

  it('refuses a QR secret older than 5 minutes', async () => {
    const { pairing, log, connect, registry, clock } = setup();
    const invite = pairing.createInvite();
    clock.time = invite.expiresAt;
    const phone = connect();
    phone.hello(true);
    await flush();
    expectRefused(phone, log, CLOSE_UNAUTHORIZED);
    expect(phone.link.sent).toEqual([]);
    expect(await registry.list()).toEqual([]);
  });

  it('closes a wrong pairing proof with 4001 and burns the QR', async () => {
    const { pairing, agent, log, connect, registry } = setup();
    pairing.createInvite();
    const guesser = connect();
    await pair(guesser, agent.publicKey, new Uint8Array(32).fill(7));
    expectRefused(guesser, log, CLOSE_UNAUTHORIZED);
    expect(guesser.link.sent).toHaveLength(1); // the welcome, and nothing sealed

    const owner = connect();
    owner.hello(true);
    await flush();
    expectRefused(owner, log, CLOSE_UNAUTHORIZED);
    expect(await registry.list()).toEqual([]);
  });

  it('refuses a pairing confirm that carries no proof', async () => {
    const { pairing, agent, log, connect, registry } = setup();
    pairing.createInvite();
    const phone = connect();
    phone.hello(true);
    await flush();
    phone.finish(agent.publicKey);
    phone.send({ type: 'confirm' });
    await flush();
    expectRefused(phone, log, CLOSE_UNAUTHORIZED);
    expect(await registry.list()).toEqual([]);
  });

  it('closes on a replayed sealed frame, after serving the original once', async () => {
    const { pairing, agent, log, connect } = setup();
    const invite = pairing.createInvite();
    const phone = connect();
    await pair(phone, agent.publicKey, invite.secret);

    const frame = phone.sealed({
      type: 'request',
      id: 1,
      request: { kind: 'prompt', target: 'p', text: 'rm' },
    });
    phone.link.deliver(frame);
    phone.link.deliver(frame);
    await flush();
    expect(phone.link.closed?.[0]).toBe(CLOSE_UNAUTHORIZED);
    expect(log.requests).toEqual([{ kind: 'prompt', target: 'p', text: 'rm' }]);
    expect(log.closed).toEqual(log.opened);
  });

  it('closes on a tampered sealed frame without handing it to the core', async () => {
    const { pairing, agent, log, connect } = setup();
    const invite = pairing.createInvite();
    const phone = connect();
    await pair(phone, agent.publicKey, invite.secret);

    const frame = phone.sealed({
      type: 'request',
      id: 1,
      request: { kind: 'prompt', target: 'p', text: 'ls' },
    });
    frame[3] = frame[3]! ^ 1;
    phone.link.deliver(frame);
    await flush();
    expect(phone.link.closed?.[0]).toBe(CLOSE_UNAUTHORIZED);
    expect(log.requests).toEqual([]);
    expect(log.closed).toEqual(log.opened);
  });

  it('closes a stage 1 token hello with 4001', async () => {
    const { log, connect } = setup();
    const phone = connect();
    phone.link.deliver(encodeFrame({ type: 'hello', protocol: 1, token: 'a'.repeat(32) }));
    await flush();
    expectRefused(phone, log, CLOSE_UNAUTHORIZED);
    expect(phone.link.sent).toEqual([]);
  });

  it('closes a phone that speaks another protocol with 4002', async () => {
    const { pairing, log, connect } = setup();
    pairing.createInvite();
    const phone = connect();
    const handshake = startHandshake(phone.keys, true);
    phone.link.deliver(encodeHello({ ...handshake.hello, protocol: PROTOCOL + 1 }));
    await flush();
    expectRefused(phone, log, CLOSE_PROTOCOL);
    expect(phone.link.sent).toEqual([]);
  });

  it('never opens the core for a phone that trusts another agent key (man in the middle)', async () => {
    const { pairing, log, connect, registry } = setup();
    const invite = pairing.createInvite();
    const phone = connect();
    await pair(phone, generateKeyPair().publicKey, invite.secret);
    expectRefused(phone, log, CLOSE_UNAUTHORIZED);
    expect(phone.link.sent).toHaveLength(1);
    expect(await registry.list()).toEqual([]);
  });

  it('closes a handshake frame larger than 4 KB with 4001', async () => {
    const { log, connect } = setup();
    const phone = connect();
    phone.link.deliver(new Uint8Array(4097));
    await flush();
    expectRefused(phone, log, CLOSE_UNAUTHORIZED);

    const { agent, log: log2, pairedPhone } = setup();
    const paired = await pairedPhone();
    paired.hello(false);
    await flush();
    paired.finish(agent.publicKey);
    paired.link.deliver(new Uint8Array(4097));
    await flush();
    expectRefused(paired, log2, CLOSE_UNAUTHORIZED);
  });

  it('closes a handshake that does not finish in time with 4001', async () => {
    const silent = setup();
    const quiet = silent.connect();
    await vi.advanceTimersByTimeAsync(1000);
    expectRefused(quiet, silent.log, CLOSE_UNAUTHORIZED);

    const { log, pairedPhone } = setup();
    const phone = await pairedPhone();
    phone.hello(false);
    await vi.advanceTimersByTimeAsync(999);
    expect(phone.link.closed).toBeNull();
    await vi.advanceTimersByTimeAsync(1);
    expectRefused(phone, log, CLOSE_UNAUTHORIZED);
  });

  it('closes a phone that sends a request instead of the confirm', async () => {
    const { agent, log, pairedPhone } = setup();
    const phone = await pairedPhone();
    phone.hello(false);
    await flush();
    phone.finish(agent.publicKey);
    phone.send({ type: 'request', id: 1, request: { kind: 'prompt', target: 'p', text: 'x' } });
    await flush();
    expectRefused(phone, log, CLOSE_UNAUTHORIZED);
  });

  it('answers a request kind it does not know with an error and stays open (newer app, older agent)', async () => {
    const { pairing, agent, log, connect } = setup();
    const invite = pairing.createInvite();
    const phone = connect();
    await pair(phone, agent.publicKey, invite.secret);
    phone.inbox();
    phone.link.deliver(
      phone.session!.seal(encodeFrame({ type: 'request', id: 1, request: { kind: 'rename' } })),
    );
    await flush();
    expect(phone.link.closed).toBeNull();
    expect(log.requests).toEqual([]);
    expect(phone.inbox()).toEqual([
      {
        type: 'reply',
        id: 1,
        ok: false,
        error: 'your computer runs an older remote-sheep that does not know "rename"; restart it',
      },
    ]);
  });

  it('closes a connection whose sealed frame decrypts to a malformed message with 1008', async () => {
    const { pairing, agent, log, connect } = setup();
    const invite = pairing.createInvite();
    const phone = connect();
    await pair(phone, agent.publicKey, invite.secret);
    phone.link.deliver(
      phone.session!.seal(encodeFrame({ type: 'request', id: 1, request: { kind: 'prompt' } })),
    );
    await flush();
    expect(phone.link.closed?.[0]).toBe(1008);
    expect(log.requests).toEqual([]);
    expect(log.closed).toEqual(log.opened);
  });

  it('records activity so the 24 hours count from the last request', async () => {
    const { pairing, agent, connect, registry, clock } = setup();
    const invite = pairing.createInvite();
    const phone = connect();
    await pair(phone, agent.publicKey, invite.secret);

    clock.time = T0 + 2 * HOUR;
    phone.send({ type: 'request', id: 1, request: { kind: 'prompt', target: 'p', text: 'x' } });
    await flush();
    expect((await registry.find(phone.id))?.lastSeen).toBe(T0 + 2 * HOUR);
  });

  it('lets the core close a connection with a code', async () => {
    const { pairing, agent, log, connect } = setup();
    const invite = pairing.createInvite();
    const phone = connect();
    await pair(phone, agent.publicKey, invite.secret);
    log.opened[0]!.close(4003, 'revoked');
    expect(phone.link.closed).toEqual([4003, 'revoked']);
    expect(log.closed).toEqual(log.opened);
  });

  it('does nothing more when the phone leaves during the handshake', async () => {
    const { pairing, log, connect } = setup();
    pairing.createInvite();
    const phone = connect();
    phone.hello(true);
    phone.link.close(1000, 'bye');
    await flush();
    expect(phone.link.sent).toEqual([]);
    expect(log.opened).toEqual([]);
    expect(log.closed).toEqual([]);
  });
});
