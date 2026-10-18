// Web Push payload encryption: RFC 8291 with the aes128gcm content coding of RFC 8188.
//
// One record per message. The sender makes an ephemeral P-256 key and a salt for each
// push; the phone's public key and auth secret come from its subscription. The key pair
// and the salt can be injected only so a test can reproduce the RFC's own example.

import {
  createCipheriv,
  createPrivateKey,
  createPublicKey,
  diffieHellman,
  generateKeyPairSync,
  hkdfSync,
  randomBytes,
  type KeyObject,
} from 'node:crypto';

export const RECORD_SIZE = 4096;
// A record holds the payload, one delimiter octet and the 16-byte GCM tag.
const MAX_PLAINTEXT = RECORD_SIZE - 16 - 1;
const POINT_LENGTH = 65;
const TEXT = new TextEncoder();

export interface EphemeralKey {
  readonly privateKey: KeyObject;
  /** Uncompressed P-256 point: 0x04 || x || y. */
  readonly publicKey: Uint8Array;
}

const b64 = (bytes: Uint8Array) => Buffer.from(bytes).toString('base64url');

/** The key object for an uncompressed P-256 point. */
export function p256PublicKey(point: Uint8Array): KeyObject {
  if (point.length !== POINT_LENGTH || point[0] !== 4) throw new Error('not a P-256 point');
  return createPublicKey({
    key: { kty: 'EC', crv: 'P-256', x: b64(point.subarray(1, 33)), y: b64(point.subarray(33)) },
    format: 'jwk',
  });
}

/** The private key object for secret scalar `secret` whose public point is `point`. */
export function p256PrivateKey(secret: Uint8Array, point: Uint8Array): KeyObject {
  if (point.length !== POINT_LENGTH || point[0] !== 4) throw new Error('not a P-256 point');
  return createPrivateKey({
    key: {
      kty: 'EC',
      crv: 'P-256',
      x: b64(point.subarray(1, 33)),
      y: b64(point.subarray(33)),
      d: b64(secret),
    },
    format: 'jwk',
  });
}

export function ephemeralKeyFrom(secret: Uint8Array, point: Uint8Array): EphemeralKey {
  return { privateKey: p256PrivateKey(secret, point), publicKey: point };
}

/** A new random key pair, with the public half as an uncompressed point. */
export function generateP256(): EphemeralKey {
  const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
  const jwk = publicKey.export({ format: 'jwk' });
  const x = Buffer.from(jwk.x ?? '', 'base64url');
  const y = Buffer.from(jwk.y ?? '', 'base64url');
  return { privateKey, publicKey: new Uint8Array(Buffer.concat([Buffer.from([4]), x, y])) };
}

const concat = (...parts: Uint8Array[]) => Buffer.concat(parts);

const derive = (ikm: Uint8Array, salt: Uint8Array, info: Uint8Array, length: number) =>
  Buffer.from(hkdfSync('sha256', ikm, salt, info, length));

export interface EncryptInput {
  readonly plaintext: Uint8Array;
  /** The phone's public key (65 bytes) and auth secret (16 bytes). */
  readonly p256dh: Uint8Array;
  readonly auth: Uint8Array;
  readonly ephemeral?: EphemeralKey;
  readonly salt?: Uint8Array;
}

/** The request body: the aes128gcm header followed by the single encrypted record. */
export function encryptPayload(input: EncryptInput): Uint8Array<ArrayBuffer> {
  if (input.plaintext.length > MAX_PLAINTEXT) throw new Error('push payload too long');
  const ephemeral = input.ephemeral ?? generateP256();
  const salt = input.salt ?? randomBytes(16);

  const secret = diffieHellman({
    privateKey: ephemeral.privateKey,
    publicKey: p256PublicKey(input.p256dh),
  });
  const ikm = derive(
    secret,
    input.auth,
    concat(TEXT.encode('WebPush: info\0'), input.p256dh, ephemeral.publicKey),
    32,
  );
  const key = derive(ikm, salt, TEXT.encode('Content-Encoding: aes128gcm\0'), 16);
  const nonce = derive(ikm, salt, TEXT.encode('Content-Encoding: nonce\0'), 12);

  const cipher = createCipheriv('aes-128-gcm', key, nonce);
  // 0x02 closes the only, and therefore last, record.
  const sealed = concat(
    cipher.update(concat(input.plaintext, Uint8Array.of(2))),
    cipher.final(),
    cipher.getAuthTag(),
  );

  const header = Buffer.alloc(21);
  header.set(salt, 0);
  header.writeUInt32BE(RECORD_SIZE, 16);
  header.writeUInt8(ephemeral.publicKey.length, 20);
  return concat(header, ephemeral.publicKey, sealed);
}
