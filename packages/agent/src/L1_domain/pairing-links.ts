// How one invite reaches a phone or a browser: the same invite at every address the agent has,
// in the order the QR code prefers them.
//
// The relay works from anywhere, so it leads; the LAN follows; a browser on this PC can always
// use loopback, which is a secure context even over plain http. The invite rides in the URL
// fragment: browsers never send it to a server, and the app removes it once read.

import { encodeInvite, type Invite } from '@remote-sheep/protocol';
import type { Pairing, PairingLink, PairingPlace } from './pairing';
import type { InviteSource, PairingRequests } from './ports/pairing-requests';

export interface PairingOrigins {
  /** Read on every pairing: the relay can be set or turned off while the agent runs. */
  readonly relay: () => string | null;
  readonly network: readonly string[];
  readonly local: string;
}

/** `<origin>/#pair=<invite>`, where origin is how the device reaches the agent. */
export function pairingUrl(origin: string, invite: Invite): string {
  return origin + '/#pair=' + encodeInvite(invite);
}

export class PairingLinks implements PairingRequests {
  constructor(
    private readonly origins: PairingOrigins,
    private readonly invites: InviteSource,
  ) {}

  /** Makes a new invite (voiding the previous one) and lays it out at every origin. */
  newPairing(): Pairing {
    const invite = this.invites.createInvite();
    const link = (where: PairingPlace, origin: string): PairingLink => ({
      where,
      url: pairingUrl(origin, invite),
    });
    const relay = this.origins.relay();
    return {
      links: [
        ...(relay ? [link('relay', relay)] : []),
        ...this.origins.network.map((origin) => link('network', origin)),
        link('this-pc', this.origins.local),
      ],
      expiresAt: invite.expiresAt,
    };
  }
}
