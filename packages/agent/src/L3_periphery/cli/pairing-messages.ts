// What the terminal shows to pair a phone or a browser: the QR code, labelled links, and the
// keys of `remote-sheep qr`.
//
// A pairing link is a live credential for five minutes, so the background agent never prints
// one into its log; it points at `remote-sheep qr`, which asks the running agent for a fresh one.

import type { Pairing, PairingPlace } from '../../L1_domain/pairing';
import { renderQr } from '../terminal/pairing-qr';
import { formatTime } from './device-table';

const LABELS: Record<PairingPlace, string> = {
  relay: 'Through your relay:',
  network: 'On this network:',
  'this-pc': "On this PC's browser:",
};

/** The QR code of the first link, when it expires, then every link under its label. */
export async function describePairing(pairing: Pairing): Promise<string> {
  const lines = [
    await renderQr(pairing.links[0]?.url ?? ''),
    'Scan this QR code with the phone, or open a link below in a browser, to pair it.',
    'It pairs one phone or browser and expires at ' + formatTime(pairing.expiresAt) + '.',
  ];
  for (const link of pairing.links) lines.push(LABELS[link.where], '  ' + link.url);
  return lines.join('\n');
}

export const BACKGROUND_PAIRING_HINT =
  'To pair a phone or a browser, run the Herdr action "Show pairing QR" or `remote-sheep qr`.';

export const QR_KEYS_HINT =
  'Enter: a new QR code (the previous one stops working). q or Esc: close.';

/** A key pressed in `remote-sheep qr`, read raw: Enter asks again, q, Esc or Ctrl+C close. */
export function qrKey(chunk: string): 'again' | 'close' | null {
  if (chunk === '\r' || chunk === '\n' || chunk === '\r\n') return 'again';
  // A lone Escape: arrow keys also start with it, but arrive as a longer sequence.
  if (chunk === 'q' || chunk === 'Q' || chunk === '\u001b' || chunk === '\u0003') return 'close';
  return null;
}
