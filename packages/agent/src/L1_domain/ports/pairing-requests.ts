import type { Invite, PairingOffer } from '@remote-sheep/protocol';
import type { Pairing } from '../pairing';

/** What the control channel needs: a new pairing for whoever on this PC asks for one. */
export interface PairingRequests {
  newPairing(): Pairing;
}

/** Where new invites come from; making one voids the previous one. */
export interface InviteSource {
  createInvite(): Invite;
}

/** What a paired device may ask for: a new pairing with its QR code, to pair another device. */
export interface PairingOffers {
  offerPairing(): Promise<PairingOffer>;
}
