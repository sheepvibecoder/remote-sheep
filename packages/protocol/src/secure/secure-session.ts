// The frame cipher of one connection after its handshake.
//
// ChaCha20-Poly1305 with one key per direction and the frame counter as nonce.
// The counter is never sent: each side expects exactly the next one, so a
// replayed, reordered, dropped or truncated frame fails its tag like an
// altered one. Any failure latches the session closed, because a stream that
// lost one frame can no longer be trusted to mean what it says.

import { chacha20poly1305 } from '@noble/ciphers/chacha.js';

export interface SecureSession {
  /** SHA-256 of the whole handshake; the pairing proof is bound to it. */
  readonly transcript: Uint8Array;
  /** Encrypts the next outgoing frame. */
  seal(plain: Uint8Array): Uint8Array;
  /** Decrypts the next incoming frame; throws on anything but exactly that frame. */
  open(sealed: Uint8Array): Uint8Array;
}

export type Side = 'phone' | 'agent';

const encoder = new TextEncoder();
const PHONE_TO_AGENT = encoder.encode('p2a');
const AGENT_TO_PHONE = encoder.encode('a2p');

/** 2^53: past it the counter would repeat a nonce, so the connection must end first. */
const MAX_COUNTER = Number.MAX_SAFE_INTEGER;

/** 4 zero bytes ‖ u64 big-endian counter. */
function nonce(counter: number): Uint8Array {
  const bytes = new Uint8Array(12);
  const view = new DataView(bytes.buffer);
  view.setUint32(4, Math.floor(counter / 2 ** 32));
  view.setUint32(8, counter >>> 0);
  return bytes;
}

class Direction {
  private counter = 0;

  constructor(
    private readonly key: Uint8Array,
    private readonly aad: Uint8Array,
  ) {}

  next(): ReturnType<typeof chacha20poly1305> {
    if (this.counter >= MAX_COUNTER) throw new Error('secure session exhausted its nonces');
    return chacha20poly1305(this.key, nonce(this.counter++), this.aad);
  }
}

class CipherSession implements SecureSession {
  private failed = false;

  constructor(
    readonly transcript: Uint8Array,
    private readonly outgoing: Direction,
    private readonly incoming: Direction,
  ) {}

  seal(plain: Uint8Array): Uint8Array {
    return this.outgoing.next().encrypt(plain);
  }

  open(sealed: Uint8Array): Uint8Array {
    if (this.failed) throw new Error('secure session closed after a bad frame');
    try {
      return this.incoming.next().decrypt(sealed);
    } catch (error) {
      this.failed = true;
      throw new Error('bad frame: replayed, reordered, truncated or altered', { cause: error });
    }
  }
}

/** Builds one side of a session from the 64 bytes of key material the handshake derived. */
export function createSecureSession(
  side: Side,
  transcript: Uint8Array,
  keys: Uint8Array,
): SecureSession {
  const phoneToAgent = new Direction(keys.slice(0, 32), PHONE_TO_AGENT);
  const agentToPhone = new Direction(keys.slice(32, 64), AGENT_TO_PHONE);
  return side === 'phone'
    ? new CipherSession(transcript, phoneToAgent, agentToPhone)
    : new CipherSession(transcript, agentToPhone, phoneToAgent);
}
