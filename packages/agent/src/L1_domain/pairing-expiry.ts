// How long a paired phone stays trusted.
//
// A pairing ends 24 hours after the phone was last used or 7 days after it was
// made, whichever comes first: a lost phone stops working by the next day, and
// even a phone in daily use scans a fresh QR once a week, which bounds how long
// a copied phone key can be abused unnoticed.

import type { Device } from './ports/device-registry';

export const PAIRING_IDLE_MS = 24 * 60 * 60 * 1000;
export const PAIRING_MAX_AGE_MS = 7 * PAIRING_IDLE_MS;

type Dates = Pick<Device, 'pairedAt' | 'lastSeen'>;

/** The first instant at which the pairing is no longer accepted. */
export function pairingExpiresAt(device: Dates): number {
  return Math.min(device.lastSeen + PAIRING_IDLE_MS, device.pairedAt + PAIRING_MAX_AGE_MS);
}

export function isPairingExpired(device: Dates, now: number): boolean {
  return now >= pairingExpiresAt(device);
}
