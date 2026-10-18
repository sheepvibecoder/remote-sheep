// What a pairing link in the address bar holds.
//
// The agent's QR opens the page at `#pair=<invite>`: a fragment never reaches a
// server, so the one-time secret stays between the computer's screen and this phone.

import { decodeInvite, type Invite } from '@remote-sheep/protocol';

export type PairLink =
  { kind: 'none' } | { kind: 'invite'; invite: Invite } | { kind: 'expired' } | { kind: 'invalid' };

const PREFIX = '#pair=';

/**
 * The pairing fragment inside the text of a scanned QR code (the agent's
 * `<origin>/#pair=<invite>`), or null for any other code. Only the fragment is
 * kept: the page applies it to its own address, so a QR printed with a LAN
 * address still adds the computer to the profiles of the relay page.
 */
export function pairFragmentFrom(scanned: string): string | null {
  const at = scanned.indexOf(PREFIX);
  if (at < 0) return null;
  const fragment = scanned.slice(at).trim();
  return fragment.length > PREFIX.length ? fragment : null;
}

/**
 * Reads the invite from a URL fragment. An expired invite is refused here so
 * the person is told to scan a new QR instead of watching the agent hang up.
 */
export function readPairLink(fragment: string, now: number): PairLink {
  if (!fragment.startsWith(PREFIX)) return { kind: 'none' };
  const invite = decodeInvite(fragment.slice(PREFIX.length));
  if (!invite) return { kind: 'invalid' };
  if (invite.expiresAt <= now) return { kind: 'expired' };
  return { kind: 'invite', invite };
}
