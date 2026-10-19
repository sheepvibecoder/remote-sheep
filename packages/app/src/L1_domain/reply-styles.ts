// The reply styles the person picks from and writes: each one is a short prompt appended to
// every order while it is picked. Off stays, so there is always a way to ask for nothing extra.

import type { ReplyStyle } from './order';

const OFF = 'off';
const OFF_STYLE: ReplyStyle = { id: OFF, label: 'Off', suffix: '' };
const ONE_LINE = 'one-line';

/** The styles a phone starts with, in the mockup's order. The suffixes are Spanish like the sessions. */
export const DEFAULT_REPLY_STYLES: readonly ReplyStyle[] = [
  OFF_STYLE,
  { id: ONE_LINE, label: 'One line', suffix: ' (responde en una sola linea)' },
  { id: 'simple', label: 'Explain simply', suffix: ' (explicalo simple)' },
  { id: 'ten-lines', label: '10 lines max', suffix: ' (responde en 10 lineas como maximo)' },
  { id: 'spanish', label: 'En español', suffix: ' (responde en español)' },
];

/**
 * The style with this id. A phone that never picked one (null) starts on one line; a pick that is
 * gone (removed, reset away, or a stale id) falls to Off, so the order goes out as written instead
 * of with a suffix the person did not choose.
 */
export function replyStyle(styles: readonly ReplyStyle[], id: string | null): ReplyStyle {
  const found = styles.find((style) => style.id === (id ?? ONE_LINE));
  return found ?? styles.find((style) => style.id === OFF) ?? OFF_STYLE;
}

/** Off asks for nothing, so it can be neither edited nor removed. */
export function isFixedStyle(style: ReplyStyle): boolean {
  return style.id === OFF;
}

/** What the person writes for a style: the suffix without the brackets around it. */
export function promptOf(suffix: string): string {
  const match = /^ \((.*)\)$/s.exec(suffix);
  return match ? (match[1] ?? '') : suffix.trim();
}

function nextId(styles: readonly ReplyStyle[]): string {
  const used = styles.map((style) => Number(/^custom-(\d+)$/.exec(style.id)?.[1] ?? 0));
  return 'custom-' + (Math.max(0, ...used) + 1);
}

/**
 * The list with a style added (no id) or edited (its id), or null when the name or the prompt is
 * empty, the id is unknown, or it is Off, which never changes.
 */
export function withStyle(
  styles: readonly ReplyStyle[],
  id: string | null,
  label: string,
  prompt: string,
): ReplyStyle[] | null {
  const name = label.trim();
  const words = prompt.trim();
  if (!name || !words || id === OFF) return null;
  const suffix = ' (' + words + ')';
  if (id === null) return [...styles, { id: nextId(styles), label: name, suffix }];
  if (!styles.some((style) => style.id === id)) return null;
  return styles.map((style) => (style.id === id ? { id, label: name, suffix } : style));
}

/** The list without this style; Off cannot be removed. */
export function withoutStyle(styles: readonly ReplyStyle[], id: string): ReplyStyle[] {
  return styles.filter((style) => style.id !== id || id === OFF);
}

function isStyle(value: unknown): value is ReplyStyle {
  if (typeof value !== 'object' || value === null) return false;
  const style = value as Record<string, unknown>;
  return (
    typeof style['id'] === 'string' &&
    typeof style['label'] === 'string' &&
    typeof style['suffix'] === 'string'
  );
}

/** The stored list, with Off first; the defaults when nothing usable was stored. */
export function readStyles(stored: string | null): ReplyStyle[] {
  let parsed: unknown;
  try {
    parsed = stored === null ? null : JSON.parse(stored);
  } catch {
    parsed = null;
  }
  if (!Array.isArray(parsed) || !parsed.every(isStyle)) return [...DEFAULT_REPLY_STYLES];
  const others = parsed.filter((style) => style.id !== OFF);
  return [parsed.find((style) => style.id === OFF) ?? OFF_STYLE, ...others];
}
