// How full a session's context window is. The transcript says how many tokens the session holds
// but not how large its window is, so the size comes from a table by model, a Settings override,
// and a correction upward when the session already holds more than the size it was given.

export type ContextWindowChoice = 'auto' | '200k' | '1m';

export interface ContextWindowOption {
  id: ContextWindowChoice;
  label: string;
}

export const CONTEXT_WINDOWS: readonly ContextWindowOption[] = [
  { id: 'auto', label: 'Auto' },
  { id: '200k', label: '200k' },
  { id: '1m', label: '1M' },
];

export const DEFAULT_CONTEXT_WINDOW: ContextWindowChoice = 'auto';

/** Where the phone keeps the choice, read by the store. */
export const CONTEXT_WINDOW_KEY = 'contextWindow';

const K200 = 200_000;
const M1 = 1_000_000;

/**
 * The window each model starts with, first match wins. Claude Code runs Opus 5.5 and Sonnet 5.5
 * with a 1M window (its `/context` measures them against 1M), so the table does too, with or
 * without a date or `[1m]` suffix. Every other Claude model starts at 200k; a 1M window there is a
 * plan option the transcript does not show, which the override and the correction cover.
 */
const TABLE: readonly { pattern: RegExp; size: number }[] = [
  { pattern: /^claude-(opus|sonnet)-5-5(?![0-9])/, size: M1 },
  { pattern: /^claude-(opus|sonnet|haiku)-/, size: K200 },
];

const FIXED: Record<Exclude<ContextWindowChoice, 'auto'>, number> = { '200k': K200, '1m': M1 };

/** How full a window is: calm, filling up, or nearly out. */
export type ContextLevel = 'ok' | 'warn' | 'hot';

const WARN_FROM = 70;
const HOT_FROM = 90;

/** What the phone shows about one session's window. */
export interface ContextFill {
  percent: number;
  level: ContextLevel;
  /** For the chat menu: `124k of 1M tokens`. */
  label: string;
  /** How much of the bar is filled, 0 to 1. */
  fraction: number;
}

/** A stored choice that is still on offer, else Auto. */
export function contextWindowChoice(stored: string | null): ContextWindowChoice {
  return CONTEXT_WINDOWS.find((option) => option.id === stored)?.id ?? DEFAULT_CONTEXT_WINDOW;
}

/** The window the table gives a model; 200k for one it does not know. */
export function tableWindow(model: string | null): number {
  if (!model) return K200;
  return TABLE.find((row) => row.pattern.test(model))?.size ?? K200;
}

/** The window to measure against: the table on Auto, the picked size otherwise, 1M once overfull. */
export function contextWindow(
  model: string | null,
  choice: ContextWindowChoice,
  used: number,
): number {
  const size = choice === 'auto' ? tableWindow(model) : FIXED[choice];
  return used > size ? M1 : size;
}

export function contextPercent(used: number, window: number): number {
  return Math.round((used / window) * 100);
}

export function contextLevel(percent: number): ContextLevel {
  if (percent >= HOT_FROM) return 'hot';
  return percent >= WARN_FROM ? 'warn' : 'ok';
}

function tokens(count: number): string {
  if (count < 1000) return String(count);
  const thousands = Math.round(count / 1000);
  if (thousands < 1000) return String(thousands) + 'k';
  return String(Math.round(count / 100_000) / 10) + 'M';
}

export function tokensLabel(used: number, window: number): string {
  return tokens(used) + ' of ' + tokens(window) + ' tokens';
}

/** Everything the phone shows about a session's window; null when its used tokens are unknown. */
export function contextFill(
  used: number | null,
  model: string | null,
  choice: ContextWindowChoice,
): ContextFill | null {
  if (used === null) return null;
  const window = contextWindow(model, choice, used);
  const percent = contextPercent(used, window);
  return {
    percent,
    level: contextLevel(percent),
    label: tokensLabel(used, window),
    fraction: Math.min(used / window, 1),
  };
}
