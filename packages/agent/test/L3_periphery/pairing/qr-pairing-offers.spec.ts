import { describe, expect, it } from 'vitest';
import type { Pairing } from '../../../src/L1_domain/pairing';
import { QrPairingOffers } from '../../../src/L3_periphery/pairing/qr-pairing-offers';

describe('QrPairingOffers', () => {
  it('hands out a new pairing with its first link drawn as an SVG QR code', async () => {
    let asked = 0;
    const pairing: Pairing = {
      links: [
        { where: 'network', url: 'http://192.168.1.20:3998/#pair=n' },
        { where: 'this-pc', url: 'http://127.0.0.1:3998/#pair=n' },
      ],
      expiresAt: 1700000300000,
    };
    const offers = new QrPairingOffers({
      newPairing: () => {
        asked++;
        return pairing;
      },
    });
    const offer = await offers.offerPairing();
    expect(asked).toBe(1);
    expect(offer.links).toEqual(pairing.links);
    expect(offer.expiresAt).toBe(1700000300000);
    expect(offer.qr.startsWith('<svg')).toBe(true);
    expect(offer.qr).not.toContain('<script');
  });
});
