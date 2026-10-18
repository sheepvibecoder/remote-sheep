import { describe, expect, it } from 'vitest';
import { encodeInvite, generateKeyPair, publicKeyId } from '@remote-sheep/protocol';
import {
  ACTIVE_PROFILE,
  chooseProfile,
  profilePreferences,
} from '../../src/L2_application/profile-choice';

const NOW = 1_700_000_000_000;

function memory(entries: Record<string, string> = {}) {
  const map = new Map(Object.entries(entries));
  return {
    map,
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
  };
}

describe('chooseProfile', () => {
  it('opens on the computer of a scanned QR code', () => {
    const agentKey = generateKeyPair().publicKey;
    const fragment =
      '#pair=' + encodeInvite({ agentKey, secret: new Uint8Array(32), expiresAt: NOW + 1000 });
    const preferences = memory({ [ACTIVE_PROFILE]: 'home' });
    expect(chooseProfile(preferences, fragment, 'office', NOW)).toBe(publicKeyId(agentKey));
    expect(preferences.map.get(ACTIVE_PROFILE)).toBe(publicKeyId(agentKey));
  });

  it('opens on the computer a tapped notification came from', () => {
    const preferences = memory({ [ACTIVE_PROFILE]: 'home' });
    expect(chooseProfile(preferences, '', 'office', NOW)).toBe('office');
    expect(preferences.map.get(ACTIVE_PROFILE)).toBe('office');
  });

  it('opens on the profile used last, or none before any pairing', () => {
    expect(chooseProfile(memory({ [ACTIVE_PROFILE]: 'home' }), '', null, NOW)).toBe('home');
    const fresh = memory();
    expect(chooseProfile(fresh, '', null, NOW)).toBeNull();
    expect(fresh.map.size).toBe(0);
  });
});

describe('profilePreferences', () => {
  it('keeps the same keys apart per profile', () => {
    const shared = memory();
    const home = profilePreferences(shared, 'home');
    const office = profilePreferences(shared, 'office');
    home.setItem('target', 'w5:pC');
    office.setItem('target', 'w1:pA');
    expect(home.getItem('target')).toBe('w5:pC');
    expect(office.getItem('target')).toBe('w1:pA');
    expect(shared.map.get('home:target')).toBe('w5:pC');
  });

  it('uses the plain keys before any profile exists', () => {
    const shared = memory({ target: 'w2:pB' });
    expect(profilePreferences(shared, null).getItem('target')).toBe('w2:pB');
  });
});
