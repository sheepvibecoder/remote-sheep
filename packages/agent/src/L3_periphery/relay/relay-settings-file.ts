// Where the relay settings live between starts: ~/.remote-sheep/relay.json, written by
// `remote-sheep relay set` so the URL and code are typed once, not on every start.
//
// The access code is a secret, so the file is owner-only and replaced atomically: a crash
// mid-write must never leave half a code that the next start reads as "damaged".

import { readFileSync } from 'node:fs';
import { mkdir, rename, rm, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { parseRelaySettings, type RelaySettings } from './relay-settings';

const hasCode = (error: unknown, code: string) =>
  error instanceof Error && 'code' in error && error.code === code;

/** Validates like the environment variables do, then writes the file. Returns what it stored. */
export async function saveRelaySettingsFile(
  file: string,
  url: string,
  code: string,
): Promise<RelaySettings> {
  const settings = parseRelaySettings(url, code);
  if (!settings) throw new Error('a relay URL and an access code are required');
  // Owner-only on POSIX; on Windows Node ignores modes and the profile folder's access applies.
  await mkdir(dirname(file), { recursive: true, mode: 0o700 });
  const temp = file + '.' + String(process.pid) + '.tmp';
  try {
    await writeFile(temp, JSON.stringify(settings) + '\n', { encoding: 'utf8', mode: 0o600 });
    await rename(temp, file);
  } catch (error) {
    await rm(temp, { force: true });
    throw error;
  }
  return settings;
}

/** null when there is no file; a damaged one is reported with its path, never ignored. */
export function loadRelaySettingsFile(file: string): RelaySettings | null {
  let text: string;
  try {
    text = readFileSync(file, 'utf8');
  } catch (error) {
    if (hasCode(error, 'ENOENT')) return null;
    throw error;
  }
  const damaged = (): never => {
    throw new Error('damaged relay settings ' + file + ' (fix it, or `remote-sheep relay off`)');
  };
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return damaged();
  }
  const fields = typeof json === 'object' && json !== null ? (json as Record<string, unknown>) : {};
  const { url, code } = fields;
  if (typeof url !== 'string' || typeof code !== 'string') return damaged();
  try {
    return parseRelaySettings(url, code) ?? damaged();
  } catch {
    return damaged();
  }
}

/** True when a file was there to remove. */
export async function removeRelaySettingsFile(file: string): Promise<boolean> {
  try {
    await rm(file);
    return true;
  } catch (error) {
    if (hasCode(error, 'ENOENT')) return false;
    throw error;
  }
}

/** Variables win when either is set (unchanged behaviour); otherwise the saved file. */
export function resolveRelaySettings(
  file: string,
  env: Readonly<Record<string, string | undefined>>,
): RelaySettings | null {
  const url = env['REMOTE_SHEEP_RELAY'];
  const code = env['REMOTE_SHEEP_RELAY_CODE'];
  if (url?.trim() || code?.trim()) return parseRelaySettings(url, code);
  return loadRelaySettingsFile(file);
}

/** Enough of the code to recognise it, not enough to use it. */
export function maskCode(code: string): string {
  return code.slice(0, 2) + '…';
}
