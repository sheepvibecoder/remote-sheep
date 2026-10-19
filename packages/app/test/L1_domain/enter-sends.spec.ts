import { describe, expect, it } from 'vitest';
import { enterSends } from '../../src/L1_domain/enter-sends';

const enter = { key: 'Enter', shiftKey: false, isComposing: false };

describe('enterSends', () => {
  it('sends on Enter with a keyboard and mouse', () => {
    expect(enterSends(enter, true)).toBe(true);
  });

  it('breaks the line on Shift+Enter with a keyboard and mouse', () => {
    expect(enterSends({ ...enter, shiftKey: true }, true)).toBe(false);
  });

  it('breaks the line on Enter on a touch screen', () => {
    expect(enterSends(enter, false)).toBe(false);
  });

  it('leaves Enter alone while an input method is composing a word', () => {
    expect(enterSends({ ...enter, isComposing: true }, true)).toBe(false);
  });

  it('ignores every other key', () => {
    expect(enterSends({ ...enter, key: 'a' }, true)).toBe(false);
  });
});
