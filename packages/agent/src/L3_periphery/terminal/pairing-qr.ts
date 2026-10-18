// The QR code the agent prints so a phone can pair.
//
// The invite rides in the URL fragment: browsers never send it to a server,
// and the phone app removes it from the address bar once read.

import QRCode from 'qrcode';
import { encodeInvite, type Invite } from '@remote-sheep/protocol';

/** `<origin>/#pair=<invite>`, where origin is how the phone reaches the agent. */
export function pairingUrl(origin: string, invite: Invite): string {
  return origin + '/#pair=' + encodeInvite(invite);
}

/** The text as a QR code of half-block characters, small enough for a terminal. */
export function renderQr(text: string): Promise<string> {
  return QRCode.toString(text, { type: 'terminal', small: true });
}
