import { describe, expect, it } from 'vitest';
import { DEFAULT_THEME, isDark, THEMES, themeChoice } from '../../src/L1_domain/theme';

describe('themes', () => {
  it('offers Auto, Light and Dark, with Light the default', () => {
    expect(THEMES.map((theme) => theme.label)).toEqual(['Auto', 'Light', 'Dark']);
    expect(DEFAULT_THEME).toBe('light');
  });

  it('keeps a stored choice and falls back to Light for nothing or an unknown one', () => {
    expect(themeChoice('auto')).toBe('auto');
    expect(themeChoice('dark')).toBe('dark');
    expect(themeChoice(null)).toBe('light');
    expect(themeChoice('sepia')).toBe('light');
  });

  it('is dark on Dark, light on Light, and as the device is on Auto', () => {
    expect(isDark('dark', false)).toBe(true);
    expect(isDark('light', true)).toBe(false);
    expect(isDark('auto', true)).toBe(true);
    expect(isDark('auto', false)).toBe(false);
  });
});
