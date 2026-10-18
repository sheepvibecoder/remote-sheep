import { describe, expect, it } from 'vitest';
import {
  isPairingExpired,
  PAIRING_IDLE_MS,
  PAIRING_MAX_AGE_MS,
  pairingExpiresAt,
} from '../../src/L1_domain/pairing-expiry';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const T0 = 1_700_000_000_000;

describe('pairing expiry', () => {
  it('lasts 24 hours of idleness and 7 days in all', () => {
    expect(PAIRING_IDLE_MS).toBe(DAY);
    expect(PAIRING_MAX_AGE_MS).toBe(7 * DAY);
  });

  it('expires exactly 24 hours after the last use when that comes first', () => {
    const device = { pairedAt: T0, lastSeen: T0 + 2 * HOUR };
    expect(pairingExpiresAt(device)).toBe(T0 + 2 * HOUR + DAY);
    expect(isPairingExpired(device, T0 + 2 * HOUR + DAY - 1)).toBe(false);
    expect(isPairingExpired(device, T0 + 2 * HOUR + DAY)).toBe(true);
  });

  it('expires exactly 7 days after pairing even when used a moment ago', () => {
    const device = { pairedAt: T0, lastSeen: T0 + 7 * DAY - HOUR };
    expect(pairingExpiresAt(device)).toBe(T0 + 7 * DAY);
    expect(isPairingExpired(device, T0 + 7 * DAY - 1)).toBe(false);
    expect(isPairingExpired(device, T0 + 7 * DAY)).toBe(true);
  });
});
