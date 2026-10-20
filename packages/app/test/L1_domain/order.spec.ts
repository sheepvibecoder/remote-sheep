import { describe, expect, it } from 'vitest';
import { asksNothing, composeOrder, quickOrder } from '../../src/L1_domain/order';
import { DEFAULT_REPLY_STYLES, replyStyle as pick } from '../../src/L1_domain/reply-styles';

const replyStyle = (id: string) => pick(DEFAULT_REPLY_STYLES, id);

describe('composeOrder', () => {
  it('asks for the reply style picked, and for nothing when it is off', () => {
    expect(composeOrder('hola', replyStyle('one-line'), null)).toEqual({
      spoken: 'hola',
      order: 'hola (answer in one line)',
    });
    expect(composeOrder('hola', replyStyle('off'), null).order).toBe('hola');
  });

  it('names the attached photo, and a photo alone is a complete order', () => {
    expect(composeOrder('', replyStyle('off'), 'C:\\up\\x.jpg')).toEqual({
      spoken: 'Look at this image.',
      order: 'Look at this image.\n\nAttached image: C:\\up\\x.jpg',
    });
  });
});

describe('replyStyle', () => {
  it('knows which style leaves the order as typed', () => {
    expect(DEFAULT_REPLY_STYLES.filter(asksNothing).map((s) => s.id)).toEqual(['off']);
  });

  it('sends a quick reply with the reply style and never with the attached photo', () => {
    expect(quickOrder('Commit it', replyStyle('one-line'))).toEqual({
      spoken: 'Commit it',
      order: 'Commit it (answer in one line)',
    });
  });
});
