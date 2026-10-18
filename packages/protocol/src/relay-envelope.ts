// What travels on the agent's one socket to the relay.
//
// The relay carries many phones over a single agent socket, so each sealed
// frame is wrapped with the phone stream it belongs to:
// [u8 kind][u32 stream][payload]. The payload of `data` is the sealed frame
// itself, byte for byte; the relay never opens it.

export type RelayEnvelope =
  /** Relay to agent: a phone connected to the room. */
  | { kind: 'open'; stream: number }
  | { kind: 'data'; stream: number; data: Uint8Array }
  /** Either way: that phone's socket closes, or must close, with this code. */
  | { kind: 'close'; stream: number; code: number; reason: string };

const KIND_BYTES = { open: 1, data: 2, close: 3 } as const;
const PREFIX_BYTES = 5;
const CODE_BYTES = 2;
// The WebSocket close frame leaves 123 bytes for the reason.
const MAX_REASON_BYTES = 123;
const MAX_STREAM = 0xffffffff;

const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8', { fatal: true });

/** Codes a WebSocket may send in a close frame: 1000, or 3000-4999. */
export const isSendableCloseCode = (code: number) =>
  Number.isInteger(code) && (code === 1000 || (code >= 3000 && code <= 4999));

export function encodeRelayEnvelope(envelope: RelayEnvelope): Uint8Array {
  const { stream } = envelope;
  if (!Number.isInteger(stream) || stream < 0 || stream > MAX_STREAM) {
    throw new Error('relay stream out of range: ' + String(stream));
  }
  let payload: Uint8Array;
  if (envelope.kind === 'open') {
    payload = new Uint8Array(0);
  } else if (envelope.kind === 'data') {
    payload = envelope.data;
  } else {
    if (!isSendableCloseCode(envelope.code)) {
      throw new Error('cannot send close code ' + String(envelope.code));
    }
    const reason = encoder.encode(envelope.reason);
    if (reason.length > MAX_REASON_BYTES) throw new Error('close reason too long');
    payload = new Uint8Array(CODE_BYTES + reason.length);
    new DataView(payload.buffer).setUint16(0, envelope.code);
    payload.set(reason, CODE_BYTES);
  }
  const out = new Uint8Array(PREFIX_BYTES + payload.length);
  const view = new DataView(out.buffer);
  view.setUint8(0, KIND_BYTES[envelope.kind]);
  view.setUint32(1, stream);
  out.set(payload, PREFIX_BYTES);
  return out;
}

/** Returns null for anything that is not a well-formed envelope. */
export function decodeRelayEnvelope(data: Uint8Array): RelayEnvelope | null {
  if (data.length < PREFIX_BYTES) return null;
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const stream = view.getUint32(1);
  const payload = data.subarray(PREFIX_BYTES);
  switch (view.getUint8(0)) {
    case KIND_BYTES.open:
      return payload.length === 0 ? { kind: 'open', stream } : null;
    case KIND_BYTES.data:
      return { kind: 'data', stream, data: payload.slice() };
    case KIND_BYTES.close: {
      if (payload.length < CODE_BYTES || payload.length > CODE_BYTES + MAX_REASON_BYTES) {
        return null;
      }
      const code = view.getUint16(PREFIX_BYTES);
      if (!isSendableCloseCode(code)) return null;
      try {
        return {
          kind: 'close',
          stream,
          code,
          reason: decoder.decode(payload.subarray(CODE_BYTES)),
        };
      } catch {
        return null;
      }
    }
    default:
      return null;
  }
}
