import { mkdtempSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { encodeBase64Url } from '@remote-sheep/protocol';
import { loadVapidKeys } from '../../../src/L3_periphery/files/file-vapid-keys';

const fileIn = () => join(mkdtempSync(join(tmpdir(), 'sheep-vapid-')), 'home', 'vapid.json');

describe('loadVapidKeys', () => {
  it('creates the key pair once, owner-only, and returns the same one afterwards', async () => {
    const file = fileIn();
    const first = await loadVapidKeys(file);
    const again = await loadVapidKeys(file);
    expect(first.publicKey).toHaveLength(65);
    expect(first.publicKey[0]).toBe(4);
    expect(again.publicKey).toEqual(first.publicKey);
    const stored = JSON.parse(readFileSync(file, 'utf8')) as Record<string, unknown>;
    expect(stored['version']).toBe(1);
    expect(stored['publicKey']).toBe(encodeBase64Url(first.publicKey));
    if (process.platform !== 'win32') expect(statSync(file).mode & 0o777).toBe(0o600);
  });

  it('refuses a damaged file instead of replacing the key phones subscribed with', async () => {
    const file = fileIn();
    await loadVapidKeys(file);
    const damaged = '{"version":1,"publicKey":"short","privateKey":"short"}';
    writeFileSync(file, damaged);
    await expect(loadVapidKeys(file)).rejects.toThrow('damaged VAPID keys');
    expect(readFileSync(file, 'utf8')).toBe(damaged);
  });
});
