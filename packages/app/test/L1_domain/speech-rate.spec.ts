import { describe, expect, it } from 'vitest';
import { DEFAULT_SPEECH_RATE, SPEECH_RATES, speechRate } from '../../src/L1_domain/speech-rate';

describe('speech rate', () => {
  it('offers four speeds, Normal being what the phone read at before', () => {
    expect(SPEECH_RATES.map((r) => r.label)).toEqual(['Slow', 'Normal', 'Fast', 'Faster']);
    expect(DEFAULT_SPEECH_RATE).toBe(1.05);
    expect(SPEECH_RATES.map((r) => r.rate)).toContain(DEFAULT_SPEECH_RATE);
  });

  it('keeps a stored speed that is on offer', () => {
    expect(speechRate('1.5')).toBe(1.5);
    expect(speechRate('0.8')).toBe(0.8);
  });

  it('falls back to Normal for nothing or for a speed that is not on offer', () => {
    expect(speechRate(null)).toBe(1.05);
    expect(speechRate('abc')).toBe(1.05);
    expect(speechRate('9')).toBe(1.05);
  });
});
