// One frame per message: [u32 header length][JSON header][raw bytes].
//
// A photo travels as its own bytes instead of base64 inside the JSON, which
// would make it a third larger and cost an encode on the phone. The same
// layout is what stage 2 encrypts, so every message is a frame, with or
// without bytes.

const HEADER_LENGTH_BYTES = 4;

const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8', { fatal: true });

export interface Frame {
  header: unknown;
  /** null when the message carries no bytes. */
  bytes: Uint8Array | null;
}

export function encodeFrame(header: unknown, bytes?: Uint8Array | null): Uint8Array {
  const json = encoder.encode(JSON.stringify(header));
  const frame = new Uint8Array(HEADER_LENGTH_BYTES + json.length + (bytes?.length ?? 0));
  new DataView(frame.buffer).setUint32(0, json.length);
  frame.set(json, HEADER_LENGTH_BYTES);
  if (bytes) frame.set(bytes, HEADER_LENGTH_BYTES + json.length);
  return frame;
}

/** Returns null for anything that is not a well-formed frame. */
export function decodeFrame(data: Uint8Array): Frame | null {
  if (data.length < HEADER_LENGTH_BYTES) return null;
  const length = new DataView(data.buffer, data.byteOffset, data.byteLength).getUint32(0);
  const end = HEADER_LENGTH_BYTES + length;
  if (end > data.length) return null;
  let header: unknown;
  try {
    header = JSON.parse(decoder.decode(data.subarray(HEADER_LENGTH_BYTES, end)));
  } catch {
    return null;
  }
  return { header, bytes: end < data.length ? data.slice(end) : null };
}
