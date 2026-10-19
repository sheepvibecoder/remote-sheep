// The one-tap orders above the message box, written by the person. Spanish by default, like the
// sessions they reach. A short list: more chips than a row can show would only get in the way.

export const MAX_QUICK_REPLIES = 8;

/** The replies a phone starts with. */
export const DEFAULT_QUICK_REPLIES: readonly string[] = [
  'Continúa',
  'Corre los tests',
  'Haz commit',
  'Explícame el cambio',
];

/**
 * The list with a reply added (no place) or edited (its place), or null when the words are empty,
 * already a chip, the place is unknown, or the list is full.
 */
export function withQuickReply(
  replies: readonly string[],
  place: number | null,
  words: string,
): string[] | null {
  const reply = words.trim();
  if (!reply) return null;
  if (replies.some((other, i) => other === reply && i !== place)) return null;
  if (place === null) return replies.length < MAX_QUICK_REPLIES ? [...replies, reply] : null;
  if (place < 0 || place >= replies.length) return null;
  return replies.map((other, i) => (i === place ? reply : other));
}

/** The list without the reply at this place; a place that is not there changes nothing. */
export function withoutQuickReply(replies: readonly string[], place: number): string[] {
  return replies.filter((_, i) => i !== place);
}

/**
 * The list with the reply at this place swapped with its neighbour one step up (-1) or down (1),
 * or null when there is no reply there or no neighbour on that side.
 */
export function movedQuickReply(
  replies: readonly string[],
  place: number,
  step: -1 | 1,
): string[] | null {
  const reply = replies[place];
  const other = replies[place + step];
  if (reply === undefined || other === undefined) return null;
  const list = [...replies];
  list[place] = other;
  list[place + step] = reply;
  return list;
}

/**
 * The stored list, cut to the maximum; the defaults when nothing usable was stored. Blank entries
 * are dropped: a chip with no words would send an empty order, which goes out as the photo phrase.
 */
export function readQuickReplies(stored: string | null): string[] {
  let parsed: unknown;
  try {
    parsed = stored === null ? null : JSON.parse(stored);
  } catch {
    parsed = null;
  }
  if (!Array.isArray(parsed) || !parsed.every((item): item is string => typeof item === 'string')) {
    return [...DEFAULT_QUICK_REPLIES];
  }
  return parsed.filter((reply) => reply.trim() !== '').slice(0, MAX_QUICK_REPLIES);
}
