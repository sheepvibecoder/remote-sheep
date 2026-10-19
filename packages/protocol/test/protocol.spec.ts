import { describe, expect, it } from 'vitest';
import {
  CLOSE_PAIRING_EXPIRED,
  CLOSE_PROTOCOL,
  CLOSE_UNAUTHORIZED,
  decodeClientMessage,
  decodeFrame,
  decodeServerMessage,
  encodeClientMessage,
  encodeFrame,
  encodeBase64Url,
  encodeServerMessage,
  PROTOCOL,
  readUnknownRequest,
  type ClientMessage,
  type LinkedDevice,
  type ServerMessage,
} from '../src/index';

const bytes = (...values: number[]) => new Uint8Array(values);

/** A frame built by hand, the way a hostile or outdated peer could build it. */
const raw = (header: unknown, payload?: Uint8Array) => encodeFrame(header, payload);

describe('frames', () => {
  it('carries a JSON header and raw bytes side by side', () => {
    const frame = encodeFrame({ hello: 'world' }, bytes(0, 255, 7));
    expect(decodeFrame(frame)).toEqual({ header: { hello: 'world' }, bytes: bytes(0, 255, 7) });
  });

  it('has no bytes when none were attached', () => {
    expect(decodeFrame(encodeFrame({ a: 1 }))).toEqual({ header: { a: 1 }, bytes: null });
  });

  it('rejects frames that are truncated or not JSON', () => {
    expect(decodeFrame(bytes(0, 0))).toBeNull();
    expect(decodeFrame(bytes(0, 0, 0, 9, 123))).toBeNull();
    expect(decodeFrame(bytes(0, 0, 0, 3, 110, 111, 112))).toBeNull();
  });
});

const proof = encodeBase64Url(new Uint8Array(32).fill(5));

const pushSubscribe = {
  kind: 'push-subscribe' as const,
  endpoint: 'https://push.example.com/send/abc',
  p256dh: encodeBase64Url(new Uint8Array(65).fill(4)),
  auth: encodeBase64Url(new Uint8Array(16).fill(7)),
};

