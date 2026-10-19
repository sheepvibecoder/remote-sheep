// Light, dark, or whatever the device is set to. Light stays the default so a phone that never
// picked keeps the look it always had.

export type ThemeChoice = 'auto' | 'light' | 'dark';

export interface Theme {
  id: ThemeChoice;
  label: string;
}

export const THEMES: readonly Theme[] = [
  { id: 'auto', label: 'Auto' },
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
];

export const DEFAULT_THEME: ThemeChoice = 'light';

/** Where the phone keeps the choice: the key it always used, read by the store and the first paint. */
export const THEME_KEY = 'theme';

/** A stored choice that is still on offer, else Light. */
export function themeChoice(stored: string | null): ThemeChoice {
  return THEMES.find((theme) => theme.id === stored)?.id ?? DEFAULT_THEME;
}

/** Whether the page is drawn dark: Auto follows the device, the others ignore it. */
export function isDark(choice: ThemeChoice, deviceDark: boolean): boolean {
  return choice === 'auto' ? deviceDark : choice === 'dark';
}
