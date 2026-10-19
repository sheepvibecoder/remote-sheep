import { describe, expect, it } from 'vitest';
import type { ChatMessage } from '@remote-sheep/protocol';
import { chatItems, dayLabel, modelLabel } from '../../src/L1_domain/chat';

const now = new Date(2026, 9, 18, 15, 0).getTime();
const at = (day: number, hour: number, minute = 0) =>
  new Date(2026, 9, day, hour, minute).getTime();

function said(id: string, role: 'user' | 'assistant', when?: number): ChatMessage {
  return { id, role, kind: 'text', text: id, ...(when === undefined ? {} : { at: when }) };
}

describe('dayLabel', () => {
  it('names today and yesterday, and dates the days before', () => {
    expect(dayLabel(at(18, 9), now)).toBe('Today');
    expect(dayLabel(at(17, 23), now)).toBe('Yesterday');
    expect(dayLabel(at(12, 10), now)).toBe('12 Oct');
  });
});

describe('modelLabel', () => {
  it('names a Claude model the way people say it', () => {
    expect(modelLabel('claude-opus-5-5')).toBe('Opus 5.5');
    expect(modelLabel('claude-haiku-4-5-20251001')).toBe('Haiku 4.5');
  });

  it('shows any other model as the agent names it, and nothing when unknown', () => {
    expect(modelLabel('gpt-5-codex')).toBe('gpt-5-codex');
    expect(modelLabel(null)).toBeNull();
  });
});

describe('chatItems', () => {
  it('puts a day line before the first message of each day, and the hour on every message', () => {
    const items = chatItems(
      [said('a', 'user', at(17, 22, 5)), said('b', 'assistant', at(18, 9, 7))],
      null,
      now,
    );
    expect(items.map((i) => (i.kind === 'day' ? i.label : i.key + ' ' + i.time))).toEqual([
      'Yesterday',
      'a 22:05',
      'Today',
      'b 09:07',
    ]);
  });

  it('leaves the time out, and draws no day line, for a message the transcript did not date', () => {
    const items = chatItems([said('a', 'user', at(18, 9)), said('b', 'assistant')], null, now);
    expect(items.map((i) => (i.kind === 'day' ? i.label : i.key + ' ' + i.time))).toEqual([
      'Today',
      'a 09:00',
      'b ',
    ]);
  });

  it('marks what the person sent: received once in the transcript, nothing on a reply', () => {
    const items = chatItems([said('a', 'user'), said('b', 'assistant')], null, now);
    expect(items.map((i) => (i.kind === 'message' ? i.delivery : null))).toEqual([
      'received',
      null,
    ]);
  });

  it('shows an order on its way as sending, then delivered once Herdr took it', () => {
    const order = said('pending', 'user', at(18, 14, 59));
    const sending = chatItems([said('a', 'user', at(18, 9))], { ...order, accepted: false }, now);
    expect(sending.at(-1)).toMatchObject({
      key: 'pending',
      time: '14:59',
      delivery: 'sending',
      pending: true,
    });
    const delivered = chatItems([], { ...order, accepted: true }, now);
    expect(delivered.at(-1)).toMatchObject({ delivery: 'delivered', pending: true });
  });
});
