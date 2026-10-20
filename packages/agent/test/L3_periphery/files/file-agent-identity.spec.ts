import { mkdtempSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { encodeBase64Url, generateKeyPair } from '@remote-sheep/protocol';
import {
  loadAgentKeyPair,
  readAgentPublicKey,
} from '../../../src/L3_periphery/files/file-agent-identity';

const fileIn = () => join(mkdtempSync(join(tmpdir(), 'sheep-key-')), 'home', 'agent-key.json');

describe('loadAgentKeyPair', () => {
  it('creates the key pair once, owner-only, and returns the same one afterwards', async () => {
    const file = fileIn();
    const first = await loadAgentKeyPair(file);
    const again = await loadAgentKeyPair(file);
    expect(again.publicKey).toEqual(first.publicKey);
    expect(again.secretKey).toEqual(first.secretKey);
    expect(first.publicKey).toEqual(generateKeyPair(first.secretKey).publicKey);
    expect(JSON.parse(readFileSync(file, 'utf8'))).toEqual({
      version: 1,
      secretKey: encodeBase64Url(first.secretKey),
    });
    if (process.platform !== 'win32') expect(statSync(file).mode & 0o777).toBe(0o600);
  });

  it('refuses a damaged key file instead of replacing the identity phones trust', async () => {
    const file = fileIn();
    await loadAgentKeyPair(file);
    writeFileSync(file, '{"version":1,"secretKey":"short"}');
    await expect(loadAgentKeyPair(file)).rejects.toThrow('damaged agent key');
    expect(readFileSync(file, 'utf8')).toBe('{"version":1,"secretKey":"short"}');
  });
});

describe('readAgentPublicKey', () => {
  it('reads the public key the agent made, and never makes one', async () => {
    const file = fileIn();
    expect(await readAgentPublicKey(file)).toBeNull();
    expect(() => readFileSync(file)).toThrow();
    const keys = await loadAgentKeyPair(file);
    expect(await readAgentPublicKey(file)).toEqual(keys.publicKey);
    writeFileSync(file, 'damaged');
    expect(await readAgentPublicKey(file)).toBeNull();
  });
});
