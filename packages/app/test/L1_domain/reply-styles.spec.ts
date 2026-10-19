import { describe, expect, it } from 'vitest';
import {
  DEFAULT_REPLY_STYLES,
  isFixedStyle,
  promptOf,
  readStyles,
  replyStyle,
  withoutStyle,
  withStyle,
} from '../../src/L1_domain/reply-styles';

const ids = (styles: readonly { id: string }[]) => styles.map((s) => s.id);

describe('reply styles', () => {
  it('start with the five of the mockup, Off first', () => {
    expect(DEFAULT_REPLY_STYLES.map((s) => s.label)).toEqual([
      'Off',
      'One line',
      'Explain simply',
      '10 lines max',
      'En español',
    ]);
  });

  it('pick the style by id, fall back to Off for a removed one, and start on one line', () => {
    expect(replyStyle(DEFAULT_REPLY_STYLES, 'simple').label).toBe('Explain simply');
    expect(replyStyle(DEFAULT_REPLY_STYLES, 'gone').id).toBe('off');
    expect(replyStyle(DEFAULT_REPLY_STYLES, null).id).toBe('one-line');
    expect(replyStyle(withoutStyle(DEFAULT_REPLY_STYLES, 'one-line'), null).id).toBe('off');
  });

  it('add a style written as a prompt, which goes after the order in brackets', () => {
    const added = withStyle(DEFAULT_REPLY_STYLES, null, 'Three bullets', 'responde en 3 viñetas');
    const style = added?.at(-1);
    expect(style).toMatchObject({ label: 'Three bullets', suffix: ' (responde en 3 viñetas)' });
    expect(promptOf(style?.suffix ?? '')).toBe('responde en 3 viñetas');
  });

  it('give each new style an id of its own, even after one was removed', () => {
    const one = withStyle(DEFAULT_REPLY_STYLES, null, 'A', 'a') ?? [];
    const two = withStyle(one, null, 'B', 'b') ?? [];
    const without = withoutStyle(two, ids(two).at(-2) ?? '');
    const three = withStyle(without, null, 'C', 'c') ?? [];
    expect(new Set(ids(three)).size).toBe(three.length);
  });

  it('edit a style in place, a factory one included', () => {
    const edited = withStyle(
      DEFAULT_REPLY_STYLES,
      'simple',
      'Simple',
      'explicamelo como a un niño',
    );
    expect(edited?.map((s) => s.id)).toEqual(ids(DEFAULT_REPLY_STYLES));
    expect(edited?.find((s) => s.id === 'simple')).toEqual({
      id: 'simple',
      label: 'Simple',
      suffix: ' (explicamelo como a un niño)',
    });
  });

  it('refuse a style without a name or without a prompt, and keep Off as it is', () => {
    expect(withStyle(DEFAULT_REPLY_STYLES, null, '  ', 'x')).toBeNull();
    expect(withStyle(DEFAULT_REPLY_STYLES, null, 'x', '  ')).toBeNull();
    expect(withStyle(DEFAULT_REPLY_STYLES, 'off', 'Off', 'x')).toBeNull();
    expect(withStyle(DEFAULT_REPLY_STYLES, 'nope', 'x', 'y')).toBeNull();
  });

  it('shows a suffix that is not in brackets as it is, and knows Off is the fixed one', () => {
    expect(promptOf(' en 3 lineas ')).toBe('en 3 lineas');
    expect(DEFAULT_REPLY_STYLES.filter(isFixedStyle).map((s) => s.id)).toEqual(['off']);
  });

  it('remove any style but Off', () => {
    expect(ids(withoutStyle(DEFAULT_REPLY_STYLES, 'simple'))).not.toContain('simple');
    expect(ids(withoutStyle(DEFAULT_REPLY_STYLES, 'off'))).toContain('off');
  });

  it('read what was stored, and start over from the defaults when it is unreadable', () => {
    const stored = JSON.stringify(withStyle(DEFAULT_REPLY_STYLES, null, 'A', 'a'));
    expect(readStyles(stored).at(-1)?.label).toBe('A');
    expect(readStyles(null)).toEqual(DEFAULT_REPLY_STYLES);
    expect(readStyles('{broken')).toEqual(DEFAULT_REPLY_STYLES);
    expect(readStyles('[{"id":1}]')).toEqual(DEFAULT_REPLY_STYLES);
  });

  it('always keep Off, first, even if the stored list lost it', () => {
    const stored = JSON.stringify([{ id: 'x', label: 'X', suffix: ' (x)' }]);
    expect(ids(readStyles(stored))).toEqual(['off', 'x']);
  });
});
