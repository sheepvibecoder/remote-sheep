import { describe, expect, it } from 'vitest';
import {
  acceptHandshake,
  decodeHello,
  decodeWelcome,
  encodeBase64Url,
  encodeFrame,
  encodeHello,
  encodeWelcome,
  generateKeyPair,
  PROTOCOL,
  startHandshake,
  type Hello,
  type KeyPair,
} from '../../src/index';

const seeded = (byte: number): KeyPair => generateKeyPair(new Uint8Array(32).fill(byte));

const phone = seeded(1);
const agent = seeded(2);
const text = (value: string) => new TextEncoder().encode(value);

/** Runs the whole handshake the way the phone and the agent do, through the wire codecs. */
function connect(pair = false, agentKeyOnPhone = agent.publicKey) {
  const started = startHandshake(phone, pair);
  const hello = decodeHello(encodeHello(started.hello))!;
  const accepted = acceptHandshake(agent, hello);
  const welcome = decodeWelcome(encodeWelcome(accepted.welcome))!;
  return { phoneSession: started.finish(welcome, agentKeyOnPhone), agentSession: accepted.session };
}

// u = 1 is a point of order 4 on Curve25519: any scalar times it lands in the small subgroup.
const lowOrder = (() => {
  const key = new Uint8Array(32);
  key[0] = 1;
  return key;
})();

describe('handshake', () => {
  it('derives the same transcript on both sides and carries sealed frames both ways', () => {
    const { phoneSession, agentSession } = connect();
    expect(phoneSession.transcript).toHaveLength(32);
    expect(phoneSession.transcript).toEqual(agentSession.transcript);

    expect(agentSession.open(phoneSession.seal(text('confirm')))).toEqual(text('confirm'));
    expect(phoneSession.open(agentSession.seal(text('ready')))).toEqual(text('ready'));
    for (let i = 0; i < 5; i++) {
      expect(agentSession.open(phoneSession.seal(text('p' + i)))).toEqual(text('p' + i));
      expect(phoneSession.open(agentSession.seal(text('a' + i)))).toEqual(text('a' + i));
    }
  });

  it('sends the phone identity, a fresh ephemeral key, the pair flag and the protocol', () => {
    const first = startHandshake(phone, true);
    const second = startHandshake(phone, false);
    expect(first.hello).toMatchObject({
      protocol: PROTOCOL,
      identity: phone.publicKey,
      pair: true,
    });
    expect(second.hello.pair).toBe(false);
    expect(first.hello.ephemeral).not.toEqual(second.hello.ephemeral);
  });

  it('is deterministic with injected ephemeral keys', () => {
    const run = () => {
      const started = startHandshake(phone, false, seeded(3));
      const accepted = acceptHandshake(agent, started.hello, seeded(4));
      started.finish(accepted.welcome, agent.publicKey);
      return accepted.session.transcript;
    };
    expect(run()).toEqual(run());
    expect(acceptHandshake(agent, startHandshake(phone, false).hello).welcome.ephemeral).toEqual(
      expect.any(Uint8Array),
    );
  });

  it('gives every connection its own keys, so a frame from one does not open in another', () => {
    const one = connect();
    const two = connect();
    expect(one.agentSession.transcript).not.toEqual(two.agentSession.transcript);
    expect(() => two.agentSession.open(one.phoneSession.seal(text('x')))).toThrow();
  });

  it('defeats a man in the middle holding another agent key', () => {
    const impostor = seeded(5);
    const { phoneSession, agentSession } = connect(false, impostor.publicKey);
    expect(phoneSession.transcript).not.toEqual(agentSession.transcript);
    expect(() => phoneSession.open(agentSession.seal(text('ready')))).toThrow();
    expect(() => agentSession.open(phoneSession.seal(text('confirm')))).toThrow();
  });

  it('rejects an all-zero or low-order ephemeral or identity key in the hello', () => {
    const hello = startHandshake(phone, false).hello;
    for (const bad of [new Uint8Array(32), lowOrder]) {
      expect(() => acceptHandshake(agent, { ...hello, ephemeral: bad })).toThrow();
      expect(() => acceptHandshake(agent, { ...hello, identity: bad })).toThrow();
    }
  });

  it('rejects an all-zero or low-order key in the welcome or as the agent key', () => {
    for (const bad of [new Uint8Array(32), lowOrder]) {
      const started = startHandshake(phone, false);
      expect(() => started.finish({ ephemeral: bad }, agent.publicKey)).toThrow();
      const accepted = acceptHandshake(agent, started.hello);
      expect(() => started.finish(accepted.welcome, bad)).toThrow();
    }
  });

  it('refuses a hello of another protocol version', () => {
    const hello = startHandshake(phone, false).hello;
    expect(() => acceptHandshake(agent, { ...hello, protocol: PROTOCOL + 1 })).toThrow();
  });
});

describe('handshake frames', () => {
  const key = encodeBase64Url(phone.publicKey);

  it('round-trips the hello and the welcome', () => {
    const hello: Hello = startHandshake(phone, true).hello;
    expect(decodeHello(encodeHello(hello))).toEqual(hello);
    const welcome = { ephemeral: agent.publicKey };
    expect(decodeWelcome(encodeWelcome(welcome))).toEqual(welcome);
  });

  it('carries keys as base64url strings in the header', () => {
    const frame = encodeHello(startHandshake(phone, false).hello);
    expect(new TextDecoder().decode(frame)).toContain(`"identity":"${key}"`);
  });

  it('accepts a hello of any protocol version, so the agent can say which one it speaks', () => {
    const hello = { type: 'hello', protocol: 99, ephemeral: key, identity: key, pair: false };
    expect(decodeHello(encodeFrame(hello))?.protocol).toBe(99);
  });

  it('rejects a malformed hello', () => {
    const good = { type: 'hello', protocol: PROTOCOL, ephemeral: key, identity: key, pair: false };
    const short = encodeBase64Url(new Uint8Array(31));
    const cases: unknown[] = [
      { ...good, type: 'welcome' },
      { ...good, protocol: '2' },
      { ...good, protocol: 1.5 },
      { ...good, protocol: -1 },
      { ...good, ephemeral: short },
      { ...good, identity: `${key}=` },
      { ...good, identity: 5 },
      { ...good, ephemeral: undefined },
      { ...good, pair: 'yes' },
      { type: 'hello', protocol: 1, token: 'abc' },
      [good],
      null,
    ];
    for (const header of cases) expect(decodeHello(encodeFrame(header)), String(header)).toBeNull();
    expect(decodeHello(encodeFrame(good, new Uint8Array([1])))).toBeNull();
    expect(decodeHello(new Uint8Array([0, 0]))).toBeNull();
  });

  it('rejects a malformed welcome', () => {
    const short = encodeBase64Url(new Uint8Array(33));
    for (const header of [
      { type: 'hello', ephemeral: key },
      { type: 'welcome', ephemeral: short },
      { type: 'welcome', ephemeral: 'not base64!' },
      { type: 'welcome' },
      'welcome',
    ]) {
      expect(decodeWelcome(encodeFrame(header))).toBeNull();
    }
    expect(decodeWelcome(encodeFrame({ type: 'welcome', ephemeral: key }, new Uint8Array(1)))).toBe(
      null,
    );
    expect(decodeWelcome(new Uint8Array(3))).toBeNull();
  });
});
