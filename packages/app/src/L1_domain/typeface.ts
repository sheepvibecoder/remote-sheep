// The family the reading text is drawn in. Normal is the app's own mix (sans for the interface,
// serif for the agent's prose); the others draw all of it in one family. The terminal and code stay
// monospace whatever is picked.

export type TypefaceChoice = 'normal' | 'serif' | 'mono';

export interface Typeface {
  id: TypefaceChoice;
  label: string;
}

export const TYPEFACES: readonly Typeface[] = [
  { id: 'normal', label: 'Normal' },
  { id: 'serif', label: 'Serif' },
  { id: 'mono', label: 'Mono' },
];

export const DEFAULT_TYPEFACE: TypefaceChoice = 'normal';

/** Where the phone keeps the choice, read by the store and the first paint. */
export const TYPEFACE_KEY = 'typeface';

/** A stored choice that is still on offer, else Normal. */
export function typefaceChoice(stored: string | null): TypefaceChoice {
  return TYPEFACES.find((typeface) => typeface.id === stored)?.id ?? DEFAULT_TYPEFACE;
}
