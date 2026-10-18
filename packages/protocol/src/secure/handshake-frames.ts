// Wire codecs of the two handshake frames, which travel in clear before any
// key exists. They are ordinary frames with keys as base64url strings in the
// JSON header; anything malformed decodes to null and the agent closes.

import { decodeFrame, encodeFrame } from '../frame';
import { decodeBase64Url, encodeBase64Url } from './base64url';
import type { Hello, Welcome } from './handshake';
import { KEY_BYTES } from './keys';

type Json = Record<string, unknown>;

function headerOf(data: Uint8Array, type: string): Json | null {
  const frame = decodeFrame(data);
  if (!frame || frame.bytes) return null;
  const header = frame.header;
  if (typeof header !== 'object' || header === null || Array.isArray(header)) return null;
  return (header as Json)['type'] === type ? (header as Json) : null;
}

function key(value: unknown): Uint8Array | null {
  if (typeof value !== 'string') return null;
  const bytes = decodeBase64Url(value);
  return bytes?.length === KEY_BYTES ? bytes : null;
}

export function encodeHello(hello: Hello): Uint8Array {
  return encodeFrame({
    type: 'hello',
    protocol: hello.protocol,
    ephemeral: encodeBase64Url(hello.ephemeral),
    identity: encodeBase64Url(hello.identity),
    pair: hello.pair,
  });
}

/** Accepts any protocol number in 0..255, so the agent can answer a mismatch with its own code. */
export function decodeHello(data: Uint8Array): Hello | null {
  const header = headerOf(data, 'hello');
  if (!header) return null;
  const protocol = header['protocol'];
  if (typeof protocol !== 'number' || !Number.isInteger(protocol)) return null;
  if (protocol < 0 || protocol > 255) return null;
  const ephemeral = key(header['ephemeral']);
  const identity = key(header['identity']);
  const pair = header['pair'];
  if (!ephemeral || !identity || typeof pair !== 'boolean') return null;
  return { protocol, ephemeral, identity, pair };
}

export function encodeWelcome(welcome: Welcome): Uint8Array {
  return encodeFrame({ type: 'welcome', ephemeral: encodeBase64Url(welcome.ephemeral) });
}

export function decodeWelcome(data: Uint8Array): Welcome | null {
  const ephemeral = key(headerOf(data, 'welcome')?.['ephemeral']);
  return ephemeral ? { ephemeral } : null;
}
