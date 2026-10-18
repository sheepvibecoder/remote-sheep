// Base64url without padding (RFC 4648 §5), the form keys take in JSON headers
// and in the QR's URL fragment.
//
// Written by hand because the kernel runs on the phone and the agent alike:
// `Buffer` is Node-only, and `atob` tolerates whitespace and padding, which a
// strict decoder must refuse so one key has exactly one spelling.

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

const VALUES = new Map(Array.from({ length: 64 }, (_, index) => [ALPHABET.charAt(index), index]));

export function encodeBase64Url(data: Uint8Array): string {
  let text = '';
  for (let i = 0; i < data.length; i += 3) {
    const a = data[i] ?? 0;
    const b = data[i + 1] ?? 0;
    const c = data[i + 2] ?? 0;
    const chunk = (a << 16) | (b << 8) | c;
    const chars = Math.min(4, Math.ceil(((data.length - i) * 4) / 3));
    for (let j = 0; j < chars; j++) text += ALPHABET[(chunk >> (18 - 6 * j)) & 63];
  }
  return text;
}

/** Returns null for anything that is not canonical unpadded base64url. */
export function decodeBase64Url(text: string): Uint8Array | null {
  if (text.length % 4 === 1) return null;
  const data = new Uint8Array(Math.floor((text.length * 3) / 4));
  let buffer = 0;
  let bits = 0;
  let index = 0;
  for (const char of text) {
    const value = VALUES.get(char);
    if (value === undefined) return null;
    buffer = ((buffer << 6) | value) & 0xffffff;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      data[index++] = (buffer >> bits) & 0xff;
    }
  }
  // Leftover bits must be zero, or two strings would decode to the same bytes.
  if ((buffer & ((1 << bits) - 1)) !== 0) return null;
  return data;
}
