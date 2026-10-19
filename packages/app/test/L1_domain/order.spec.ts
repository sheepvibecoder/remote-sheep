import { describe, expect, it } from 'vitest';
import { REPLY_STYLES, asksNothing, composeOrder, replyStyle } from '../../src/L1_domain/order';

describe('composeOrder', () => {
  it('asks for the reply style picked, and for nothing when it is off', () => {
    expect(composeOrder('hola', replyStyle('one-line'), null)).toEqual({
      spoken: 'hola',
      order: 'hola (responde en una sola linea)',
    });
    expect(composeOrder('hola', replyStyle('off'), null).order).toBe('hola');
  });

  it('names the attached photo, and a photo alone is a complete order', () => {
    expect(composeOrder('', replyStyle('off'), 'C:\\up\\x.jpg')).toEqual({
      spoken: 'Mira esta imagen.',
      order: 'Mira esta imagen.\n\nImagen adjunta: C:\\up\\x.jpg',
    });
  });
});

describe('replyStyle', () => {
  it('offers the five styles of the mockup, in its order', () => {
    expect(REPLY_STYLES.map((s) => s.label)).toEqual([
      'Off',
      'One line',
      'Explain simply',
      '10 lines max',
      'En español',
    ]);
  });

  it('knows which style leaves the order as typed', () => {
    expect(REPLY_STYLES.filter(asksNothing).map((s) => s.id)).toEqual(['off']);
  });

  it('falls back to one line for a style it does not know', () => {
    expect(replyStyle('gone').id).toBe('one-line');
  });
});
