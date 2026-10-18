import { describe, expect, it } from 'vitest';
import { encodeInvite } from '@remote-sheep/protocol';
import { pairFragmentFrom, readPairLink } from '../../src/L1_domain/pair-link';

const NOW = 1_700_000_000_000;
const invite = {
  agentKey: new Uint8Array(32).fill(1),
  secret: new Uint8Array(32).fill(2),
  expiresAt: NOW + 60_000,
};

describe('readPairLink', () => {
  it('finds no invite in an empty or unrelated fragment', () => {
    expect(readPairLink('', NOW)).toEqual({ kind: 'none' });
    expect(readPairLink('#top', NOW)).toEqual({ kind: 'none' });
  });

  it('returns the invite of a live pairing link', () => {
    expect(readPairLink('#pair=' + encodeInvite(invite), NOW)).toEqual({ kind: 'invite', invite });
  });

  it('rejects an invite past its expiry', () => {
    const late = encodeInvite({ ...invite, expiresAt: NOW });
    expect(readPairLink('#pair=' + late, NOW)).toEqual({ kind: 'expired' });
  });

  it('rejects a malformed invite', () => {
    expect(readPairLink('#pair=nonsense', NOW)).toEqual({ kind: 'invalid' });
    expect(readPairLink('#pair=', NOW)).toEqual({ kind: 'invalid' });
  });
});

describe('pairFragmentFrom', () => {
  it('keeps only the pairing fragment of a scanned QR code', () => {
    expect(pairFragmentFrom('https://relay.example/#pair=abc123')).toBe('#pair=abc123');
    expect(pairFragmentFrom('http://192.168.1.20:3999/#pair=abc123 ')).toBe('#pair=abc123');
  });

  it('is null for any other code', () => {
    expect(pairFragmentFrom('https://example.com/')).toBeNull();
    expect(pairFragmentFrom('https://relay.example/#pair=')).toBeNull();
    expect(pairFragmentFrom('')).toBeNull();
  });
});
