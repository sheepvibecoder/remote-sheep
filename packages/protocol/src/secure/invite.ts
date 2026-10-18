// The invite a QR carries, and the proof a phone gives that it scanned it.
//
// The invite travels in the URL fragment as `<agentKey>.<secret>.<expiresAt>`,
// so it never reaches a server. Its secret is not sent back: the phone proves
// it knows it with an HMAC over the handshake transcript, which is useless to
// anyone replaying it on another connection.

import { hmac } from '@noble/hashes/hmac.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { decodeBase64Url, encodeBase64Url } from './base64url';
import { constantTimeEqual, KEY_BYTES } from './keys';

export const INVITE_SECRET_BYTES = 32;

export interface Invite {
  /** The agent's static public key: the phone trusts only this agent. */
  agentKey: Uint8Array;
  /** One-time secret; pairs at most one phone. */
  secret: Uint8Array;
  /** Epoch milliseconds after which the agent refuses the invite. */
  expiresAt: number;
}

export function encodeInvite(invite: Invite): string {
  if (invite.agentKey.length !== KEY_BYTES) {
    throw new Error(`agent key must be ${String(KEY_BYTES)} bytes`);
  }
  if (invite.secret.length !== INVITE_SECRET_BYTES) {
    throw new Error(`invite secret must be ${String(INVITE_SECRET_BYTES)} bytes`);
  }
  if (!Number.isSafeInteger(invite.expiresAt) || invite.expiresAt < 0) {
    throw new Error('invite expiry must be a non-negative integer');
  }
  return `${encodeBase64Url(invite.agentKey)}.${encodeBase64Url(invite.secret)}.${String(invite.expiresAt)}`;
}

/** Returns null for anything that is not a well-formed invite. */
export function decodeInvite(text: string): Invite | null {
  const parts = text.split('.');
  if (parts.length !== 3) return null;
  const [key, secretText, expiry] = parts as [string, string, string];
  const agentKey = decodeBase64Url(key);
  const secret = decodeBase64Url(secretText);
  if (agentKey?.length !== KEY_BYTES || secret?.length !== INVITE_SECRET_BYTES) return null;
  if (!/^\d{1,16}$/.test(expiry)) return null;
  const expiresAt = Number(expiry);
  if (!Number.isSafeInteger(expiresAt)) return null;
  return { agentKey, secret, expiresAt };
}

/** HMAC-SHA256(invite secret, transcript), base64url: the `proof` of the `confirm` message. */
export function pairingProof(secret: Uint8Array, transcript: Uint8Array): string {
  return encodeBase64Url(hmac(sha256, secret, transcript));
}

export function verifyPairingProof(
  secret: Uint8Array,
  transcript: Uint8Array,
  proof: string,
): boolean {
  const received = decodeBase64Url(proof);
  if (!received) return false;
  return constantTimeEqual(hmac(sha256, secret, transcript), received);
}
