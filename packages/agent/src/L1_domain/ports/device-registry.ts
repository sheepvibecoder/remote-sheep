import type { PushSubscription } from '@remote-sheep/protocol';

/** A phone that scanned one of this agent's QR codes. */
export interface Device {
  /** `publicKeyId` of the phone's identity key; what `remote-sheep devices` shows. */
  readonly id: string;
  /** The phone's static X25519 public key. */
  readonly publicKey: Uint8Array;
  /** Epoch milliseconds. */
  readonly pairedAt: number;
  /** Epoch milliseconds of the last connection or request. */
  readonly lastSeen: number;
  /** Where to notify this phone; absent until it opts in. */
  readonly push?: PushSubscription;
}

/**
 * The phones this agent trusts. Another process (`remote-sheep revoke`) may
 * change it at any time, so lookups must never be served from a stale copy.
 */
export interface DeviceRegistry {
  list(): Promise<Device[]>;
  find(id: string): Promise<Device | null>;
  /** True for an id removed with `remove` and not paired again since. */
  isRevoked(id: string): Promise<boolean>;
  /** Adds or replaces the device, and lifts an earlier revocation of its id. */
  save(device: Device): Promise<void>;
  /** Moves `lastSeen` forward; does nothing for an unknown id. */
  touch(id: string, at: number): Promise<void>;
  /** Stores or clears (null) the device's push subscription; false when the id is unknown. */
  setPush(id: string, push: PushSubscription | null): Promise<boolean>;
  /** Removes the device and remembers it was revoked; false when the id is unknown. */
  remove(id: string): Promise<boolean>;
}
