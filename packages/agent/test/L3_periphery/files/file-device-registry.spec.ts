import { mkdtempSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { encodeBase64Url, generateKeyPair, publicKeyId } from '@remote-sheep/protocol';
import { FileDeviceRegistry } from '../../../src/L3_periphery/files/file-device-registry';

const T0 = 1_700_000_000_000;

function fresh() {
  const dir = mkdtempSync(join(tmpdir(), 'sheep-devices-'));
  const file = join(dir, 'devices.json');
  return { dir, file, registry: new FileDeviceRegistry(file) };
}

function device(pairedAt = T0) {
  const { publicKey } = generateKeyPair();
  return { id: publicKeyId(publicKey), publicKey, pairedAt, lastSeen: pairedAt };
}

describe('FileDeviceRegistry', () => {
  it('is empty while no phone was ever paired', async () => {
    const { registry } = fresh();
    expect(await registry.list()).toEqual([]);
    expect(await registry.find('0123456789abcdef')).toBeNull();
    expect(await registry.isRevoked('0123456789abcdef')).toBe(false);
  });

  it('stores devices with their public keys as base64url, and reads them back', async () => {
    const { registry, file } = fresh();
    const phone = device();
    await registry.save(phone);
    expect(await registry.find(phone.id)).toEqual(phone);
    expect(await registry.list()).toEqual([phone]);
    expect(JSON.parse(readFileSync(file, 'utf8'))).toEqual({
      version: 1,
      devices: [
        {
          id: phone.id,
          publicKey: encodeBase64Url(phone.publicKey),
          pairedAt: T0,
          lastSeen: T0,
        },
      ],
      revoked: [],
    });
  });

  it('writes through a temporary file and leaves only the registry behind', async () => {
    const { registry, dir, file } = fresh();
    await Promise.all([registry.save(device()), registry.save(device()), registry.save(device())]);
    expect(readdirSync(dir)).toEqual(['devices.json']);
    expect(await registry.list()).toHaveLength(3);
    if (process.platform !== 'win32') expect(statSync(file).mode & 0o777).toBe(0o600);
  });

  it('sees a revocation made by another process on the next lookup', async () => {
    const { registry, file } = fresh();
    const phone = device();
    await registry.save(phone);
    const cli = new FileDeviceRegistry(file);
    expect(await cli.remove(phone.id)).toBe(true);
    expect(await registry.find(phone.id)).toBeNull();
    expect(await registry.isRevoked(phone.id)).toBe(true);
    expect(await registry.list()).toEqual([]);
  });

  it('reports an unknown id on removal and records nothing', async () => {
    const { registry } = fresh();
    expect(await registry.remove('0123456789abcdef')).toBe(false);
    expect(await registry.isRevoked('0123456789abcdef')).toBe(false);
  });

  it('lifts a revocation when the same phone pairs again', async () => {
    const { registry } = fresh();
    const phone = device();
    await registry.save(phone);
    await registry.remove(phone.id);
    await registry.save({ ...phone, pairedAt: T0 + 1, lastSeen: T0 + 1 });
    expect(await registry.isRevoked(phone.id)).toBe(false);
    expect((await registry.find(phone.id))?.pairedAt).toBe(T0 + 1);
  });

  it('moves lastSeen forward only, and ignores unknown ids', async () => {
    const { registry } = fresh();
    const phone = device();
    await registry.save(phone);
    await registry.touch(phone.id, T0 + 10);
    await registry.touch(phone.id, T0 + 5);
    await registry.touch('0123456789abcdef', T0 + 10);
    expect(await registry.list()).toEqual([{ ...phone, lastSeen: T0 + 10 }]);
  });

  it('refuses a damaged file instead of treating it as empty', async () => {
    const { registry, file } = fresh();
    writeFileSync(file, '{"version":1,"devices":[{"id":"x"}],"revoked":[]}');
    await expect(registry.list()).rejects.toThrow('damaged device registry');
    writeFileSync(file, 'not json');
    await expect(registry.find('x')).rejects.toThrow('damaged device registry');
    await expect(registry.save(device())).rejects.toThrow('damaged device registry');
  });

  it('refuses an entry whose id does not match its key', async () => {
    const { registry, file } = fresh();
    const phone = device();
    writeFileSync(
      file,
      JSON.stringify({
        version: 1,
        devices: [
          { ...phone, id: '0123456789abcdef', publicKey: encodeBase64Url(phone.publicKey) },
        ],
        revoked: [],
      }),
    );
    await expect(registry.list()).rejects.toThrow('damaged device registry');
  });

  describe('push subscription', () => {
    const push = {
      endpoint: 'https://push.example/abc',
      p256dh: encodeBase64Url(new Uint8Array(65).fill(4)),
      auth: encodeBase64Url(new Uint8Array(16).fill(9)),
    };

    it('stores it with the device, keeps the format version, and clears it', async () => {
      const { registry, file } = fresh();
      const phone = device();
      await registry.save(phone);
      expect(await registry.setPush(phone.id, push)).toBe(true);
      expect((await registry.find(phone.id))?.push).toEqual(push);
      const stored = JSON.parse(readFileSync(file, 'utf8')) as { version: number };
      expect(stored.version).toBe(1);

      expect(await registry.setPush(phone.id, null)).toBe(true);
      expect((await registry.find(phone.id))?.push).toBeUndefined();
      expect(readFileSync(file, 'utf8')).not.toContain('push');
    });

    it('is refused for an unknown device and survives lastSeen updates', async () => {
      const { registry } = fresh();
      expect(await registry.setPush('0123456789abcdef', push)).toBe(false);
      const phone = device();
      await registry.save(phone);
      await registry.setPush(phone.id, push);
      await registry.touch(phone.id, T0 + 5);
      expect((await registry.find(phone.id))?.push).toEqual(push);
    });

    it('goes away with the device when it is removed', async () => {
      const { registry, file } = fresh();
      const phone = device();
      await registry.save(phone);
      await registry.setPush(phone.id, push);
      await registry.remove(phone.id);
      expect(readFileSync(file, 'utf8')).not.toContain('push.example');
    });

    it('ignores a damaged subscription instead of refusing the whole registry', async () => {
      const { registry, file } = fresh();
      const phone = device();
      await registry.save(phone);
      const stored = JSON.parse(readFileSync(file, 'utf8')) as {
        devices: Record<string, unknown>[];
      };
      stored.devices[0] = { ...stored.devices[0], push: { endpoint: 5 } };
      writeFileSync(file, JSON.stringify(stored));
      expect(await registry.find(phone.id)).toEqual(phone);
    });
  });
});
