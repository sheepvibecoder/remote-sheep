/** Cryptographically secure random bytes, for the one-time secrets of QR invites. */
export interface RandomSource {
  bytes(length: number): Uint8Array;
}
