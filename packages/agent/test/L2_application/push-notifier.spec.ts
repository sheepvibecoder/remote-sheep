import { describe, expect, it } from 'vitest';
import type { Session } from '@remote-sheep/protocol';
import type { PushSubscription } from '@remote-sheep/protocol';
import type { PushSender } from '../../src/L1_domain/ports/push-sender';
import { PAIRING_IDLE_MS } from '../../src/L1_domain/pairing-expiry';
import { PushNotifier } from '../../src/L2_application/push-notifier';
import { RelaySwitch } from '../../src/L2_application/relay-switch';
import { MemoryDeviceRegistry } from '../fakes/memory-device-registry';

const T0 = 1_700_000_000_000;

const sub = (name: string): PushSubscription => ({
  endpoint: 'https://push.example/' + name,
  p256dh: 'p',
  auth: 'a',
});

class FakeSender implements PushSender {
  sent: { endpoint: string; payload: unknown }[] = [];
  subjects: string[] = [];
  answers = new Map<string, 'sent' | 'gone' | Error>();
  async send(subscription: PushSubscription, payload: string, subject: string) {
    this.sent.push({ endpoint: subscription.endpoint, payload: JSON.parse(payload) });
    this.subjects.push(subject);
    const answer = this.answers.get(subscription.endpoint) ?? 'sent';
    if (answer instanceof Error) throw answer;
    return answer;
  }
}

function setup() {
  const registry = new MemoryDeviceRegistry();
  const sender = new FakeSender();
  const logs: string[] = [];
  let now = T0;
  const relay = { url: 'https://relay.example.com' as string | null };
  const notifier = new PushNotifier({
    registry,
    sender,
    relay: { origin: () => relay.url },
    clock: { now: () => now },
    publicKey: 'VAPID-KEY',
    agentId: 'agent-1',
    log: (m) => logs.push(m),
  });
  const pair = async (id: string, push?: PushSubscription, lastSeen = T0) => {
    await registry.save({ id, publicKey: new Uint8Array(32), pairedAt: T0, lastSeen });
    if (push) await registry.setPush(id, push);
  };
  return {
    registry,
    sender,
    logs,
    notifier,
    pair,
    relay,
    advance: (ms: number) => (now += ms),
  };
}

const session = (status: Session['status']): Session => ({
  target: 'p1',
  kind: 'agent',
  title: 'ignored',
  status,
  cwd: 'C:\\work\\api-server',
  project: 'api-server',
  space: 'w1',
});

// The notifier is fire-and-forget; let its promises settle.
const settle = () => new Promise((resolve) => setTimeout(resolve, 10));

