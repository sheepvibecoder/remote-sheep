import type { PushSubscription } from '@remote-sheep/protocol';

/**
 * Delivers one notification to one phone through its push service. Resolves
 * `gone` when the service says the subscription no longer exists (so it must
 * not be used again) and rejects for any other failure.
 */
export interface PushSender {
  /** subject: the `sub` claim of the VAPID token, the https origin of the relay in use now. */
  send(subscription: PushSubscription, payload: string, subject: string): Promise<'sent' | 'gone'>;
}
