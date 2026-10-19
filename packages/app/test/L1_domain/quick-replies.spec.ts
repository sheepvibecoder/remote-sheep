import { describe, expect, it } from 'vitest';
import {
  DEFAULT_QUICK_REPLIES,
  MAX_QUICK_REPLIES,
  readQuickReplies,
  withoutQuickReply,
  withQuickReply,
} from '../../src/L1_domain/quick-replies';

describe('quick replies', () => {
  it('start with the four of the mockup', () => {
    expect(DEFAULT_QUICK_REPLIES).toEqual([
      'Continúa',
      'Corre los tests',
      'Haz commit',
      'Explícame el cambio',
    ]);
    expect(MAX_QUICK_REPLIES).toBe(8);
  });

  it('add a reply at the end, trimmed', () => {
    expect(withQuickReply(['a'], null, '  Haz push ')).toEqual(['a', 'Haz push']);
  });

  it('edit a reply in place', () => {
    expect(withQuickReply(['a', 'b'], 1, 'c')).toEqual(['a', 'c']);
  });

  it('refuse an empty reply, a repeated one, an unknown place, and a ninth one', () => {
    expect(withQuickReply(['a'], null, '  ')).toBeNull();
    expect(withQuickReply(['a'], null, 'a')).toBeNull();
    expect(withQuickReply(['a', 'b'], 0, 'b')).toBeNull();
    expect(withQuickReply(['a'], 3, 'x')).toBeNull();
    const full = Array.from({ length: MAX_QUICK_REPLIES }, (_, i) => 'r' + i);
    expect(withQuickReply(full, null, 'more')).toBeNull();
    expect(withQuickReply(full, 0, 'edited')?.[0]).toBe('edited');
  });

  it('accept an edit that keeps the same words', () => {
    expect(withQuickReply(['a', 'b'], 0, ' a ')).toEqual(['a', 'b']);
  });

  it('remove a reply by its place, and ignore a place that is not there', () => {
    expect(withoutQuickReply(['a', 'b', 'c'], 1)).toEqual(['a', 'c']);
    expect(withoutQuickReply(['a'], 4)).toEqual(['a']);
  });

  it('read what was stored: an empty list stays empty, anything unreadable starts over', () => {
    expect(readQuickReplies(JSON.stringify(['x', 'y']))).toEqual(['x', 'y']);
    expect(readQuickReplies('[]')).toEqual([]);
    expect(readQuickReplies(null)).toEqual(DEFAULT_QUICK_REPLIES);
    expect(readQuickReplies('{broken')).toEqual(DEFAULT_QUICK_REPLIES);
    expect(readQuickReplies('[1,2]')).toEqual(DEFAULT_QUICK_REPLIES);
  });

  it('keep at most the maximum of what was stored', () => {
    const many = Array.from({ length: 12 }, (_, i) => 'r' + i);
    expect(readQuickReplies(JSON.stringify(many))).toHaveLength(MAX_QUICK_REPLIES);
  });
});
