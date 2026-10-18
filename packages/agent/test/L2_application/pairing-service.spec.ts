import { describe, expect, it } from 'vitest';
import { generateKeyPair, pairingProof, publicKeyId } from '@remote-sheep/protocol';
import { PairingService } from '../../src/L2_application/pairing-service';
import { MemoryDeviceRegistry } from '../fakes/memory-device-registry';

const MINUTE = 60 * 1000;
const DAY = 24 * 60 * MINUTE;
const T0 = 1_700_000_000_000;

function setup() {
  const registry = new MemoryDeviceRegistry();
  const clock = { time: T0, now: () => clock.time };
  let fill = 0;
  const random = { bytes: (n: number) => new Uint8Array(n).fill(++fill) };
  const service = new PairingService({ registry, clock, random });
  return { registry, clock, service };
}

const transcript = new Uint8Array(32).fill(9);

describe('PairingService', () => {
  it('creates one-time invites of 32 random bytes that live 5 minutes', () => {
    const { service } = setup();
    const invite = service.createInvite();
    expect(invite.secret).toEqual(new Uint8Array(32).fill(1));
    expect(invite.expiresAt).toBe(T0 + 5 * MINUTE);
  });

  it('pairs a phone that proves it knows the invite secret, exactly once', async () => {
    const { service, registry, clock } = setup();
    const phone = generateKeyPair();
    const invite = service.createInvite();
    clock.time += MINUTE;

    const admission = await service.admit(phone.publicKey, true);
    expect(admission).toEqual({ kind: 'pair', invite });
    const proof = pairingProof(invite.secret, transcript);
    const device = await service.completePairing(invite, phone.publicKey, transcript, proof);

    const id = publicKeyId(phone.publicKey);
    expect(device).toEqual({
      id,
      publicKey: phone.publicKey,
      pairedAt: T0 + MINUTE,
      lastSeen: T0 + MINUTE,
    });
    expect(await registry.find(id)).toEqual(device);
    // The same secret never pairs a second phone.
    expect(await service.admit(generateKeyPair().publicKey, true)).toEqual({ kind: 'no-invite' });
    expect(await service.completePairing(invite, phone.publicKey, transcript, proof)).toBeNull();
  });

  it('consumes the invite on a wrong or missing proof, and stores nothing', async () => {
    const { service, registry } = setup();
    const phone = generateKeyPair();
    const invite = service.createInvite();
    const wrong = pairingProof(new Uint8Array(32), transcript);
    expect(await service.completePairing(invite, phone.publicKey, transcript, wrong)).toBeNull();
    expect(await service.admit(phone.publicKey, true)).toEqual({ kind: 'no-invite' });

    const next = service.createInvite();
    expect(await service.completePairing(next, phone.publicKey, transcript, undefined)).toBeNull();
    expect(await service.admit(phone.publicKey, true)).toEqual({ kind: 'no-invite' });
    expect(await registry.list()).toEqual([]);
  });

  it('refuses an expired invite, at hello and at confirm', async () => {
    const { service, clock, registry } = setup();
    const phone = generateKeyPair();
    const invite = service.createInvite();
    clock.time = invite.expiresAt;
    expect(await service.admit(phone.publicKey, true)).toEqual({ kind: 'no-invite' });

    clock.time = T0;
    const late = service.createInvite();
    expect((await service.admit(phone.publicKey, true)).kind).toBe('pair');
    clock.time = late.expiresAt;
    const proof = pairingProof(late.secret, transcript);
    expect(await service.completePairing(late, phone.publicKey, transcript, proof)).toBeNull();
    expect(await registry.list()).toEqual([]);
  });

  it('keeps only the newest invite live', async () => {
    const { service, registry } = setup();
    const phone = generateKeyPair();
    const old = service.createInvite();
    service.createInvite();
    const proof = pairingProof(old.secret, transcript);
    expect(await service.completePairing(old, phone.publicKey, transcript, proof)).toBeNull();
    expect(await registry.list()).toEqual([]);
  });

  it('admits a paired phone without an invite, and tells unknown, expired and revoked apart', async () => {
    const { service, registry, clock } = setup();
    const phone = generateKeyPair();
    const id = publicKeyId(phone.publicKey);
    expect(await service.admit(phone.publicKey, false)).toEqual({ kind: 'unknown' });

    const device = { id, publicKey: phone.publicKey, pairedAt: T0, lastSeen: T0 };
    await registry.save(device);
    expect(await service.admit(phone.publicKey, false)).toEqual({ kind: 'paired', device });
    expect(await service.state(id)).toBe('valid');

    clock.time = T0 + DAY;
    expect(await service.admit(phone.publicKey, false)).toEqual({ kind: 'expired' });
    expect(await service.state(id)).toBe('expired');

    await registry.remove(id);
    expect(await service.admit(phone.publicKey, false)).toEqual({ kind: 'revoked' });
    expect(await service.state(id)).toBe('revoked');
    expect(await service.state('0123456789abcdef')).toBe('revoked');
  });

  it('admits a phone only when its whole key matches, not just the id', async () => {
    const { registry, service } = setup();
    const phone = generateKeyPair();
    const impostor = generateKeyPair();
    await registry.save({
      id: publicKeyId(phone.publicKey),
      publicKey: impostor.publicKey,
      pairedAt: T0,
      lastSeen: T0,
    });
    expect(await service.admit(phone.publicKey, false)).toEqual({ kind: 'unknown' });
  });

  it('records use at most once a minute per device, so the 24 hours count idleness', async () => {
    const { service, registry, clock } = setup();
    const phone = generateKeyPair();
    const id = publicKeyId(phone.publicKey);
    await registry.save({ id, publicKey: phone.publicKey, pairedAt: T0, lastSeen: T0 });

    await service.touch(id);
    clock.time += MINUTE - 1;
    await service.touch(id);
    clock.time += 1;
    await service.touch(id);
    await service.touch('other');
    expect(registry.touches).toEqual([
      [id, T0],
      [id, T0 + MINUTE],
      ['other', T0 + MINUTE],
    ]);

    // Used 23 hours later, the phone is still valid a day after the first use.
    clock.time = T0 + 23 * 60 * MINUTE;
    await service.touch(id);
    clock.time = T0 + DAY + MINUTE;
    expect(await service.state(id)).toBe('valid');
  });

  describe('linked devices', () => {
    async function twoPhones(registry: MemoryDeviceRegistry) {
      const older = generateKeyPair();
      const newer = generateKeyPair();
      const a = { id: publicKeyId(newer.publicKey), publicKey: newer.publicKey };
      const b = { id: publicKeyId(older.publicKey), publicKey: older.publicKey };
      await registry.save({ ...a, pairedAt: T0 + MINUTE, lastSeen: T0 + 2 * MINUTE });
      await registry.save({ ...b, pairedAt: T0, lastSeen: T0 + 7 * DAY - DAY / 2 });
      return { newer: a.id, older: b.id };
    }

    it('lists every paired phone oldest first, with its expiry, marking the one that asks', async () => {
      const { service, registry } = setup();
      const { newer, older } = await twoPhones(registry);
      expect(await service.linkedDevices(newer)).toEqual([
        {
          id: older,
          pairedAt: T0,
          lastSeen: T0 + 7 * DAY - DAY / 2,
          // Seven days after pairing comes before 24 hours after the last use.
          expiresAt: T0 + 7 * DAY,
          current: false,
        },
        {
          id: newer,
          pairedAt: T0 + MINUTE,
          lastSeen: T0 + 2 * MINUTE,
          expiresAt: T0 + 2 * MINUTE + DAY,
          current: true,
        },
      ]);
      expect((await service.linkedDevices('someone-else')).map((d) => d.current)).toEqual([
        false,
        false,
      ]);
    });

    it('unlinks a device the way `remote-sheep revoke` does, and says the list changed', async () => {
      const { service, registry } = setup();
      const { newer, older } = await twoPhones(registry);
      let changes = 0;
      service.onDevicesChanged(() => changes++);

      await service.unlink(older);
      expect((await registry.list()).map((d) => d.id)).toEqual([newer]);
      expect(await registry.isRevoked(older)).toBe(true);
      expect(await service.state(older)).toBe('revoked');
      expect(changes).toBe(1);
    });

    it('refuses to unlink an id that is not paired, and changes nothing', async () => {
      const { service, registry } = setup();
      const { newer } = await twoPhones(registry);
      let changes = 0;
      service.onDevicesChanged(() => changes++);

      await expect(service.unlink('0123456789abcdef')).rejects.toThrow(
        'no paired device has the id 0123456789abcdef',
      );
      expect(await registry.list()).toHaveLength(2);
      expect(await registry.isRevoked('0123456789abcdef')).toBe(false);
      expect(await service.state(newer)).toBe('valid');
      expect(changes).toBe(0);
    });

    it('says the list changed when a phone pairs, and not when a pairing fails', async () => {
      const { service } = setup();
      const seen: number[] = [];
      const stop = service.onDevicesChanged(() => seen.push(1));
      const phone = generateKeyPair();

      const burnt = service.createInvite();
      const wrong = pairingProof(new Uint8Array(32), transcript);
      await service.completePairing(burnt, phone.publicKey, transcript, wrong);
      expect(seen).toEqual([]);

      const invite = service.createInvite();
      const proof = pairingProof(invite.secret, transcript);
      await service.completePairing(invite, phone.publicKey, transcript, proof);
      expect(seen).toEqual([1]);

      stop();
      await service.unlink(publicKeyId(phone.publicKey));
      expect(seen).toEqual([1]);
    });
  });
});
