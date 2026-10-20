// Settings → Add a device: a new pairing, as the QR pane shows it, for the app to draw.
//
// The app has no QR encoder of its own, so the agent draws the code as an SVG image, the same
// library the terminal QR uses; the app shows it as an image, never as markup.

import type { PairingOffer } from '@remote-sheep/protocol';
import QRCode from 'qrcode';
import type { PairingOffers, PairingRequests } from '../../L1_domain/ports/pairing-requests';

export class QrPairingOffers implements PairingOffers {
  constructor(private readonly pairings: PairingRequests) {}

  async offerPairing(): Promise<PairingOffer> {
    const pairing = this.pairings.newPairing();
    const first = pairing.links[0];
    if (!first) throw new Error('the agent has no address to pair from');
    return {
      links: [...pairing.links],
      expiresAt: pairing.expiresAt,
      qr: await QRCode.toString(first.url, { type: 'svg', margin: 2 }),
    };
  }
}
