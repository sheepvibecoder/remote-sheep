// The accent colours the person can pick. Green and amber are left out on purpose: they already
// mean "done" and "working" in the status rings.

export interface Palette {
  id: string;
  label: string;
  /** The swatch shown in the picker (the light-theme accent). */
  color: string;
}

export const PALETTES: readonly Palette[] = [
  { id: 'watermelon', label: 'Watermelon', color: '#E5446D' },
  { id: 'coral', label: 'Coral', color: '#E8613F' },
  { id: 'raspberry', label: 'Raspberry', color: '#C92A62' },
  { id: 'violet', label: 'Violet', color: '#7357E8' },
  { id: 'ocean', label: 'Ocean', color: '#2B78D6' },
];

export const DEFAULT_PALETTE = 'watermelon';

/** A stored accent that still exists, else the default. */
export function paletteId(stored: string | null): string {
  return PALETTES.find((palette) => palette.id === stored)?.id ?? DEFAULT_PALETTE;
}