describe('client messages', () => {
  it('round-trips the confirm, with and without a proof, and every request kind', () => {
    const messages: ClientMessage[] = [
      { type: 'confirm' },
      { type: 'confirm', proof },
      { type: 'request', id: 1, request: { kind: 'watch', target: 'p1', terminal: false } },
      { type: 'request', id: 2, request: { kind: 'watch', target: null, terminal: false } },
      { type: 'request', id: 3, request: { kind: 'prompt', target: 'p1', text: 'hola' } },
      { type: 'request', id: 4, request: { kind: 'keys', target: 'p1', keys: ['enter'] } },
      { type: 'request', id: 5, request: { kind: 'image', target: 'p1', id: 'u:0' } },
      {
        type: 'request',
        id: 6,
        request: { kind: 'upload', media: 'image/jpeg', data: bytes(1, 2, 3) },
      },
      { type: 'request', id: 7, request: { kind: 'devices' } },
      { type: 'request', id: 8, request: { kind: 'unlink', id: '0123456789abcdef' } },
      { type: 'request', id: 9, request: { kind: 'push-key' } },
      { type: 'request', id: 10, request: pushSubscribe },
      { type: 'request', id: 11, request: { kind: 'push-unsubscribe' } },
      { type: 'request', id: 12, request: { kind: 'spaces' } },
      { type: 'request', id: 13, request: { kind: 'new-session', space: 'w5', shell: false } },
      { type: 'request', id: 14, request: { kind: 'new-session', space: 'w5', shell: true } },
      {
        type: 'request',
        id: 15,
        request: { kind: 'new-session', space: 'w5', shell: false, agent: 'codex' },
      },
    ];
    for (const message of messages) {
      expect(decodeClientMessage(encodeClientMessage(message))).toEqual(message);
    }
  });

  it('sends an upload as raw bytes, not base64 inside the header', () => {
    const photo = bytes(...Array.from({ length: 300 }, (_, i) => i % 256));
    const frame = encodeClientMessage({
      type: 'request',
      id: 1,
      request: { kind: 'upload', media: 'image/jpeg', data: photo },
    });
    const decoded = decodeFrame(frame)!;
    expect(decoded.bytes).toEqual(photo);
    expect(JSON.stringify(decoded.header)).not.toContain('data');
  });

  it('rejects the token messages of stages 1 and 2 and unknown types', () => {
    expect(decodeClientMessage(raw({ type: 'auth', token: 'abc' }))).toBeNull();
    expect(decodeClientMessage(raw({ type: 'hello', protocol: 1, token: 'abc' }))).toBeNull();
    expect(decodeClientMessage(raw({ type: 'shell', cmd: 'rm' }))).toBeNull();
    expect(
      decodeClientMessage(raw({ type: 'request', id: 1, request: { kind: 'exec', cmd: 'rm' } })),
    ).toBeNull();
  });

  it('names a well-formed request of a kind it does not know, so the agent can answer it', () => {
    expect(
      readUnknownRequest(raw({ type: 'request', id: 7, request: { kind: 'exec', cmd: 'rm' } })),
    ).toEqual({ id: 7, kind: 'exec' });
    // A known kind with bad fields is malformed, not unknown.
    expect(
      readUnknownRequest(raw({ type: 'request', id: 7, request: { kind: 'prompt', target: 'p' } })),
    ).toBeNull();
    expect(
      readUnknownRequest(raw({ type: 'request', id: 'x', request: { kind: 'exec' } })),
    ).toBeNull();
    expect(readUnknownRequest(raw({ type: 'request', id: 7, request: { kind: 5 } }))).toBeNull();
    expect(readUnknownRequest(raw({ type: 'shell', cmd: 'rm' }))).toBeNull();
  });

  it('rejects fields of the wrong type', () => {
    const request = (value: unknown, id: unknown = 1) =>
      raw({ type: 'request', id, request: value });
    expect(decodeClientMessage(raw({ type: 'confirm', proof: 5 }))).toBeNull();
    expect(decodeClientMessage(raw({ type: 'confirm', proof: null }))).toBeNull();
    expect(decodeClientMessage(raw({ type: 'confirm', proof: 'not base64!' }))).toBeNull();
    expect(
      decodeClientMessage(raw({ type: 'confirm', proof: encodeBase64Url(new Uint8Array(16)) })),
    ).toBeNull();
    expect(
      decodeClientMessage(request({ kind: 'watch', target: null, terminal: false }, '1')),
    ).toBeNull();
    expect(decodeClientMessage(request({ kind: 'prompt', target: 'p1', text: '' }))).toBeNull();
    expect(decodeClientMessage(request({ kind: 'keys', target: 'p1', keys: [] }))).toBeNull();
    expect(decodeClientMessage(request({ kind: 'keys', target: 'p1', keys: [1] }))).toBeNull();
    expect(decodeClientMessage(request({ kind: 'unlink' }))).toBeNull();
    expect(decodeClientMessage(request({ kind: 'unlink', id: '' }))).toBeNull();
    expect(decodeClientMessage(request({ kind: 'unlink', id: 7 }))).toBeNull();
    expect(decodeClientMessage(request({ kind: 'new-session' }))).toBeNull();
    expect(decodeClientMessage(request({ kind: 'new-session', space: '' }))).toBeNull();
    expect(decodeClientMessage(request({ kind: 'new-session', space: 5 }))).toBeNull();
    expect(
      decodeClientMessage(request({ kind: 'new-session', space: 'w5', shell: 'yes' })),
    ).toBeNull();
  });

  it('accepts only the agents it knows for a new-session, so nothing else reaches the CLI', () => {
    for (const agent of ['rm -rf', '', 5, null, 'Claude']) {
      const message = { kind: 'new-session', space: 'w5', shell: false, agent };
      expect(decodeClientMessage(raw({ type: 'request', id: 1, request: message }))).toBeNull();
    }
  });

  it('reads a new-session from a phone older than shells as a Claude Code session', () => {
    const old = raw({ type: 'request', id: 1, request: { kind: 'new-session', space: 'w5' } });
    expect(decodeClientMessage(old)).toEqual({
      type: 'request',
      id: 1,
      request: { kind: 'new-session', space: 'w5', shell: false },
    });
  });

  it('accepts only an https push endpoint and keys of the right length', () => {
    const subscribe = (fields: Record<string, unknown>) =>
      decodeClientMessage(
        raw({ type: 'request', id: 1, request: { ...pushSubscribe, ...fields } }),
      );
    expect(subscribe({})).not.toBeNull();
    expect(subscribe({ endpoint: 'http://push.example.com/x' })).toBeNull();
    expect(subscribe({ endpoint: 'not a url' })).toBeNull();
    expect(subscribe({ p256dh: encodeBase64Url(new Uint8Array(64)) })).toBeNull();
    expect(subscribe({ auth: encodeBase64Url(new Uint8Array(15)) })).toBeNull();
    expect(subscribe({ auth: 5 })).toBeNull();
  });

  it('requires bytes on an upload and refuses them on anything else', () => {
    expect(
      decodeClientMessage(
        raw({ type: 'request', id: 1, request: { kind: 'upload', media: 'image/jpeg' } }),
      ),
    ).toBeNull();
    expect(
      decodeClientMessage(
        raw(
          { type: 'request', id: 1, request: { kind: 'prompt', target: 'p1', text: 'x' } },
          bytes(1),
        ),
      ),
    ).toBeNull();
    expect(decodeClientMessage(raw({ type: 'confirm', proof }, bytes(1)))).toBeNull();
    expect(
      decodeClientMessage(raw({ type: 'request', id: 1, request: { kind: 'devices' } }, bytes(1))),
    ).toBeNull();
  });
});

