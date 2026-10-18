// The agent's VAPID key pair (P-256): its public half is what phones subscribe to, so a new
// key would silently orphan every subscription.
//
// Made once on this PC and kept in ~/.remote-sheep, owner-only. Like the agent key, a damaged
// file is reported, never replaced.

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { decodeBase64Url, encodeBase64Url } from '@remote-sheep/protocol';
import { newVapidKeys, vapidKeysFrom, vapidSecret, type VapidKeys } from '../push/web-push-vapid';

const FORMAT_VERSION = 1;

function parse(file: string, text: string): VapidKeys {
  let json: unknown = null;
  try {
    json = JSON.parse(text);
  } catch {
    // Reported below with the other shapes that are not a key file.
  }
  const fields = typeof json === 'object' && json !== null ? (json as Record<string, unknown>) : {};
  const ok = fields['version'] === FORMAT_VERSION;
  const secret =
    ok && typeof fields['privateKey'] === 'string' ? decodeBase64Url(fields['privateKey']) : null;
  const point =
    ok && typeof fields['publicKey'] === 'string' ? decodeBase64Url(fields['publicKey']) : null;
  if (secret?.length !== 32 || point?.length !== 65) throw new Error('damaged VAPID keys ' + file);
  try {
    return vapidKeysFrom(secret, point);
  } catch {
    throw new Error('damaged VAPID keys ' + file);
  }
}

const hasCode = (error: unknown, code: string) =>
  error instanceof Error && 'code' in error && error.code === code;

export async function loadVapidKeys(file: string): Promise<VapidKeys> {
  try {
    return parse(file, await readFile(file, 'utf8'));
  } catch (error) {
    if (!hasCode(error, 'ENOENT')) throw error;
  }
  const keys = newVapidKeys();
  // Owner-only on POSIX; on Windows Node ignores modes and the profile folder's access applies.
  await mkdir(dirname(file), { recursive: true, mode: 0o700 });
  const text = JSON.stringify({
    version: FORMAT_VERSION,
    publicKey: encodeBase64Url(keys.publicKey),
    privateKey: encodeBase64Url(vapidSecret(keys)),
  });
  // `wx`: if another process made a key in the meantime, its key wins and is read back.
  try {
    await writeFile(file, text + '\n', { encoding: 'utf8', mode: 0o600, flag: 'wx' });
  } catch (error) {
    if (hasCode(error, 'EEXIST')) return parse(file, await readFile(file, 'utf8'));
    throw error;
  }
  return keys;
}
