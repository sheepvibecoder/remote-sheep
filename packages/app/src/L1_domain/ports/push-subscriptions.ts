import type { PushSubscription } from '@remote-sheep/protocol';

/** Why this browser can or cannot take notifications. */
export type PushSupport =
  /** Not a secure context: browsers expose no Push on plain http. */
  | 'insecure'
  /** No service worker, Push or Notification API. */
  | 'unsupported'
  /** iPhone/iPad Safari only offers Push to an app added to the home screen. */
  | 'install-first'
  | 'available';

/** The browser side of Web Push: permission, service worker and subscription. */
export interface PushSubscriptions {
  support(): PushSupport;
  /** The subscription this browser already holds, or null. */
  current(): Promise<PushSubscription | null>;
  /** Asks permission, registers the service worker and subscribes with the agent's VAPID key. */
  subscribe(vapidKey: string): Promise<PushSubscription>;
  unsubscribe(): Promise<void>;
}
