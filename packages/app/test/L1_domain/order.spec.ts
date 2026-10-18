import { describe, expect, it } from 'vitest';
import { composeOrder } from '../../src/L1_domain/order';

describe('composeOrder', () => {
  it('asks for a short answer when brief mode is on', () => {
    expect(composeOrder('hola', true, null)).toEqual({
      spoken: 'hola',
      order: 'hola (responde en 2 lineas como maximo)',
    });
    expect(composeOrder('hola', false, null).order).toBe('hola');
  });

  it('names the attached photo, and a photo alone is a complete order', () => {
    expect(composeOrder('', false, 'C:\\up\\x.jpg')).toEqual({
      spoken: 'Mira esta imagen.',
      order: 'Mira esta imagen.\n\nImagen adjunta: C:\\up\\x.jpg',
    });
  });
});
