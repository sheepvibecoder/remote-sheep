// The handshake that opens every connection: X25519 triple Diffie-Hellman.
//
// Each side mixes its fresh ephemeral key with the other's ephemeral and
// static keys, so the session keys need both static private keys (mutual
// authentication) and both ephemeral ones (forward secrecy: stealing a static
// key later does not open recorded traffic). The keys are derived over a hash
// of the whole handshake, so a peer that saw different keys than the other
// side, a man in the middle included, ends up with keys that open nothing.

import { x25519 } from '@noble/curves/ed25519.js';
import { hkdf } from '@noble/hashes/hkdf.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { concatBytes } from '@noble/hashes/utils.js';
import { PROTOCOL } from '../version';
import { generateKeyPair, KEY_BYTES, type KeyPair } from './keys';
import { createSecureSession, type SecureSession, type Side } from './secure-session';

/** phone → agent, first handshake frame. */
export interface Hello {
  protocol: number;
  ephemeral: Uint8Array;
  /** The phone's static public key. */
  identity: Uint8Array;
  /** True when the phone is pairing with an invite rather than reconnecting. */
  pair: boolean;
}

/** agent → phone, second handshake frame. */
export interface Welcome {
  ephemeral: Uint8Array;
}

export interface PhoneHandshake {
  readonly hello: Hello;
  /** Completes the handshake against the agent key the phone trusts (from the QR). */
  finish(welcome: Welcome, agentKey: Uint8Array): SecureSession;
}

export interface AcceptedHandshake {
  readonly welcome: Welcome;
  readonly session: SecureSession;
}

const encoder = new TextEncoder();
const TRANSCRIPT_LABEL = encoder.encode('remote-sheep/2');
const KEYS_INFO = encoder.encode('remote-sheep/2 keys');

function dh(secretKey: Uint8Array, publicKey: Uint8Array): Uint8Array {
  if (publicKey.length !== KEY_BYTES) throw new Error('handshake failed: bad key length');
  let shared: Uint8Array;
  try {
    // noble refuses low-order points itself; the zero check below keeps that
    // guarantee here even if the library default ever changed.
    shared = x25519.getSharedSecret(secretKey, publicKey);
  } catch (error) {
    throw new Error('handshake failed: low-order key', { cause: error });
  }
  if (shared.every((byte) => byte === 0)) throw new Error('handshake failed: low-order key');
  return shared;
}

interface Parties {
  phoneEphemeral: Uint8Array;
  phoneStatic: Uint8Array;
  agentEphemeral: Uint8Array;
  agentStatic: Uint8Array;
}

function derive(side: Side, parties: Parties, shared: Uint8Array[]): SecureSession {
  const transcript = sha256(
    concatBytes(
      TRANSCRIPT_LABEL,
      Uint8Array.of(PROTOCOL),
      parties.phoneEphemeral,
      parties.phoneStatic,
      parties.agentEphemeral,
      parties.agentStatic,
    ),
  );
  const okm = hkdf(sha256, concatBytes(...shared), transcript, KEYS_INFO, 64);
  return createSecureSession(side, transcript, okm);
}

/** The phone's side: send `hello`, then call `finish` with the agent's `welcome`. */
export function startHandshake(phone: KeyPair, pair: boolean, ephemeral?: KeyPair): PhoneHandshake {
  const own = ephemeral ?? generateKeyPair();
  const hello: Hello = {
    protocol: PROTOCOL,
    ephemeral: own.publicKey,
    identity: phone.publicKey,
    pair,
  };
  return {
    hello,
    finish(welcome, agentKey) {
      const parties = {
        phoneEphemeral: own.publicKey,
        phoneStatic: phone.publicKey,
        agentEphemeral: welcome.ephemeral,
        agentStatic: agentKey,
      };
      return derive('phone', parties, [
        dh(own.secretKey, welcome.ephemeral),
        dh(own.secretKey, agentKey),
        dh(phone.secretKey, welcome.ephemeral),
      ]);
    },
  };
}

/**
 * The agent's side. Call it only after deciding the phone may connect
 * (paired device or live invite); it throws on another protocol or a bad key.
 */
export function acceptHandshake(
  agent: KeyPair,
  hello: Hello,
  ephemeral?: KeyPair,
): AcceptedHandshake {
  if (hello.protocol !== PROTOCOL) throw new Error('handshake failed: protocol mismatch');
  const own = ephemeral ?? generateKeyPair();
  const parties = {
    phoneEphemeral: hello.ephemeral,
    phoneStatic: hello.identity,
    agentEphemeral: own.publicKey,
    agentStatic: agent.publicKey,
  };
  const session = derive('agent', parties, [
    dh(own.secretKey, hello.ephemeral),
    dh(agent.secretKey, hello.ephemeral),
    dh(own.secretKey, hello.identity),
  ]);
  return { welcome: { ephemeral: own.publicKey }, session };
}
