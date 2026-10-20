// Where the running agent's control channel is: control.json in its data folder, with the
// loopback port and the secret a caller must present.
//
// Whoever reads the secret can ask for a pairing, so the file is owner-only and replaced
// atomically like the relay settings; a reader never sees half a secret.

import { readFileSync } from 'node:fs';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

export interface ControlAddress {
  readonly port: number;
  readonly secret: string;
}

export async function saveControlFile(file: string, address: ControlAddress): Promise<void> {
  // Owner-only on POSIX; on Windows Node ignores modes and the profile folder's access applies.
  await mkdir(dirname(file), { recursive: true, mode: 0o700 });
  const temp = file + '.' + String(process.pid) + '.tmp';
  try {
    await writeFile(temp, JSON.stringify(address) + '\n', { encoding: 'utf8', mode: 0o600 });
    await rename(temp, file);
  } catch (error) {
    await rm(temp, { force: true });
    throw error;
  }
}

/** null when there is no usable file: either way, there is no agent to ask. */
export function loadControlFile(file: string): ControlAddress | null {
  try {
    return parseControlAddress(JSON.parse(readFileSync(file, 'utf8')));
  } catch {
    return null;
  }
}

/** Removes the file only while it still names this agent, never a newer agent's. */
export async function removeControlFile(file: string, secret: string): Promise<void> {
  let text: string;
  try {
    text = await readFile(file, 'utf8');
  } catch {
    return;
  }
  try {
    if (parseControlAddress(JSON.parse(text))?.secret !== secret) return;
  } catch {
    return;
  }
  await rm(file, { force: true });
}

function parseControlAddress(value: unknown): ControlAddress | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
  const { port, secret } = value as Record<string, unknown>;
  if (typeof port !== 'number' || !Number.isInteger(port) || port < 1 || port > 65535) return null;
  if (typeof secret !== 'string' || !secret) return null;
  return { port, secret };
}
