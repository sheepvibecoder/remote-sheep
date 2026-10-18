// X25519 key pairs and the short id a phone is known by.
//
// The same code makes the agent's static key, each phone's static key and the
// ephemeral keys of every handshake, so phone and agent cannot drift apart.

import { x25519 } from '@noble/curves/ed25519.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex } from '@noble/hashes/utils.js';

export const KEY_BYTES = 32;

export interface KeyPair {
  readonly secretKey: Uint8Array;
  readonly publicKey: Uint8Array;
}

/**
 * A fresh key pair from the platform's secure random source; a 32-byte seed
 * makes it deterministic, which only tests should need.
 */
export function generateKeyPair(seed?: Uint8Array): KeyPair {
  if (seed && seed.length !== KEY_BYTES) throw new Error(`seed must be ${String(KEY_BYTES)} bytes`);
  // noble keeps the seed buffer as the secret key, so it gets a copy the caller cannot mutate.
  const { secretKey, publicKey } = x25519.keygen(seed?.slice());
  return { secretKey, publicKey };
}

/** First 16 hex chars of SHA-256(publicKey): the device id `remote-sheep devices` shows. */
export function publicKeyId(publicKey: Uint8Array): string {
  return bytesToHex(sha256(publicKey)).slice(0, 16);
}

/** Comparison whose duration does not depend on where the inputs differ. */
export function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let i = 0; i < a.length; i++) difference |= (a[i] ?? 0) ^ (b[i] ?? 0);
  return difference === 0;
}
