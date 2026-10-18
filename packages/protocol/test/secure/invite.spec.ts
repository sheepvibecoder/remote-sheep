import { describe, expect, it } from 'vitest';
import {
  decodeInvite,
  encodeBase64Url,
  encodeInvite,
  generateKeyPair,
  pairingProof,
  verifyPairingProof,
} from '../../src/index';

const secret = new Uint8Array(32).fill(9);
const transcript = new Uint8Array(32).fill(3);

describe('invites', () => {
  it('round-trips the agent key, the secret and the expiry', () => {
    const invite = { agentKey: generateKeyPair().publicKey, secret, expiresAt: 1_760_000_000_000 };
    const text = encodeInvite(invite);
    expect(text).toMatch(/^[A-Za-z0-9_-]{43}\.[A-Za-z0-9_-]{43}\.1760000000000$/);
    expect(decodeInvite(text)).toEqual(invite);
  });

  it('rejects anything malformed', () => {
    const key = encodeBase64Url(new Uint8Array(32).fill(1));
    const short = encodeBase64Url(new Uint8Array(31));
    for (const text of [
      '',
      `${key}.${key}`,
      `${key}.${key}.1.2`,
      `${short}.${key}.1`,
      `${key}.${short}.1`,
      `${key}.${key}.`,
      `${key}.${key}.-1`,
      `${key}.${key}.1e3`,
      `${key}.${key}.99999999999999999999`,
      `${key}=.${key}.1`,
      `${key}.${key}.12a`,
    ]) {
      expect(decodeInvite(text), text).toBeNull();
    }
  });

  it('refuses to encode keys of the wrong length', () => {
    expect(() => encodeInvite({ agentKey: new Uint8Array(31), secret, expiresAt: 1 })).toThrow();
    expect(() =>
      encodeInvite({ agentKey: new Uint8Array(32), secret: new Uint8Array(16), expiresAt: 1 }),
    ).toThrow();
    expect(() => encodeInvite({ agentKey: new Uint8Array(32), secret, expiresAt: -1 })).toThrow();
    expect(() => encodeInvite({ agentKey: new Uint8Array(32), secret, expiresAt: 1.5 })).toThrow();
  });
});

describe('pairing proof', () => {
  it('verifies with the invite secret and the same transcript', () => {
    const proof = pairingProof(secret, transcript);
    expect(proof).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(verifyPairingProof(secret, transcript, proof)).toBe(true);
  });

  it('fails with a wrong secret, another transcript or a garbled proof', () => {
    const proof = pairingProof(secret, transcript);
    expect(verifyPairingProof(new Uint8Array(32).fill(8), transcript, proof)).toBe(false);
    expect(verifyPairingProof(secret, new Uint8Array(32), proof)).toBe(false);
    expect(verifyPairingProof(secret, transcript, proof.slice(0, -2))).toBe(false);
    expect(verifyPairingProof(secret, transcript, `${proof.slice(0, -1)}!`)).toBe(false);
    expect(verifyPairingProof(secret, transcript, '')).toBe(false);
  });
});
