// The paired phones, in one JSON file under ~/.remote-sheep.
//
// Two processes write it: the running agent (pairings, last use) and
// `remote-sheep revoke`. So every lookup reads the file again (a revocation
// takes effect on the agent's next check), every change is a read-modify-write
// under a lock file (the agent recording a use must not write back a device
// that was revoked a moment before), and the new content is written to a
// temporary file and renamed over the old one, so a reader never sees half a
// file. Only public keys are stored, but the file is still owner-only: it
// decides who may drive the terminal. On Windows Node ignores the mode bits;
// the file inherits the profile folder's access (the user, SYSTEM and
// Administrators), which is the same boundary as the rest of the profile.

import { randomBytes } from 'node:crypto';
import { mkdir, open, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { decodeBase64Url, encodeBase64Url, publicKeyId } from '@remote-sheep/protocol';
import type { Device, DeviceRegistry } from '../../L1_domain/ports/device-registry';
import type { PushSubscription } from '@remote-sheep/protocol';

interface Contents {
  devices: Device[];
  revoked: string[];
}

// Stays 1 although devices may now carry a `push` field: the field is optional and an
// older agent reads only the fields it knows, so it still opens the file (it merely drops
// the subscription the next time it writes, and the phone subscribes again). Raising the
// version would make that older agent refuse the whole registry as "unknown format".
const FORMAT_VERSION = 1;
const LOCK_RETRY_MS = 20;
const LOCK_WAIT_MS = 5000;
// A lock older than this was left by a process that died mid-write.
const STALE_LOCK_MS = 30_000;

const delay = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isTime = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;

function damaged(file: string, why: string): Error {
  return new Error('damaged device registry ' + file + ': ' + why);
}

// A subscription that does not look right is dropped, not fatal: it only costs the phone
// its notifications until it subscribes again, while a refused registry locks every phone out.
function parsePush(value: unknown): PushSubscription | undefined {
  if (!isObject(value)) return undefined;
  const { endpoint, p256dh, auth } = value;
  if (typeof endpoint !== 'string' || typeof p256dh !== 'string' || typeof auth !== 'string') {
    return undefined;
  }
  return { endpoint, p256dh, auth };
}

function parseDevice(value: unknown): Device | null {
  if (!isObject(value) || typeof value['id'] !== 'string') return null;
  if (typeof value['publicKey'] !== 'string') return null;
  const publicKey = decodeBase64Url(value['publicKey']);
  if (publicKey?.length !== 32 || publicKeyId(publicKey) !== value['id']) return null;
  if (!isTime(value['pairedAt']) || !isTime(value['lastSeen'])) return null;
  const push = parsePush(value['push']);
  return {
    id: value['id'],
    publicKey,
    pairedAt: value['pairedAt'],
    lastSeen: value['lastSeen'],
    ...(push && { push }),
  };
}

function parse(file: string, text: string): Contents {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw damaged(file, 'not JSON');
  }
  if (!isObject(json) || json['version'] !== FORMAT_VERSION) throw damaged(file, 'unknown format');
  const { devices, revoked } = json;
  if (!Array.isArray(devices) || !Array.isArray(revoked)) throw damaged(file, 'unknown format');
  const parsed = devices.map(parseDevice).filter((device) => device !== null);
  if (parsed.length !== devices.length) throw damaged(file, 'bad device entry');
  if (!revoked.every((id) => typeof id === 'string')) throw damaged(file, 'bad revoked entry');
  return { devices: parsed, revoked };
}

function serialize(contents: Contents): string {
  const devices = contents.devices.map((device) => ({
    id: device.id,
    publicKey: encodeBase64Url(device.publicKey),
    pairedAt: device.pairedAt,
    lastSeen: device.lastSeen,
    ...(device.push && { push: device.push }),
  }));
  return JSON.stringify({ version: FORMAT_VERSION, devices, revoked: contents.revoked }, null, 2);
}

function errorCode(error: unknown): unknown {
  return isObject(error) ? error['code'] : undefined;
}

