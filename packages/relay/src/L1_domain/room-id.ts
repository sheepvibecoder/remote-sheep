/**
 * A room is named by `publicKeyId` of its agent's key: 16 lowercase hex characters.
 * Checked before any upgrade, so a bad id costs the relay one HTTP 400 and nothing else.
 */
export const isRoomId = (value: string | null): value is string =>
  value !== null && /^[0-9a-f]{16}$/.test(value);
