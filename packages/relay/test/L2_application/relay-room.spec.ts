import {
  CLOSE_AGENT_OFFLINE,
  CLOSE_PAIRING_EXPIRED,
  CLOSE_PROTOCOL,
  CLOSE_UNAUTHORIZED,
  decodeRelayEnvelope,
  encodeRelayEnvelope,
  type RelayEnvelope,
} from '@remote-sheep/protocol';
import { beforeEach, describe, expect, it } from 'vitest';
import { RelayRoom } from '../../src/L2_application/relay-room';
import { FakeCodes, FakeSockets, FakeStore, type FakeSocket } from '../fakes/fake-room';

const bytes = (...values: number[]) => new Uint8Array(values);
const envelopes = (socket: FakeSocket) => socket.sent.map((frame) => decodeRelayEnvelope(frame)!);
const toBuffer = (data: Uint8Array) =>
  data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
const wire = (envelope: RelayEnvelope) => toBuffer(encodeRelayEnvelope(envelope));

describe('RelayRoom', () => {
  let sockets: FakeSockets;
  let store: FakeStore;
  let codes: FakeCodes;
  let room: RelayRoom;

  beforeEach(() => {
    sockets = new FakeSockets();
    store = new FakeStore();
    codes = new FakeCodes(['alpha', 'beta']);
    room = new RelayRoom(sockets, store, codes);
  });

  const connectAgent = async (code: string | null = 'alpha') => {
    const ticket = await room.admitAgent(code);
    if (ticket === null) throw new Error('agent refused');
    const socket = sockets.accept();
    await room.connectAgent(socket, ticket);
    return socket;
  };
  const connectPhone = async () => {
    const socket = sockets.accept();
    await room.connectPhone(socket);
    return socket;
  };

  describe('access codes', () => {
    it('refuses an agent without a code, before any socket is accepted', async () => {
      expect(await room.admitAgent(null)).toBeNull();
      expect(sockets.all()).toHaveLength(0);
      expect(store.ownerHash).toBeNull();
    });

    it('refuses an agent with an unknown code', async () => {
      expect(await room.admitAgent('gamma')).toBeNull();
    });

    it('lets a valid code claim the room and come back to it', async () => {
      const first = await connectAgent('alpha');
      expect(first.closed).toBeNull();
      expect(store.ownerHash).toBe('hash:alpha');
      const again = await connectAgent('alpha');
      expect(again.closed).toBeNull();
    });

    it('denies another valid code once the room is claimed', async () => {
      await connectAgent('alpha');
      expect(await room.admitAgent('beta')).toBeNull();
      expect(store.ownerHash).toBe('hash:alpha');
    });

    it('does not disturb the owner when someone else is denied', async () => {
      const owner = await connectAgent('alpha');
      const phone = await connectPhone();
      expect(await room.admitAgent('beta')).toBeNull();
      expect(owner.closed).toBeNull();
      expect(phone.closed).toBeNull();
    });

    it('lets a valid code take the room when the owner code is no longer issued', async () => {
      await connectAgent('alpha');
      codes.codes = ['beta'];
      const next = await connectAgent('beta');
      expect(next.closed).toBeNull();
      expect(store.ownerHash).toBe('hash:beta');
    });

    it('ignores empty codes', async () => {
      codes.codes = [''];
      expect(await room.admitAgent('')).toBeNull();
    });
  });

  describe('phones', () => {
    it('reports no agent online before one connects, and does not accept the phone', async () => {
      expect(room.agentOnline()).toBe(false);
      expect(sockets.all()).toHaveLength(0);
      await connectAgent();
      expect(room.agentOnline()).toBe(true);
    });

    it('closes a phone with "agent offline" if the agent left while it was being seated', async () => {
      const phone = sockets.accept();
      await room.connectPhone(phone);
      expect(phone.closed).toEqual({ code: CLOSE_AGENT_OFFLINE, reason: 'agent offline' });
    });

    it('announces each phone to the agent with its own stream', async () => {
      const agent = await connectAgent();
      await connectPhone();
      await connectPhone();
      const [a, b] = envelopes(agent);
      expect(a?.kind).toBe('open');
      expect(b?.kind).toBe('open');
      expect(a?.stream).not.toBe(b?.stream);
    });

    it('wraps what a phone sends, byte for byte, in a data envelope', async () => {
      const agent = await connectAgent();
      const phone = await connectPhone();
      const payload = bytes(0, 255, 7, 7);
      room.onMessage(phone, toBuffer(payload));
      const [open, data] = envelopes(agent);
      expect(data).toEqual({ kind: 'data', stream: open?.stream, data: payload });
    });

    it('sends the bytes of an agent data envelope to that phone only', async () => {
      const agent = await connectAgent();
      const one = await connectPhone();
      const two = await connectPhone();
      const [open] = envelopes(agent);
      const payload = bytes(9, 8, 7);
      room.onMessage(agent, wire({ kind: 'data', stream: open!.stream, data: payload }));
      expect(one.sent).toEqual([payload]);
      expect(two.sent).toEqual([]);
    });

    it('ignores data for a stream that does not exist', async () => {
      const agent = await connectAgent();
      const phone = await connectPhone();
      room.onMessage(agent, wire({ kind: 'data', stream: 999, data: bytes(1) }));
      expect(phone.sent).toEqual([]);
      expect(agent.closed).toBeNull();
    });

    it.each([CLOSE_UNAUTHORIZED, CLOSE_PROTOCOL, CLOSE_PAIRING_EXPIRED])(
      'closes the phone with %i exactly as the agent said',
      async (code) => {
        const agent = await connectAgent();
        const phone = await connectPhone();
        const other = await connectPhone();
        const [open] = envelopes(agent);
        room.onMessage(agent, wire({ kind: 'close', stream: open!.stream, code, reason: 'why' }));
        expect(phone.closed).toEqual({ code, reason: 'why' });
        expect(other.closed).toBeNull();
      },
    );

    it('does not echo a close it caused back to the agent', async () => {
      const agent = await connectAgent();
      const phone = await connectPhone();
      const [open] = envelopes(agent);
      room.onMessage(agent, wire({ kind: 'close', stream: open!.stream, code: 4001, reason: '' }));
      room.onClose(phone, 4001);
      expect(envelopes(agent)).toHaveLength(1);
    });

    it('tells the agent when a phone closes, with the phone code', async () => {
      const agent = await connectAgent();
      const phone = await connectPhone();
      const [open] = envelopes(agent);
      room.onClose(phone, 4001);
      expect(envelopes(agent)[1]).toEqual({
        kind: 'close',
        stream: open?.stream,
        code: 4001,
        reason: '',
      });
    });

    it.each([1005, 1006, 1001, 2999])(
      'reports an unsendable phone code %i as 1000',
      async (code) => {
        const agent = await connectAgent();
        const phone = await connectPhone();
        room.onClose(phone, code);
        expect(envelopes(agent)[1]).toMatchObject({ kind: 'close', code: 1000 });
      },
    );

    it('treats a phone error like a close', async () => {
      const agent = await connectAgent();
      const phone = await connectPhone();
      room.onError(phone);
      expect(envelopes(agent)[1]).toMatchObject({ kind: 'close', code: 1000 });
    });

    it('closes a phone that sends text and lets the agent know', async () => {
      const agent = await connectAgent();
      const phone = await connectPhone();
      room.onMessage(phone, 'hello');
      expect(phone.closed?.code).toBe(CLOSE_PROTOCOL);
      expect(envelopes(agent)[1]).toMatchObject({ kind: 'close', code: CLOSE_PROTOCOL });
    });

    it('survives a phone closing after the agent is gone', async () => {
      const agent = await connectAgent();
      const phone = await connectPhone();
      room.onClose(agent, 1000);
      expect(() => {
        room.onClose(phone, 1000);
      }).not.toThrow();
    });
  });

  describe('the agent', () => {
    it('closes every phone with "agent offline" when it leaves', async () => {
      const agent = await connectAgent();
      const one = await connectPhone();
      const two = await connectPhone();
      room.onClose(agent, 1006);
      expect(one.closed?.code).toBe(CLOSE_AGENT_OFFLINE);
      expect(two.closed?.code).toBe(CLOSE_AGENT_OFFLINE);
    });

    it('does the same when its socket errors', async () => {
      const agent = await connectAgent();
      const phone = await connectPhone();
      room.onError(agent);
      expect(phone.closed?.code).toBe(CLOSE_AGENT_OFFLINE);
    });

    it('is replaced by a new connection of the same room', async () => {
      const old = await connectAgent();
      const phone = await connectPhone();
      const next = await connectAgent();
      expect(old.closed).toEqual({ code: 1000, reason: 'replaced' });
      expect(phone.closed?.code).toBe(CLOSE_AGENT_OFFLINE);
      expect(next.closed).toBeNull();
      // The old socket's close event must not take the new agent's phones down.
      const fresh = await connectPhone();
      room.onClose(old, 1000);
      expect(fresh.closed).toBeNull();
      expect(envelopes(next)[0]?.kind).toBe('open');
    });

    it('is dropped with 4002 when it sends a malformed envelope', async () => {
      const agent = await connectAgent();
      const phone = await connectPhone();
      room.onMessage(agent, toBuffer(bytes(99, 0)));
      expect(agent.closed?.code).toBe(CLOSE_PROTOCOL);
      expect(phone.closed?.code).toBe(CLOSE_AGENT_OFFLINE);
    });

    it('is dropped with 4002 when it sends text', async () => {
      const agent = await connectAgent();
      room.onMessage(agent, 'hello');
      expect(agent.closed?.code).toBe(CLOSE_PROTOCOL);
    });

    it('is dropped with 4002 when it sends an open envelope', async () => {
      const agent = await connectAgent();
      room.onMessage(agent, wire({ kind: 'open', stream: 1 }));
      expect(agent.closed?.code).toBe(CLOSE_PROTOCOL);
    });
  });

  it('ignores messages of sockets it never accepted', () => {
    const stray = sockets.accept();
    expect(() => {
      room.onMessage(stray, 'x');
      room.onClose(stray, 1000);
    }).not.toThrow();
    expect(stray.closed).toBeNull();
  });
});
