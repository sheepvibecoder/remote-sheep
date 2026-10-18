import { describe, expect, it } from 'vitest';
import { hasSettled } from '../../src/L1_domain/session-status';

describe('hasSettled', () => {
  it('is true when a working session finishes or needs an answer', () => {
    expect(hasSettled('working', 'done')).toBe(true);
    expect(hasSettled('working', 'blocked')).toBe(true);
  });

  it('is false for any other change, and for a session seen for the first time', () => {
    expect(hasSettled('working', 'idle')).toBe(false);
    expect(hasSettled('idle', 'done')).toBe(false);
    expect(hasSettled('blocked', 'done')).toBe(false);
    expect(hasSettled(undefined, 'done')).toBe(false);
  });
});