// Windows refuses to rename over a file another process has open for a moment
// (EPERM/EBUSY), as `remote-sheep devices` may while the agent writes.
async function replace(from: string, to: string): Promise<void> {
  for (let attempt = 1; ; attempt++) {
    try {
      await rename(from, to);
      return;
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if (attempt >= 5 || (code !== 'EPERM' && code !== 'EBUSY')) throw err;
      await new Promise((resolve) => setTimeout(resolve, 20 * attempt));
    }
  }
}

export class FileDeviceRegistry implements DeviceRegistry {
  // Changes from this process queue up here; the lock file orders them with other processes.
  private writes: Promise<unknown> = Promise.resolve();

  constructor(private readonly file: string) {}

  async list(): Promise<Device[]> {
    return (await this.read()).devices;
  }

  async find(id: string): Promise<Device | null> {
    return (await this.read()).devices.find((device) => device.id === id) ?? null;
  }

  async isRevoked(id: string): Promise<boolean> {
    return (await this.read()).revoked.includes(id);
  }

  save(device: Device): Promise<void> {
    return this.change((contents) => ({
      devices: [...contents.devices.filter((d) => d.id !== device.id), device],
      revoked: contents.revoked.filter((id) => id !== device.id),
    }));
  }

  touch(id: string, at: number): Promise<void> {
    return this.change((contents) => {
      const device = contents.devices.find((d) => d.id === id);
      if (!device || device.lastSeen >= at) return null;
      return {
        devices: contents.devices.map((d) => (d.id === id ? { ...d, lastSeen: at } : d)),
        revoked: contents.revoked,
      };
    });
  }

  async setPush(id: string, push: PushSubscription | null): Promise<boolean> {
    let found = false;
    await this.change((contents) => {
      found = contents.devices.some((d) => d.id === id);
      if (!found) return null;
      return {
        devices: contents.devices.map((d) => {
          if (d.id !== id) return d;
          const { push: _previous, ...rest } = d;
          return push ? { ...rest, push } : rest;
        }),
        revoked: contents.revoked,
      };
    });
    return found;
  }

  async remove(id: string): Promise<boolean> {
    let found = false;
    await this.change((contents) => {
      found = contents.devices.some((d) => d.id === id);
      if (!found) return null;
      return {
        devices: contents.devices.filter((d) => d.id !== id),
        revoked: [...contents.revoked.filter((r) => r !== id), id],
      };
    });
    return found;
  }

  private async read(): Promise<Contents> {
    let text: string;
    try {
      text = await readFile(this.file, 'utf8');
    } catch (error) {
      if (errorCode(error) === 'ENOENT') return { devices: [], revoked: [] };
      throw error;
    }
    return parse(this.file, text);
  }

  /** Applies `update` to the current contents; a null result writes nothing. */
  private change(update: (contents: Contents) => Contents | null): Promise<void> {
    const run = this.writes.then(
      () => this.locked(update),
      () => this.locked(update),
    );
    this.writes = run.catch(() => undefined);
    return run;
  }

  private async locked(update: (contents: Contents) => Contents | null): Promise<void> {
    await mkdir(dirname(this.file), { recursive: true, mode: 0o700 });
    const lock = this.file + '.lock';
    await this.acquire(lock);
    try {
      const next = update(await this.read());
      if (!next) return;
      const temp = this.file + '.' + randomBytes(6).toString('hex') + '.tmp';
      try {
        await writeFile(temp, serialize(next) + '\n', { encoding: 'utf8', mode: 0o600 });
        await replace(temp, this.file);
      } finally {
        await rm(temp, { force: true });
      }
    } finally {
      await rm(lock, { force: true });
    }
  }

  private async acquire(lock: string): Promise<void> {
    const deadline = Date.now() + LOCK_WAIT_MS;
    for (;;) {
      try {
        await (await open(lock, 'wx', 0o600)).close();
        return;
      } catch (error) {
        if (errorCode(error) !== 'EEXIST') throw error;
      }
      const age = await stat(lock).then(
        (info) => Date.now() - info.mtimeMs,
        () => 0,
      );
      if (age > STALE_LOCK_MS) {
        await rm(lock, { force: true });
        continue;
      }
      if (Date.now() > deadline) throw new Error('device registry is locked: ' + lock);
      await delay(LOCK_RETRY_MS);
    }
  }
}