describe('PushNotifier', () => {
  it('follows the relay live: signs with the one set now, and sends nothing while off', async () => {
    const { notifier, sender, pair, relay } = setup();
    await pair('a', sub('a'));
    expect(notifier.listening()).toBe(true);
    notifier.notify({ session: session('done'), from: 'working', to: 'done' });
    await settle();
    relay.url = 'https://other.example.com';
    notifier.notify({ session: session('done'), from: 'working', to: 'done' });
    await settle();
    expect(sender.subjects).toEqual(['https://relay.example.com', 'https://other.example.com']);
    relay.url = null;
    expect(notifier.listening()).toBe(false);
    notifier.notify({ session: session('done'), from: 'working', to: 'done' });
    await settle();
    expect(sender.sent).toHaveLength(2);
    relay.url = 'https://relay.example.com';
    expect(notifier.listening()).toBe(true);
  });

  it('keeps a relay set by the variables as its subject, as before', async () => {
    const saved = { save: async () => undefined, forget: async () => undefined };
    const dialer = {
      dial: async () => undefined,
      hangUp: async () => undefined,
      connected: () => true,
    };
    const fixed = new RelaySwitch({
      saved,
      dialer,
      initial: { url: 'https://env-relay.example.com', code: 'c' },
      fixed: true,
    });
    const registry = new MemoryDeviceRegistry();
    const sender = new FakeSender();
    const notifier = new PushNotifier({
      registry,
      sender,
      relay: fixed,
      clock: { now: () => T0 },
      publicKey: 'K',
      agentId: 'agent-1',
    });
    await registry.save({ id: 'a', publicKey: new Uint8Array(32), pairedAt: T0, lastSeen: T0 });
    await registry.setPush('a', sub('a'));
    notifier.notify({ session: session('done'), from: 'working', to: 'done' });
    await settle();
    expect(sender.subjects).toEqual(['https://env-relay.example.com']);
  });

  it('tells every subscribed phone that a session finished, with its name, the target and this computer', async () => {
    const { notifier, sender, pair } = setup();
    await pair('a', sub('a'));
    await pair('b', sub('b'));
    await pair('c');
    notifier.notify({ session: session('done'), from: 'working', to: 'done' });
    await settle();
    expect(sender.sent).toEqual([
      {
        endpoint: 'https://push.example/a',
        payload: { title: 'api-server: finished', target: 'p1', agent: 'agent-1' },
      },
      {
        endpoint: 'https://push.example/b',
        payload: { title: 'api-server: finished', target: 'p1', agent: 'agent-1' },
      },
    ]);
  });

  it('says when a session waits for an answer, and carries nothing from the transcript', async () => {
    const { notifier, sender, pair } = setup();
    await pair('a', sub('a'));
    notifier.notify({ session: session('blocked'), from: 'working', to: 'blocked' });
    await settle();
    expect(sender.sent[0]?.payload).toEqual({
      title: 'api-server: waiting for your answer',
      target: 'p1',
      agent: 'agent-1',
    });
  });

  it('skips a phone whose pairing expired', async () => {
    const { notifier, sender, pair, advance } = setup();
    await pair('old', sub('old'));
    advance(PAIRING_IDLE_MS);
    await pair('fresh', sub('fresh'), T0 + PAIRING_IDLE_MS);
    notifier.notify({ session: session('done'), from: 'working', to: 'done' });
    await settle();
    expect(sender.sent.map((s) => s.endpoint)).toEqual(['https://push.example/fresh']);
  });

  it('forgets a subscription the push service says is gone', async () => {
    const { notifier, sender, registry, pair } = setup();
    await pair('a', sub('a'));
    sender.answers.set('https://push.example/a', 'gone');
    notifier.notify({ session: session('done'), from: 'working', to: 'done' });
    await settle();
    expect((await registry.find('a'))?.push).toBeUndefined();
  });

  it('logs a failed send, keeps the subscription and still reaches the other phones', async () => {
    const { notifier, sender, registry, pair, logs } = setup();
    await pair('a', sub('a'));
    await pair('b', sub('b'));
    sender.answers.set('https://push.example/a', new Error('push service answered 500'));
    notifier.notify({ session: session('done'), from: 'working', to: 'done' });
    await settle();
    expect(sender.sent).toHaveLength(2);
    expect(logs.join()).toContain('push service answered 500');
    expect((await registry.find('a'))?.push).toEqual(sub('a'));
  });

  it('never throws into the monitor when the registry fails', async () => {
    const { notifier, registry, logs } = setup();
    registry.list = () => Promise.reject(new Error('registry locked'));
    expect(() =>
      notifier.notify({ session: session('done'), from: 'working', to: 'done' }),
    ).not.toThrow();
    await settle();
    expect(logs.join()).toContain('registry locked');
  });

  it('stores and clears the subscription of the asking device', async () => {
    const { notifier, registry, pair } = setup();
    await pair('a');
    await notifier.subscribe('a', sub('a'));
    expect((await registry.find('a'))?.push).toEqual(sub('a'));
    await notifier.unsubscribe('a');
    expect((await registry.find('a'))?.push).toBeUndefined();
  });

  it('refuses a subscription for a device that is no longer paired', async () => {
    const { notifier } = setup();
    await expect(notifier.subscribe('gone', sub('x'))).rejects.toThrow('no paired device');
  });

  it('exposes the public key phones subscribe with', () => {
    expect(setup().notifier.publicKey).toBe('VAPID-KEY');
  });
});
