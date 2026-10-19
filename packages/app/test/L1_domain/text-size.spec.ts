import { describe, expect, it } from 'vitest';
import {
  DEFAULT_TEXT_SIZE,
  TEXT_SIZE_KEY,
  TEXT_SIZES,
  textSize,
  textSizePx,
} from '../../src/L1_domain/text-size';

describe('text sizes', () => {
  it('offers Small, Normal, Large and Extra large, with Normal the default', () => {
    expect(TEXT_SIZES.map((size) => size.label)).toEqual([
      'Small',
      'Normal',
      'Large',
      'Extra large',
    ]);
    expect(DEFAULT_TEXT_SIZE).toBe(1);
    expect(TEXT_SIZE_KEY).toBe('size');
  });

  it('keeps the steps a phone already stored, at the sizes it always had', () => {
    expect(['0', '1', '2', '3'].map((stored) => textSizePx(textSize(stored)))).toEqual([
      '15px',
      '17px',
      '20px',
      '23px',
    ]);
  });

  it('falls back to Normal for nothing, an empty value or an unknown step', () => {
    expect(textSize(null)).toBe(1);
    expect(textSize('')).toBe(1);
    expect(textSize('7')).toBe(1);
    expect(textSize('big')).toBe(1);
    expect(textSizePx(9)).toBe('17px');
  });
});
