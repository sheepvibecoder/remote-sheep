// Web Push in the browser: the permission prompt, the service worker and the subscription.
//
// The browser objects arrive as a plain record so the rules below (who may subscribe, in what
// order) are tested without a browser; `main.ts` fills it from the real globals.

import {
  decodeBase64Url,
  type PushSubscription as StoredSubscription,
} from '@remote-sheep/protocol';
import type { PushSubscriptions, PushSupport } from '../L1_domain/ports/push-subscriptions';

/** Where the build puts the service worker; it must sit at the root to control the whole app. */
const WORKER_URL = '/sw.js';

export interface PushEnvironment {
  /** `isSecureContext`: Push exists only on https (or localhost). */
  secure: boolean;
  /** An iPhone or iPad, where Push works only once the app is on the home screen. */
  ios: boolean;
  /** Running as an installed app rather than a browser tab. */
  standalone: boolean;
  hasPushManager: boolean;
  serviceWorker: Pick<ServiceWorkerContainer, 'register' | 'getRegistration' | 'ready'> | null;
  notifications: { request(): Promise<NotificationPermission> } | null;
}

function dataOf(subscription: PushSubscription): StoredSubscription {
  const { endpoint, keys } = subscription.toJSON();
  if (!endpoint || !keys?.['p256dh'] || !keys['auth']) {
    throw new Error('the browser returned an incomplete push subscription');
  }
  return { endpoint, p256dh: keys['p256dh'], auth: keys['auth'] };
}

export class ServiceWorkerPushSubscriptions implements PushSubscriptions {
  constructor(private readonly env: PushEnvironment) {}

  support(): PushSupport {
    const { secure, ios, standalone, hasPushManager, serviceWorker, notifications } = this.env;
    if (!secure) return 'insecure';
    // A tab on iOS lacks PushManager, but the cure is installing, not a newer browser.
    if (ios && !standalone) return 'install-first';
    if (!serviceWorker || !hasPushManager || !notifications) return 'unsupported';
    return 'available';
  }

  async current(): Promise<StoredSubscription | null> {
    const registration = await this.env.serviceWorker?.getRegistration('/');
    const subscription = await registration?.pushManager.getSubscription();
    return subscription ? dataOf(subscription) : null;
  }

  async subscribe(vapidKey: string): Promise<StoredSubscription> {
    const { serviceWorker, notifications } = this.env;
    if (!serviceWorker || !notifications) throw new Error('this browser cannot show notifications');
    const key = decodeBase64Url(vapidKey);
    if (!key) throw new Error('the agent sent an invalid push key');
    if ((await notifications.request()) !== 'granted') {
      throw new Error('notification permission was denied');
    }
    await serviceWorker.register(WORKER_URL, { scope: '/' });
    // `ready` waits until the worker is active, which subscribing requires.
    const registration = await serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: key as Uint8Array<ArrayBuffer>,
    });
    return dataOf(subscription);
  }

  async unsubscribe(): Promise<void> {
    const registration = await this.env.serviceWorker?.getRegistration('/');
    const subscription = await registration?.pushManager.getSubscription();
    await subscription?.unsubscribe();
  }
}
