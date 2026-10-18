import { describe, expect, it } from 'vitest';
import { isNewer } from '../../src/L1_domain/version';

describe('isNewer', () => {
  it('compares each part as a number, not as text', () => {
    expect(isNewer('0.5.10', '0.5.9')).toBe(true);
    expect(isNewer('0.6.0', '0.5.1')).toBe(true);
    expect(isNewer('1.0.0', '0.9.9')).toBe(true);
  });

  it('is false for the same or an older version', () => {
    expect(isNewer('0.5.1', '0.5.1')).toBe(false);
    expect(isNewer('0.5.0', '0.5.1')).toBe(false);
  });

  it('is false for something that is not a version', () => {
    expect(isNewer('<html>', '0.5.1')).toBe(false);
  });
});
