import type { KeyPair } from '@remote-sheep/protocol';

/**
 * What this phone keeps once a pairing succeeded: everything a later handshake
 * needs. One per computer the phone is paired with, a profile.
 */
export interface StoredPairing {
  /** The profile's id: `publicKeyId` of the agent key, so pairing the same computer again replaces it. */
  id: string;
  /** What the person calls this computer. */
  name: string;
  /** The phone's static key pair, made on the phone; the secret key never leaves it. */
  phone: KeyPair;
  /** The agent's static public key from the QR: the only agent this profile talks to. */
  agentKey: Uint8Array;
  /** The id the agent knows this phone by (`remote-sheep devices`). */
  device: string;
}

/** Where the phone keeps its pairings between visits: IndexedDB in the browser. */
export interface PairingStore {
  /** Every stored pairing in the order they were first saved; empty when the phone never paired. */
  list(): Promise<StoredPairing[]>;
  /** Adds the pairing, or replaces the one with the same id. */
  save(pairing: StoredPairing): Promise<void>;
  remove(id: string): Promise<void>;
}
