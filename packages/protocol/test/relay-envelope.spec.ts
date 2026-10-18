import { describe, expect, it } from 'vitest';
import {
  CLOSE_AGENT_OFFLINE,
  CLOSE_PAIRING_EXPIRED,
  CLOSE_PROTOCOL,
  CLOSE_UNAUTHORIZED,
  decodeRelayEnvelope,
  encodeRelayEnvelope,
  type RelayEnvelope,
} from '../src/index';

const bytes = (...values: number[]) => new Uint8Array(values);

describe('relay envelope', () => {
  it('round-trips open, data and close for any phone stream', () => {
    const envelopes: RelayEnvelope[] = [
      { kind: 'open', stream: 0 },
      { kind: 'data', stream: 7, data: bytes(0, 255, 3) },
      { kind: 'data', stream: 0xffffffff, data: bytes() },
      { kind: 'close', stream: 7, code: CLOSE_PAIRING_EXPIRED, reason: 'pairing revoked' },
      { kind: 'close', stream: 1, code: 1000, reason: '' },
    ];
    for (const envelope of envelopes) {
      expect(decodeRelayEnvelope(encodeRelayEnvelope(envelope))).toEqual(envelope);
    }
  });

  it('keeps a sealed frame byte for byte, so the relay never touches its content', () => {
    const sealed = bytes(...Array.from({ length: 1000 }, (_, i) => (i * 31) % 256));
    const encoded = encodeRelayEnvelope({ kind: 'data', stream: 2, data: sealed });
    expect(encoded.length).toBe(5 + sealed.length);
    const decoded = decodeRelayEnvelope(encoded);
    expect(decoded).toEqual({ kind: 'data', stream: 2, data: sealed });
  });

  it('rejects truncated, unknown or malformed envelopes', () => {
    expect(decodeRelayEnvelope(bytes())).toBeNull();
    expect(decodeRelayEnvelope(bytes(1, 0, 0, 0))).toBeNull();
    expect(decodeRelayEnvelope(bytes(9, 0, 0, 0, 1))).toBeNull();
    // open carries nothing after the stream id
    expect(decodeRelayEnvelope(bytes(1, 0, 0, 0, 1, 5))).toBeNull();
    // close needs a two-byte code
    expect(decodeRelayEnvelope(bytes(3, 0, 0, 0, 1, 15))).toBeNull();
    // a close code outside 1000 and 3000-4999 cannot be sent on a WebSocket
    expect(decodeRelayEnvelope(bytes(3, 0, 0, 0, 1, 0x03, 0xe9))).toBeNull();
    // the reason must be UTF-8
    expect(decodeRelayEnvelope(bytes(3, 0, 0, 0, 1, 0x0f, 0xa1, 0xff))).toBeNull();
  });

  it('refuses to encode what the other side would reject', () => {
    expect(() => encodeRelayEnvelope({ kind: 'open', stream: -1 })).toThrow();
    expect(() => encodeRelayEnvelope({ kind: 'open', stream: 2 ** 32 })).toThrow();
    expect(() =>
      encodeRelayEnvelope({ kind: 'close', stream: 1, code: 1006, reason: '' }),
    ).toThrow();
    expect(() =>
      encodeRelayEnvelope({ kind: 'close', stream: 1, code: 4000, reason: 'x'.repeat(124) }),
    ).toThrow();
  });

  it('has relay close codes apart from the end-to-end ones', () => {
    const codes = [CLOSE_UNAUTHORIZED, CLOSE_PROTOCOL, CLOSE_PAIRING_EXPIRED];
    expect(codes).not.toContain(CLOSE_AGENT_OFFLINE);
  });
});
