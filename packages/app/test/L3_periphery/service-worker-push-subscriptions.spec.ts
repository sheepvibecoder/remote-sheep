import { describe, expect, it } from 'vitest';
import { encodeBase64Url } from '@remote-sheep/protocol';
import {
  ServiceWorkerPushSubscriptions,
  type PushEnvironment,
} from '../../src/L3_periphery/service-worker-push-subscriptions';

const keyBytes = (length: number, fill: number) => new Uint8Array(length).fill(fill);

class FakeSubscription {
  unsubscribed = false;
  endpoint = 'https://push.example/abc';
  toJSON() {
    return {
      endpoint: this.endpoint,
      keys: { p256dh: encodeBase64Url(keyBytes(65, 4)), auth: encodeBase64Url(keyBytes(16, 5)) },
    };
  }
  unsubscribe() {
    this.unsubscribed = true;
    return Promise.resolve(true);
  }
}

function setup(overrides: Partial<PushEnvironment> = {}, permission = 'granted') {
  const held: { sub: FakeSubscription | null } = { sub: null };
  const calls = { registered: [] as string[], subscribeOptions: null as unknown, asked: 0 };
  const registration = {
    pushManager: {
      getSubscription: () => Promise.resolve(held.sub),
      subscribe: (options: unknown) => {
        calls.subscribeOptions = options;
        held.sub = new FakeSubscription();
        return Promise.resolve(held.sub);
      },
    },
  };
  const env: PushEnvironment = {
    secure: true,
    ios: false,
    standalone: false,
    hasPushManager: true,
    serviceWorker: {
      register: (url: string) => {
        calls.registered.push(url);
        return Promise.resolve(registration);
      },
      getRegistration: () => Promise.resolve(held.sub ? registration : undefined),
      ready: Promise.resolve(registration),
    } as never,
    notifications: {
      request: () => {
        calls.asked++;
        return Promise.resolve(permission as NotificationPermission);
      },
    },
    ...overrides,
  };
  return { push: new ServiceWorkerPushSubscriptions(env), held, calls };
}

describe('ServiceWorkerPushSubscriptions', () => {
  it('is available in a secure browser with Push', () => {
    expect(setup().push.support()).toBe('available');
  });

  it('is insecure outside a secure context, before anything else', () => {
    expect(setup({ secure: false, ios: true }).push.support()).toBe('insecure');
  });

  it('asks an iPhone browser tab to install the app first', () => {
    const { push } = setup({ ios: true, standalone: false, hasPushManager: false });
    expect(push.support()).toBe('install-first');
  });

  it('is available on an iPhone once the app runs standalone', () => {
    expect(setup({ ios: true, standalone: true }).push.support()).toBe('available');
  });

  it('is unsupported without a service worker, PushManager or notifications', () => {
    expect(setup({ serviceWorker: null }).push.support()).toBe('unsupported');
    expect(setup({ hasPushManager: false }).push.support()).toBe('unsupported');
    expect(setup({ notifications: null }).push.support()).toBe('unsupported');
  });

  it('subscribes with the key after permission and registering /sw.js', async () => {
    const { push, calls } = setup();
    const vapid = keyBytes(65, 9);
    const data = await push.subscribe(encodeBase64Url(vapid));
    expect(calls.registered).toEqual(['/sw.js']);
    expect(calls.subscribeOptions).toEqual({ userVisibleOnly: true, applicationServerKey: vapid });
    expect(data).toEqual({
      endpoint: 'https://push.example/abc',
      p256dh: encodeBase64Url(keyBytes(65, 4)),
      auth: encodeBase64Url(keyBytes(16, 5)),
    });
  });

  it('refuses without registering when the permission is denied', async () => {
    const { push, calls } = setup({}, 'denied');
    await expect(push.subscribe(encodeBase64Url(keyBytes(65, 9)))).rejects.toThrow(
      'notification permission was denied',
    );
    expect(calls.registered).toEqual([]);
  });

  it('rejects a key that is not base64url', async () => {
    const { push } = setup();
    await expect(push.subscribe('***')).rejects.toThrow('push key');
  });

  it('reports the subscription it holds, and none when there is none', async () => {
    const { push } = setup();
    expect(await push.current()).toBeNull();
    await push.subscribe(encodeBase64Url(keyBytes(65, 9)));
    expect((await push.current())?.endpoint).toBe('https://push.example/abc');
  });

  it('unsubscribes the held subscription, and does nothing without one', async () => {
    const { push, held } = setup();
    await push.unsubscribe();
    await push.subscribe(encodeBase64Url(keyBytes(65, 9)));
    const sub = held.sub!;
    await push.unsubscribe();
    expect(sub.unsubscribed).toBe(true);
  });
});
