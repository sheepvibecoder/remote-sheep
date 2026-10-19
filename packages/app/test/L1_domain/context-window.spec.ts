import { describe, expect, it } from 'vitest';
import {
  CONTEXT_WINDOW_KEY,
  CONTEXT_WINDOWS,
  DEFAULT_CONTEXT_WINDOW,
  contextFill,
  contextLevel,
  contextPercent,
  contextWindow,
  contextWindowChoice,
  tableWindow,
  tokensLabel,
} from '../../src/L1_domain/context-window';

describe('context window', () => {
  it('reads Opus 5.5 and Sonnet 5.5 as 1M in the table', () => {
    expect(tableWindow('claude-opus-5-5')).toBe(1_000_000);
    expect(tableWindow('claude-opus-5-5[1m]')).toBe(1_000_000);
    expect(tableWindow('claude-opus-5-5-20261001')).toBe(1_000_000);
    expect(tableWindow('claude-sonnet-5-5')).toBe(1_000_000);
  });

  it('reads every other Claude model, and any model it does not know, as 200k in the table', () => {
    expect(tableWindow('claude-sonnet-4-5-20250929')).toBe(200_000);
    expect(tableWindow('claude-haiku-4-5')).toBe(200_000);
    expect(tableWindow('claude-opus-5-50')).toBe(200_000);
    expect(tableWindow('gpt-9')).toBe(200_000);
    expect(tableWindow(null)).toBe(200_000);
  });

  it('measures Opus 5.5 against 1M on Auto, as Claude Code does', () => {
    expect(contextFill(142_200, 'claude-opus-5-5', 'auto')).toMatchObject({
      percent: 14,
      label: '142k of 1M tokens',
    });
  });

  it('offers Auto, 200k and 1M in Settings, Auto the default', () => {
    expect(CONTEXT_WINDOWS.map((choice) => choice.label)).toEqual(['Auto', '200k', '1M']);
    expect(DEFAULT_CONTEXT_WINDOW).toBe('auto');
    expect(CONTEXT_WINDOW_KEY).toBe('contextWindow');
  });

  it('takes the table on Auto and the picked size otherwise', () => {
    expect(contextWindow('claude-opus-5-5', 'auto', 1000)).toBe(1_000_000);
    expect(contextWindow('claude-haiku-4-5', 'auto', 1000)).toBe(200_000);
    expect(contextWindow('claude-opus-5-5', '200k', 1000)).toBe(200_000);
    expect(contextWindow('claude-haiku-4-5', '1m', 1000)).toBe(1_000_000);
  });

  it('grows to 1M once the session holds more than the chosen or table size', () => {
    expect(contextWindow('claude-haiku-4-5', 'auto', 200_000)).toBe(200_000);
    expect(contextWindow('claude-haiku-4-5', 'auto', 200_001)).toBe(1_000_000);
    expect(contextWindow('claude-opus-5-5', '200k', 350_000)).toBe(1_000_000);
  });

  it('rounds the share of the window to a whole percent', () => {
    expect(contextPercent(24_000, 200_000)).toBe(12);
    expect(contextPercent(124_000, 1_000_000)).toBe(12);
    expect(contextPercent(168_900, 200_000)).toBe(84);
    expect(contextPercent(0, 200_000)).toBe(0);
  });

  it('warns from 70% and runs hot from 90%', () => {
    expect(contextLevel(69)).toBe('ok');
    expect(contextLevel(70)).toBe('warn');
    expect(contextLevel(89)).toBe('warn');
    expect(contextLevel(90)).toBe('hot');
    expect(contextLevel(104)).toBe('hot');
  });

  it('labels the tokens in k and M, as the menu shows them', () => {
    expect(tokensLabel(124_000, 1_000_000)).toBe('124k of 1M tokens');
    expect(tokensLabel(24_400, 200_000)).toBe('24k of 200k tokens');
    expect(tokensLabel(800, 200_000)).toBe('800 of 200k tokens');
    expect(tokensLabel(1_250_000, 1_000_000)).toBe('1.3M of 1M tokens');
    expect(tokensLabel(999_700, 1_000_000)).toBe('1M of 1M tokens');
  });

  it('gathers all of it for a session, or nothing when the used tokens are unknown', () => {
    expect(contextFill(124_000, 'claude-opus-5-5', '1m')).toEqual({
      percent: 12,
      level: 'ok',
      label: '124k of 1M tokens',
      fraction: 0.124,
    });
    expect(contextFill(250_000, 'claude-haiku-4-5', 'auto')).toMatchObject({
      percent: 25,
      label: '250k of 1M tokens',
    });
    expect(contextFill(1_500_000, null, '1m')).toMatchObject({ percent: 150, fraction: 1 });
    expect(contextFill(null, 'claude-opus-5-5', 'auto')).toBeNull();
  });

  it('falls back to Auto for nothing, an empty value or an unknown choice', () => {
    expect(contextWindowChoice('1m')).toBe('1m');
    expect(contextWindowChoice('200k')).toBe('200k');
    expect(contextWindowChoice(null)).toBe('auto');
    expect(contextWindowChoice('')).toBe('auto');
    expect(contextWindowChoice('2m')).toBe('auto');
  });
});
