// The agent's static X25519 key pair: its public half is in every QR, and a
// phone accepts an agent only if it proves it holds the private half.
//
// Made once on this PC and kept in ~/.remote-sheep, owner-only; it never
// leaves. A damaged file is reported, never replaced: a new key would silently
// break every pairing, and the person should see why.

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import {
  decodeBase64Url,
  encodeBase64Url,
  generateKeyPair,
  type KeyPair,
} from '@remote-sheep/protocol';

const FORMAT_VERSION = 1;

function parse(file: string, text: string): KeyPair {
  let json: unknown = null;
  try {
    json = JSON.parse(text);
  } catch {
    // Reported below with the other shapes that are not a key file.
  }
  const fields = typeof json === 'object' && json !== null ? (json as Record<string, unknown>) : {};
  const secret =
    fields['version'] === FORMAT_VERSION && typeof fields['secretKey'] === 'string'
      ? decodeBase64Url(fields['secretKey'])
      : null;
  if (secret?.length !== 32) throw new Error('damaged agent key ' + file);
  return generateKeyPair(secret);
}

const hasCode = (error: unknown, code: string) =>
  error instanceof Error && 'code' in error && error.code === code;

/**
 * The public key of the agent that runs from this data folder, read only: `remote-sheep qr`
 * checks the running agent against it and must never make a key. null when there is none.
 */
export async function readAgentPublicKey(file: string): Promise<Uint8Array | null> {
  try {
    return parse(file, await readFile(file, 'utf8')).publicKey;
  } catch {
    return null;
  }
}

export async function loadAgentKeyPair(file: string): Promise<KeyPair> {
  try {
    return parse(file, await readFile(file, 'utf8'));
  } catch (error) {
    if (!hasCode(error, 'ENOENT')) throw error;
  }
  const keys = generateKeyPair();
  // Owner-only on POSIX; on Windows Node ignores modes and the profile folder's access applies.
  await mkdir(dirname(file), { recursive: true, mode: 0o700 });
  const text = JSON.stringify({
    version: FORMAT_VERSION,
    secretKey: encodeBase64Url(keys.secretKey),
  });
  // `wx`: if another process made a key in the meantime, its key wins and is read back.
  try {
    await writeFile(file, text + '\n', { encoding: 'utf8', mode: 0o600, flag: 'wx' });
  } catch (error) {
    if (hasCode(error, 'EEXIST')) {
      return parse(file, await readFile(file, 'utf8'));
    }
    throw error;
  }
  return keys;
}
