// Delivers a notification through the phone's push service (FCM, Mozilla autopush, APNs web
// push): an encrypted body, authenticated with the agent's VAPID key. Plain Node, no library.

import type { PushSubscription } from '@remote-sheep/protocol';
import type { PushSender } from '../../L1_domain/ports/push-sender';
import { decodeBase64Url } from '@remote-sheep/protocol';
import { encryptPayload } from './web-push-encryption';
import { vapidAuthorization, type VapidKeys } from './web-push-vapid';

/** How long a push service keeps a message for a phone that is off: one day. */
const TTL_SECONDS = 86_400;
const TIMEOUT_MS = 15_000;

export interface WebPushSenderOptions {
  vapid: VapidKeys;
  /** Lets a test post to a local http server; the protocol validator already insists on https. */
  allowInsecure?: boolean;
  fetch?: typeof fetch;
  now?: () => number;
}

export class WebPushSender implements PushSender {
  constructor(private readonly options: WebPushSenderOptions) {}

  /** subject: the `sub` claim, how the push service can reach whoever runs this agent. */
  async send(
    subscription: PushSubscription,
    payload: string,
    subject: string,
  ): Promise<'sent' | 'gone'> {
    const endpoint = new URL(subscription.endpoint);
    if (endpoint.protocol !== 'https:' && !this.options.allowInsecure) {
      throw new Error('push endpoint must be https');
    }
    const p256dh = decodeBase64Url(subscription.p256dh);
    const auth = decodeBase64Url(subscription.auth);
    if (!p256dh || !auth) throw new Error('push subscription keys are not base64url');

    const body = encryptPayload({
      plaintext: new TextEncoder().encode(payload),
      p256dh,
      auth,
    });
    const now = this.options.now ?? Date.now;
    const response = await (this.options.fetch ?? fetch)(endpoint, {
      method: 'POST',
      headers: {
        Authorization: vapidAuthorization(
          this.options.vapid,
          subscription.endpoint,
          subject,
          now(),
        ),
        TTL: String(TTL_SECONDS),
        'Content-Encoding': 'aes128gcm',
        'Content-Type': 'application/octet-stream',
        Urgency: 'high',
      },
      body,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    // The answer carries nothing the agent needs; free the connection.
    await response.body?.cancel();
    if (response.status === 201 || response.status === 202) return 'sent';
    if (response.status === 404 || response.status === 410) return 'gone';
    throw new Error('push service answered ' + String(response.status));
  }
}
