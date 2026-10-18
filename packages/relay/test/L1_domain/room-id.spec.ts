import { describe, expect, it } from 'vitest';
import { isRoomId } from '../../src/L1_domain/room-id';

describe('isRoomId', () => {
  it('accepts 16 lowercase hex characters', () => {
    expect(isRoomId('0123456789abcdef')).toBe(true);
  });

  it.each([
    null,
    '',
    'ABCDEF0123456789',
    '0123456789abcde',
    '0123456789abcdef0',
    'zzzzzzzzzzzzzzzz',
  ])('rejects %j', (value) => {
    expect(isRoomId(value)).toBe(false);
  });
});
