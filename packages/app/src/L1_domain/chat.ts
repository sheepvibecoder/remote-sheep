// The rules of the chat view: the day lines between messages, the hour on each one, whether an
// order reached the agent, and how the model replying in it is named.

import type { ChatMessage } from '@remote-sheep/protocol';
import { dateOf, dayOf, hourOf } from './clock';

/**
 * Where an order the person sent is: still on its way, taken by Herdr, or written in the
 * transcript. There is no "read": an agent does not read the way a person does.
 */
export type Delivery = 'sending' | 'delivered' | 'received';

/** An order shown before the transcript carries it, and whether Herdr has taken it yet. */
export type Outgoing = ChatMessage & { accepted: boolean };

export type ChatItem =
  | { kind: 'day'; key: string; label: string }
  | {
      kind: 'message';
      key: string;
      message: ChatMessage;
      /** `14:32`; empty when the transcript did not date the message. */
      time: string;
      /** Only on what the person sent. */
      delivery: Delivery | null;
      pending: boolean;
    };

const DAY_MS = 24 * 60 * 60 * 1000;

/** `Today`, `Yesterday`, then `12 Oct`. */
export function dayLabel(at: number, now: number): string {
  const day = dayOf(at);
  if (day === dayOf(now)) return 'Today';
  // Noon of today minus a day lands on yesterday whatever daylight saving does.
  const noon = new Date(now);
  noon.setHours(12, 0, 0, 0);
  if (day === dayOf(noon.getTime() - DAY_MS)) return 'Yesterday';
  return dateOf(at);
}

const CLAUDE = /^claude-(opus|sonnet|haiku)-(\d+)-(\d+)(?:-\d{8})?$/;

/** `claude-opus-5-5` reads as `Opus 5.5`; any other model as the agent names it. */
export function modelLabel(model: string | null): string | null {
  if (!model) return null;
  const match = CLAUDE.exec(model);
  if (!match) return model;
  const [, family = '', major = '', minor = ''] = match;
  return family.charAt(0).toUpperCase() + family.slice(1) + ' ' + major + '.' + minor;
}

/** The chat as the view draws it, top to bottom. */
export function chatItems(
  messages: readonly ChatMessage[],
  outgoing: Outgoing | null,
  now: number,
): ChatItem[] {
  const items: ChatItem[] = [];
  let lastDay: string | null = null;
  const add = (message: ChatMessage, delivery: Delivery | null, pending: boolean) => {
    if (message.at !== undefined) {
      const day = dayOf(message.at);
      // An undated message keeps the day of the one before it rather than starting a new one.
      if (day !== lastDay)
        items.push({ kind: 'day', key: 'day:' + day, label: dayLabel(message.at, now) });
      lastDay = day;
    }
    const time = message.at === undefined ? '' : hourOf(message.at);
    items.push({ kind: 'message', key: message.id, message, time, delivery, pending });
  };
  for (const message of messages) add(message, message.role === 'user' ? 'received' : null, false);
  if (outgoing) add(outgoing, outgoing.accepted ? 'delivered' : 'sending', true);
  return items;
}
