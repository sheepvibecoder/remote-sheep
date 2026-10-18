import {
  CLOSE_AGENT_OFFLINE,
  decodeRelayEnvelope,
  encodeRelayEnvelope,
} from '@remote-sheep/protocol';
import { beforeEach, describe, expect, it } from 'vitest';
import { RelayDurableObject } from '../../../src/L3_periphery/cloudflare/relay-durable-object';
import { FakePlatform, FakeState, FakeWebSocket } from '../../fakes/fake-cloudflare';

const upgrade = (path: string, headers: Record<string, string | undefined> = {}) =>
  new Request('https://relay.test' + path, { headers: { Upgrade: 'websocket', ...headers } });

const asBuffer = (data: Uint8Array) =>
  data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;

describe('RelayDurableObject', () => {
  let state: FakeState;
  let platform: FakePlatform;
  let object: RelayDurableObject;

  beforeEach(() => {
    state = new FakeState();
    platform = new FakePlatform();
    object = new RelayDurableObject(state, { ACCESS_CODES: ' alpha , ,beta' }, platform);
  });

  const lastServer = () => platform.servers[platform.servers.length - 1]!;

  it('answers keepalives without waking up', () => {
    expect(state.autoResponse).toBe('ping-pong');
  });

  it('refuses a request that is not a WebSocket upgrade', async () => {
    const response = await object.fetch(new Request('https://relay.test/ws'));
    expect(response.status).toBe(426);
    expect(state.accepted).toHaveLength(0);
  });

  it('accepts the agent with a valid bearer code and returns the upgrade', async () => {
    const response = await object.fetch(
      upgrade('/agent/0123456789abcdef', { Authorization: 'Bearer alpha' }),
    );
    expect(response.headers.get('x-upgraded')).toBe('client-end');
    expect(lastServer().closed).toBeNull();
    expect(lastServer().attachment).toEqual({ role: 'agent' });
  });

  it.each([{}, { Authorization: 'Bearer nope' }, { Authorization: 'alpha' }])(
    'refuses an agent with a missing or wrong code (%j) with HTTP 403 and accepts no socket',
    async (headers) => {
      const response = await object.fetch(upgrade('/agent/0123456789abcdef', headers));
      expect(response.status).toBe(403);
      expect(await response.text()).toBe('access refused');
      expect(state.accepted).toHaveLength(0);
    },
  );

  it('refuses another code on a claimed room with 403', async () => {
    await object.fetch(upgrade('/agent/0123456789abcdef', { Authorization: 'Bearer alpha' }));
    const response = await object.fetch(
      upgrade('/agent/0123456789abcdef', { Authorization: 'Bearer beta' }),
    );
    expect(response.status).toBe(403);
    expect(state.accepted).toHaveLength(1);
  });

  it('answers a phone with HTTP 503 when the agent is offline and accepts no socket', async () => {
    const response = await object.fetch(upgrade('/ws?agent=0123456789abcdef'));
    expect(response.status).toBe(503);
    expect(await response.text()).toBe('agent offline');
    expect(state.accepted).toHaveLength(0);
  });

  it('carries sealed frames between a phone and the agent through the socket events', async () => {
    await object.fetch(upgrade('/agent/0123456789abcdef', { Authorization: 'Bearer beta' }));
    const agent = lastServer();
    await object.fetch(upgrade('/ws?agent=0123456789abcdef'));
    const phone = lastServer();
    const open = decodeRelayEnvelope(agent.sent[0] as Uint8Array);
    expect(open?.kind).toBe('open');

    object.webSocketMessage(phone, asBuffer(new Uint8Array([1, 2, 3])));
    expect(decodeRelayEnvelope(agent.sent[1] as Uint8Array)).toMatchObject({
      kind: 'data',
      data: new Uint8Array([1, 2, 3]),
    });

    object.webSocketMessage(
      agent,
      asBuffer(
        encodeRelayEnvelope({ kind: 'data', stream: open!.stream, data: new Uint8Array([4]) }),
      ),
    );
    expect(phone.sent).toEqual([new Uint8Array([4])]);

    object.webSocketClose(phone, 1000);
    expect(decodeRelayEnvelope(agent.sent[2] as Uint8Array)).toMatchObject({ kind: 'close' });
  });

  it('closes the phones when the agent errors or closes', async () => {
    await object.fetch(upgrade('/agent/0123456789abcdef', { Authorization: 'Bearer alpha' }));
    const agent = lastServer();
    await object.fetch(upgrade('/ws?agent=0123456789abcdef'));
    const first = lastServer();
    await object.fetch(upgrade('/ws?agent=0123456789abcdef'));
    const second = lastServer();
    object.webSocketError(agent);
    expect(first.closed?.code).toBe(CLOSE_AGENT_OFFLINE);
    expect(second.closed?.code).toBe(CLOSE_AGENT_OFFLINE);
    object.webSocketClose(agent, 1006);
  });

  it('survives sockets whose peer already left', async () => {
    await object.fetch(upgrade('/agent/0123456789abcdef', { Authorization: 'Bearer alpha' }));
    const agent = lastServer();
    await object.fetch(upgrade('/ws?agent=0123456789abcdef'));
    const phone = lastServer();
    agent.broken = true;
    phone.broken = true;
    expect(() => {
      object.webSocketMessage(phone, asBuffer(new Uint8Array([1])));
      object.webSocketClose(agent, 1006);
    }).not.toThrow();
  });

  it('treats an attachment it did not write as no role', async () => {
    const stray = new FakeWebSocket();
    stray.attachment = { role: 'wizard' };
    state.accepted.push(stray);
    expect(() => {
      object.webSocketMessage(stray, 'hi');
    }).not.toThrow();
    expect(stray.closed).toBeNull();
  });

  it('keeps stream ids and the owner in storage', async () => {
    await object.fetch(upgrade('/agent/0123456789abcdef', { Authorization: 'Bearer alpha' }));
    await object.fetch(upgrade('/ws?agent=0123456789abcdef'));
    await object.fetch(upgrade('/ws?agent=0123456789abcdef'));
    expect(state.data.get('stream')).toBe(2);
    expect(state.data.get('owner')).toMatch(/^[0-9a-f]{64}$/);
  });
});
