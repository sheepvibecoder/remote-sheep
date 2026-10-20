// Who may connect: the one-time invites a QR carries, and the phones they paired.
//
// The channel asks this service at two moments of a handshake (the clear
// `hello`, then the sealed `confirm`) and periodically while a phone is
// connected, so a revocation from another process or an expiry closes it. All
// state that must survive a restart is in the registry; the live invite and
// the touch throttle are deliberately in memory, so a restart voids any QR.
//
// The phones' "linked devices" list is served from here too: this service
// already owns the registry, the expiry rule and the moment a pairing
// completes, so the list and its change notice need no other wiring.

import {
  constantTimeEqual,
  publicKeyId,
  verifyPairingProof,
  type Invite,
  type LinkedDevice,
} from '@remote-sheep/protocol';
import { isPairingExpired, pairingExpiresAt } from '../L1_domain/pairing-expiry';
import type { Clock } from '../L1_domain/ports/clock';
import type { Device, DeviceRegistry } from '../L1_domain/ports/device-registry';
import type { RandomSource } from '../L1_domain/ports/random-source';

export const INVITE_SECRET_BYTES = 32;
export const INVITE_TTL_MS = 5 * 60 * 1000;
/** `lastSeen` is written at most this often per device: fine enough for a 24-hour rule. */
export const TOUCH_INTERVAL_MS = 60 * 1000;

/** The whole invite a QR code carries: the agent key, the one-time secret and its expiry. */
export interface PendingInvite extends Invite {
  readonly agentKey: Uint8Array;
  readonly secret: Uint8Array;
  /** Epoch milliseconds; the invite is refused from this instant on. */
  readonly expiresAt: number;
}

/** The verdict on a `hello`, before the agent answers it. */
export type Admission =
  | { kind: 'pair'; invite: PendingInvite }
  | { kind: 'paired'; device: Device }
  | { kind: 'unknown' }
  | { kind: 'no-invite' }
  | { kind: 'expired' }
  | { kind: 'revoked' };

export type DeviceState = 'valid' | 'expired' | 'revoked';

export interface PairingServiceOptions {
  registry: DeviceRegistry;
  clock: Clock;
  random: RandomSource;
  /** The agent's static public key, which every invite names. */
  agentKey: Uint8Array;
}

export class PairingService {
  // One live invite at a time: printing a new QR voids the previous one, so
  // at most one secret can be guessed at or replayed at any moment.
  private invite: PendingInvite | null = null;
  private readonly touched = new Map<string, number>();
  private readonly listeners = new Set<() => void>();

  constructor(private readonly options: PairingServiceOptions) {}

  createInvite(): PendingInvite {
    const secret = this.options.random.bytes(INVITE_SECRET_BYTES);
    if (secret.length !== INVITE_SECRET_BYTES) throw new Error('random source returned short');
    this.invite = {
      agentKey: this.options.agentKey,
      secret,
      expiresAt: this.options.clock.now() + INVITE_TTL_MS,
    };
    return this.invite;
  }

  async admit(identity: Uint8Array, pair: boolean): Promise<Admission> {
    if (pair) {
      const invite = this.liveInvite();
      return invite ? { kind: 'pair', invite } : { kind: 'no-invite' };
    }
    const id = publicKeyId(identity);
    const found = await this.options.registry.find(id);
    // The id is a 64-bit prefix of the key's hash; only the whole key proves it is the same phone.
    const device = found && constantTimeEqual(found.publicKey, identity) ? found : null;
    if (!device) {
      return (await this.options.registry.isRevoked(id))
        ? { kind: 'revoked' }
        : { kind: 'unknown' };
    }
    if (isPairingExpired(device, this.options.clock.now())) return { kind: 'expired' };
    return { kind: 'paired', device };
  }

  /**
   * Consumes `invite` whatever the outcome, so a wrong guess burns the QR
   * instead of leaving it open to the next one. Returns the stored device, or
   * null when the invite was already used, replaced, expired or the proof is
   * missing or wrong.
   */
  async completePairing(
    invite: PendingInvite,
    identity: Uint8Array,
    transcript: Uint8Array,
    proof: string | undefined,
  ): Promise<Device | null> {
    if (this.invite !== invite) return null;
    this.invite = null;
    const now = this.options.clock.now();
    if (now >= invite.expiresAt) return null;
    if (proof === undefined || !verifyPairingProof(invite.secret, transcript, proof)) return null;

    const device: Device = {
      id: publicKeyId(identity),
      publicKey: identity,
      pairedAt: now,
      lastSeen: now,
    };
    await this.options.registry.save(device);
    this.touched.set(device.id, now);
    this.devicesChanged();
    return device;
  }

  /** Records that the device was used now, at most once per `TOUCH_INTERVAL_MS`. */
  async touch(id: string): Promise<void> {
    const now = this.options.clock.now();
    const last = this.touched.get(id);
    if (last !== undefined && now - last < TOUCH_INTERVAL_MS) return;
    this.touched.set(id, now);
    await this.options.registry.touch(id, now);
  }

  /** Whether an open connection's device may stay connected. A device that vanished counts as revoked. */
  async state(id: string): Promise<DeviceState> {
    const device = await this.options.registry.find(id);
    if (!device) return 'revoked';
    return isPairingExpired(device, this.options.clock.now()) ? 'expired' : 'valid';
  }

  /** Every paired phone, oldest pairing first; `current` marks the device `asking`. */
  async linkedDevices(asking: string): Promise<LinkedDevice[]> {
    const devices = await this.options.registry.list();
    return devices
      .map((device) => ({
        id: device.id,
        pairedAt: device.pairedAt,
        lastSeen: device.lastSeen,
        expiresAt: pairingExpiresAt(device),
        current: device.id === asking,
      }))
      .sort((a, b) => a.pairedAt - b.pairedAt);
  }

  /**
   * The same removal as `remote-sheep revoke`: the channel's periodic re-check
   * closes the device if it is connected, and it gets 4003 if it comes back.
   */
  async unlink(id: string): Promise<void> {
    if (!(await this.options.registry.remove(id))) {
      throw new Error('no paired device has the id ' + id);
    }
    this.devicesChanged();
  }

  /**
   * Called after a phone pairs or is unlinked from a phone. A revoke from the
   * CLI runs in another process and is not announced.
   */
  onDevicesChanged(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private devicesChanged(): void {
    for (const listener of this.listeners) listener();
  }

  private liveInvite(): PendingInvite | null {
    if (this.invite && this.options.clock.now() >= this.invite.expiresAt) this.invite = null;
    return this.invite;
  }
}
