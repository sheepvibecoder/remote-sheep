import { describe, expect, it } from 'vitest';
import {
  DEFAULT_TYPEFACE,
  TYPEFACE_KEY,
  TYPEFACES,
  typefaceChoice,
} from '../../src/L1_domain/typeface';

describe('typefaces', () => {
  it('offers Normal, Serif and Mono, with Normal the default', () => {
    expect(TYPEFACES.map((typeface) => typeface.label)).toEqual(['Normal', 'Serif', 'Mono']);
    expect(DEFAULT_TYPEFACE).toBe('normal');
    expect(TYPEFACE_KEY).toBe('typeface');
  });

  it('keeps a stored choice and falls back to Normal for nothing or an unknown one', () => {
    expect(typefaceChoice('serif')).toBe('serif');
    expect(typefaceChoice('mono')).toBe('mono');
    expect(typefaceChoice(null)).toBe('normal');
    expect(typefaceChoice('comic')).toBe('normal');
  });
});
