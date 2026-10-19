import { describe, expect, it } from 'vitest';
import { dateOf, dayOf, hourOf } from '../../src/L1_domain/clock';

describe('clock', () => {
  const at = new Date(2026, 9, 3, 7, 5).getTime();

  it('writes the hour with two digits each, and the day with a short month', () => {
    expect(hourOf(at)).toBe('07:05');
    expect(dateOf(at)).toBe('3 Oct');
  });

  it('gives two moments of the same day the same day key, and the next day another', () => {
    expect(dayOf(at)).toBe(dayOf(new Date(2026, 9, 3, 23, 59).getTime()));
    expect(dayOf(at)).not.toBe(dayOf(new Date(2026, 9, 4, 0, 0).getTime()));
  });
});
