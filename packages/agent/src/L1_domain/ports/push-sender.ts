import type { PushSubscription } from '@remote-sheep/protocol';

/**
 * Delivers one notification to one phone through its push service. Resolves
 * `gone` when the service says the subscription no longer exists (so it must
 * not be used again) and rejects for any other failure.
 */
export interface PushSender {
  send(subscription: PushSubscription, payload: string): Promise<'sent' | 'gone'>;
}
