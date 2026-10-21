import { describe, expect, it } from 'vitest';
import { DISPLAYABLE_IMAGE_TYPES, isDisplayableImage } from '../src/image-media';

describe('isDisplayableImage', () => {
  it('accepts exactly the four raster types the phone may show', () => {
    expect([...DISPLAYABLE_IMAGE_TYPES]).toEqual([
      'image/png',
      'image/jpeg',
      'image/gif',
      'image/webp',
    ]);
    for (const media of DISPLAYABLE_IMAGE_TYPES) expect(isDisplayableImage(media)).toBe(true);
  });

  it('refuses types that can carry script, and anything else', () => {
    for (const media of ['image/svg+xml', 'text/html', 'application/pdf', 'image/', '']) {
      expect(isDisplayableImage(media)).toBe(false);
    }
  });

  it('is an exact match: case variants, parameters and padding are refused', () => {
    for (const media of ['IMAGE/PNG', 'Image/Png', 'image/png; charset=utf-8', ' image/png']) {
      expect(isDisplayableImage(media)).toBe(false);
    }
  });
});
