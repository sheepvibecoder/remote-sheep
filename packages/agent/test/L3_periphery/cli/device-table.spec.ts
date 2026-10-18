import { describe, expect, it } from 'vitest';
import { generateKeyPair, publicKeyId } from '@remote-sheep/protocol';
import { formatDevices, formatTime } from '../../../src/L3_periphery/cli/device-table';

const HOUR = 60 * 60 * 1000;
const T0 = new Date(2026, 9, 15, 9, 5).getTime();

describe('formatTime', () => {
  it('shows local date and minutes', () => {
    expect(formatTime(T0)).toBe('2026-10-15 09:05');
  });
});

describe('formatDevices', () => {
  it('tells how to pair when there is no phone', () => {
    expect(formatDevices([], T0)).toBe(
      'No paired phones. Run `remote-sheep` and scan its QR code to pair one.',
    );
  });

  it('lists id, pairing, last use and expiry, and marks expired pairings', () => {
    const key = () => generateKeyPair().publicKey;
    const a = key();
    const b = key();
    const table = formatDevices(
      [
        { id: publicKeyId(a), publicKey: a, pairedAt: T0, lastSeen: T0 + HOUR },
        { id: publicKeyId(b), publicKey: b, pairedAt: T0 - 48 * HOUR, lastSeen: T0 - 30 * HOUR },
      ],
      T0 + 2 * HOUR,
    );
    expect(table.split('\n')).toEqual([
      'ID                PAIRED            LAST USED         EXPIRES',
      `${publicKeyId(a)}  ${formatTime(T0)}  ${formatTime(T0 + HOUR)}  ${formatTime(T0 + 25 * HOUR)}`,
      `${publicKeyId(b)}  ${formatTime(T0 - 48 * HOUR)}  ${formatTime(T0 - 30 * HOUR)}  expired`,
    ]);
  });
});
