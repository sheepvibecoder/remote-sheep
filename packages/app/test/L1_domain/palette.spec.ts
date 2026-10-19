import { describe, expect, it } from 'vitest';
import { DEFAULT_PALETTE, PALETTES, paletteId } from '../../src/L1_domain/palette';

describe('palettes', () => {
  it('offers five accents, Watermelon first and the default', () => {
    expect(PALETTES.map((p) => p.id)).toEqual([
      'watermelon',
      'coral',
      'raspberry',
      'violet',
      'ocean',
    ]);
    expect(DEFAULT_PALETTE).toBe('watermelon');
  });

  it('keeps a stored accent that still exists', () => {
    expect(paletteId('violet')).toBe('violet');
  });

  it('falls back to the default for nothing or for an accent that is gone', () => {
    expect(paletteId(null)).toBe('watermelon');
    expect(paletteId('green')).toBe('watermelon');
  });
});