describe('versions and close codes', () => {
  it('speaks protocol 2 and closes an expired or revoked pairing with its own code', () => {
    expect(PROTOCOL).toBe(2);
    expect(CLOSE_PAIRING_EXPIRED).toBe(4003);
    expect(new Set([CLOSE_UNAUTHORIZED, CLOSE_PROTOCOL, CLOSE_PAIRING_EXPIRED]).size).toBe(3);
  });
});

const linked: LinkedDevice = {
  id: '0123456789abcdef',
  pairedAt: 1,
  lastSeen: 2,
  expiresAt: 3,
  current: true,
};

describe('server messages', () => {
  it('round-trips pushes and replies', () => {
    const messages: ServerMessage[] = [
      { type: 'ready', protocol: PROTOCOL, version: '0.1.0', device: '0123456789abcdef' },
      { type: 'status', herdrError: 'herdr not found' },
      { type: 'status', herdrError: null },
      { type: 'devices', devices: [linked] },
      { type: 'reply', id: 2, ok: true, result: [linked, { ...linked, current: false }] },
      { type: 'reply', id: 3, ok: true, result: { path: 'C:\\x.jpg', name: 'x.jpg', bytes: 3 } },
      { type: 'reply', id: 4, ok: true },
      { type: 'reply', id: 5, ok: false, error: 'unknown session: p9' },
    ];
    for (const message of messages) {
      expect(decodeServerMessage(encodeServerMessage(message))).toEqual(message);
    }
  });

  it('carries image bytes of a reply outside the header and puts them back', () => {
    const image = bytes(137, 80, 78, 71);
    const frame = encodeServerMessage({
      type: 'reply',
      id: 9,
      ok: true,
      result: { media: 'image/png', data: image },
    });
    expect(decodeFrame(frame)!.bytes).toEqual(image);
    expect(decodeServerMessage(frame)).toEqual({
      type: 'reply',
      id: 9,
      ok: true,
      result: { media: 'image/png', data: image },
    });
  });

  it('rejects a frame without a message type', () => {
    expect(decodeServerMessage(raw({ hello: 1 }))).toBeNull();
    expect(decodeServerMessage(bytes(1))).toBeNull();
  });
});
