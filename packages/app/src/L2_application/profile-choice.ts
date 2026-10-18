// Which profile a page opens on, decided before anything else is built, because
// the per-session preferences (unread badges, the open chat) belong to one profile:
// pane ids such as `w5:pC` repeat between computers.

import { readPairLink } from '../L1_domain/pair-link';
import type { Preferences } from '../L1_domain/ports/preferences';
import { profileIdOf } from '../L1_domain/profile';

/** The preference that holds the id of the profile the page shows. */
export const ACTIVE_PROFILE = 'profile';

/**
 * A scanned QR wins (the page is pairing with that computer), then the computer a
 * tapped notification came from, then the profile the phone used last. Records the
 * choice and returns it; null when nothing names one yet.
 */
export function chooseProfile(
  preferences: Preferences,
  fragment: string,
  fromNotification: string | null,
  now: number,
): string | null {
  const link = readPairLink(fragment, now);
  const chosen =
    link.kind === 'invite'
      ? profileIdOf(link.invite.agentKey)
      : fromNotification || preferences.getItem(ACTIVE_PROFILE) || null;
  if (chosen) preferences.setItem(ACTIVE_PROFILE, chosen);
  return chosen;
}

/** The preferences of one profile: the same keys, kept apart per profile id. */
export function profilePreferences(preferences: Preferences, profile: string | null): Preferences {
  const prefix = profile ? profile + ':' : '';
  return {
    getItem: (key) => preferences.getItem(prefix + key),
    setItem: (key, value) => {
      preferences.setItem(prefix + key, value);
    },
  };
}
