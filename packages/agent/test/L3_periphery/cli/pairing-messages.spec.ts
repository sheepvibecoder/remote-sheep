import { describe, expect, it } from 'vitest';
import {
  BACKGROUND_PAIRING_HINT,
  describePairing,
  qrKey,
} from '../../../src/L3_periphery/cli/pairing-messages';
import type { Pairing } from '../../../src/L1_domain/pairing';

const PAIRING: Pairing = {
  links: [
    { where: 'relay', url: 'https://relay.example.com/#pair=r' },
    { where: 'network', url: 'http://192.168.1.20:3999/#pair=n' },
    { where: 'this-pc', url: 'http://127.0.0.1:3999/#pair=p' },
  ],
  expiresAt: new Date(2026, 9, 19, 14, 5).getTime(),
};

describe('describePairing', () => {
  it('draws the first link as a QR code and labels every link', async () => {
    const text = await describePairing(PAIRING);
    expect(text).toMatch(/[█▀▄]/);
    expect(text).toContain('expires at 2026-10-19 14:05');
    expect(text).toContain('Through your relay:\n  https://relay.example.com/#pair=r');
    expect(text).toContain('On this network:\n  http://192.168.1.20:3999/#pair=n');
    expect(text).toContain("On this PC's browser:\n  http://127.0.0.1:3999/#pair=p");
  });

  it('still shows the QR and the browser link with no relay and no network', async () => {
    const text = await describePairing({ links: [PAIRING.links[2]!], expiresAt: 0 });
    expect(text).toMatch(/[█▀▄]/);
    expect(text).toContain("On this PC's browser:\n  http://127.0.0.1:3999/#pair=p");
    expect(text).not.toContain('relay:');
  });
});

describe('BACKGROUND_PAIRING_HINT', () => {
  it('points at the qr action instead of putting a pairing link in the log', () => {
    expect(BACKGROUND_PAIRING_HINT).toContain('remote-sheep qr');
    expect(BACKGROUND_PAIRING_HINT).not.toContain('#pair=');
  });
});

describe('qrKey', () => {
  it('reads Enter as a new QR and q, Esc or Ctrl+C as close', () => {
    expect(qrKey('\r')).toBe('again');
    expect(qrKey('\n')).toBe('again');
    for (const key of ['q', 'Q', '\u001b', '\u0003']) expect(qrKey(key)).toBe('close');
    for (const key of ['x', '\u001b[A', ' ']) expect(qrKey(key)).toBeNull();
  });
});
