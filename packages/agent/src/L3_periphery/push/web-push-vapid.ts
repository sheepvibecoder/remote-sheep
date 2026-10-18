// VAPID (RFC 8292): the agent proves to a push service who is posting, with an ES256 token
// signed by a key that stays the same for as long as phones are subscribed to it.

import { createPublicKey, sign, type KeyObject } from 'node:crypto';
import { encodeBase64Url } from '@remote-sheep/protocol';
import { generateP256, p256PrivateKey } from './web-push-encryption';

export interface VapidKeys {
  /** Uncompressed P-256 point; what phones pass as `applicationServerKey`. */
  readonly publicKey: Uint8Array;
  readonly privateKey: KeyObject;
}

/** Tokens live 12 hours; push services refuse anything beyond 24. */
export const VAPID_TOKEN_SECONDS = 12 * 60 * 60;

/** A new random key pair. */
export function newVapidKeys(): VapidKeys {
  const { privateKey, publicKey } = generateP256();
  return { privateKey, publicKey };
}

/** The 32-byte secret scalar, for storing the key. */
export function vapidSecret(keys: VapidKeys): Uint8Array {
  return Buffer.from(keys.privateKey.export({ format: 'jwk' }).d ?? '', 'base64url');
}

/** Rebuilds the key pair from its stored halves; throws when they do not belong together. */
export function vapidKeysFrom(secret: Uint8Array, point: Uint8Array): VapidKeys {
  const privateKey = p256PrivateKey(secret, point);
  const derived = createPublicKey(privateKey).export({ format: 'jwk' });
  const expected = encodeBase64Url(point.subarray(1, 33)) + encodeBase64Url(point.subarray(33));
  if ((derived.x ?? '') + (derived.y ?? '') !== expected) throw new Error('key halves differ');
  return { publicKey: point, privateKey };
}

const json = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');

/** The `Authorization` header value for a push to `endpoint`. */
export function vapidAuthorization(
  keys: VapidKeys,
  endpoint: string,
  subject: string,
  nowMs: number,
): string {
  const unsigned =
    json({ typ: 'JWT', alg: 'ES256' }) +
    '.' +
    json({
      aud: new URL(endpoint).origin,
      exp: Math.floor(nowMs / 1000) + VAPID_TOKEN_SECONDS,
      sub: subject,
    });
  // JOSE wants the raw r||s pair, not the DER sequence Node signs with by default.
  const signature = sign('sha256', Buffer.from(unsigned), {
    key: keys.privateKey,
    dsaEncoding: 'ieee-p1363',
  });
  return (
    'vapid t=' +
    unsigned +
    '.' +
    signature.toString('base64url') +
    ', k=' +
    encodeBase64Url(keys.publicKey)
  );
}
