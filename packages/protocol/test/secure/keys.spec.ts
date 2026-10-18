import { describe, expect, it } from 'vitest';
import { decodeBase64Url, encodeBase64Url, generateKeyPair, publicKeyId } from '../../src/index';

describe('key pairs', () => {
  it('generates 32-byte X25519 keys, a fresh pair each time', () => {
    const a = generateKeyPair();
    const b = generateKeyPair();
    expect(a.publicKey).toHaveLength(32);
    expect(a.secretKey).toHaveLength(32);
    expect(a.publicKey).not.toEqual(b.publicKey);
  });

  it('derives the same pair from the same seed, so tests can be deterministic', () => {
    const seed = new Uint8Array(32).fill(7);
    expect(generateKeyPair(seed)).toEqual(generateKeyPair(seed));
    expect(seed).toEqual(new Uint8Array(32).fill(7));
  });

  it('refuses a seed that is not 32 bytes', () => {
    expect(() => generateKeyPair(new Uint8Array(31))).toThrow();
  });
});

describe('publicKeyId', () => {
  it('is 16 lowercase hex chars and stable for one key', () => {
    const { publicKey } = generateKeyPair();
    const id = publicKeyId(publicKey);
    expect(id).toMatch(/^[0-9a-f]{16}$/);
    expect(publicKeyId(publicKey.slice())).toBe(id);
  });

  it('is the first 16 hex chars of SHA-256 of the key', () => {
    // SHA-256 of 32 zero bytes is 66687aadf862bd776c8fc18b8e9f8e20089714856ee233b3902a591d0d5f2925.
    expect(publicKeyId(new Uint8Array(32))).toBe('66687aadf862bd77');
  });

  it('differs between keys', () => {
    expect(publicKeyId(generateKeyPair().publicKey)).not.toBe(
      publicKeyId(generateKeyPair().publicKey),
    );
  });
});

describe('base64url', () => {
  it('round-trips every length without padding', () => {
    for (let length = 0; length < 40; length++) {
      const data = Uint8Array.from({ length }, (_, i) => (i * 37 + length) % 256);
      const text = encodeBase64Url(data);
      expect(text).toMatch(/^[A-Za-z0-9_-]*$/);
      expect(decodeBase64Url(text)).toEqual(data);
    }
  });

  it('uses the URL-safe alphabet', () => {
    expect(encodeBase64Url(new Uint8Array([0xfb, 0xff, 0xfe]))).toBe('-__-');
  });

  it('rejects padding, foreign characters, impossible lengths and non-canonical tails', () => {
    expect(decodeBase64Url('AA==')).toBeNull();
    expect(decodeBase64Url('A+/B')).toBeNull();
    expect(decodeBase64Url('AA A')).toBeNull();
    expect(decodeBase64Url('AAAAA')).toBeNull();
    // 'AB' carries one byte; the low bits of 'B' must be zero for a canonical encoding.
    expect(decodeBase64Url('AB')).toBeNull();
    expect(decodeBase64Url('AA')).toEqual(new Uint8Array([0]));
  });
});
