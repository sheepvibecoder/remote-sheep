// The QR code the agent prints so a phone can pair: a pairing link (L1 pairing-links) drawn
// in terminal characters.

import QRCode from 'qrcode';

/** The text as a QR code of half-block characters, small enough for a terminal. */
export function renderQr(text: string): Promise<string> {
  return QRCode.toString(text, { type: 'terminal', small: true });
}
