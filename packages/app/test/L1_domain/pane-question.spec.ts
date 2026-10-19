import { describe, expect, it } from 'vitest';
import { paneChoices } from '../../src/L1_domain/pane-question';

const PERMISSION = [
  '● Bash(pnpm test --filter payments)',
  '',
  '  Do you want to proceed?',
  '  ❯ 1. Yes',
  "    2. Yes, and don't ask again",
  '    3. No, and tell Claude what to do',
  '',
].join('\n');

describe('paneChoices', () => {
  it('reads the numbered answers of a question the pane is asking', () => {
    expect(paneChoices(PERMISSION)).toEqual([
      { key: '1', label: 'Yes', selected: true },
      { key: '2', label: "Yes, and don't ask again", selected: false },
      { key: '3', label: 'No, and tell Claude what to do', selected: false },
    ]);
  });

  it('still sees them under a footer hint', () => {
    const text = PERMISSION + '\n Esc to cancel · Tab to amend\n';
    expect(paneChoices(text).map((c) => c.key)).toEqual(['1', '2', '3']);
  });

  it('ignores a numbered list the output scrolled far above the prompt', () => {
    const text = ['1. one', '2. two', 'a', 'b', 'c', 'd', 'e', '$ '].join('\n');
    expect(paneChoices(text)).toEqual([]);
  });

  it('needs at least two answers, counting up from 1', () => {
    expect(paneChoices('  ❯ 1. Yes\n')).toEqual([]);
    expect(paneChoices('  2. a\n  3. b\n')).toEqual([]);
    expect(paneChoices('  1. a\n  3. b\n')).toEqual([]);
  });

  it('is empty for plain terminal text', () => {
    expect(paneChoices('')).toEqual([]);
    expect(paneChoices('$ ls\nfile.txt\n')).toEqual([]);
  });

  it('takes other cursor marks, and stops at three footer lines', () => {
    expect(paneChoices('> 1. Yes\n  2. No\n')[0]?.selected).toBe(true);
    expect(paneChoices('› 1. Yes\n  2. No\n')[0]?.selected).toBe(true);
    const footer = (lines: number) => '1. Yes\n2. No\n' + 'hint\n'.repeat(lines);
    expect(paneChoices(footer(3))).toHaveLength(2);
    expect(paneChoices(footer(4))).toEqual([]);
  });

  it('reads only the last question when two are on screen', () => {
    const text = '1. old\n2. old\n\n' + PERMISSION;
    expect(paneChoices(text)).toHaveLength(3);
  });
});
