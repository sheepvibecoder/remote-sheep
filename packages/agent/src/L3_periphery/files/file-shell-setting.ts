// The consoles switch, kept in ~/.remote-sheep/settings.json so a restart does not undo it.
//
// Nothing chosen yet means on. A file that exists but cannot be read means off: a damaged file
// must never switch a command-running feature on behind the owner's back, and it is left as it
// is until the owner chooses again.

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { ShellSetting } from '../../L1_domain/ports/shell-setting';

const FORMAT_VERSION = 1;

type Fields = Record<string, unknown>;

const hasCode = (error: unknown, code: string) =>
  error instanceof Error && 'code' in error && error.code === code;

/** The stored fields, or null when the file is not a settings file this version understands. */
function parse(text: string): Fields | null {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return null;
  }
  if (typeof json !== 'object' || json === null || Array.isArray(json)) return null;
  const fields = json as Fields;
  if (fields['version'] !== FORMAT_VERSION) return null;
  if (fields['shells'] !== undefined && typeof fields['shells'] !== 'boolean') return null;
  return fields;
}

export async function loadShellSetting(file: string): Promise<ShellSetting> {
  let on = true;
  let fields: Fields = {};
  try {
    const stored = parse(await readFile(file, 'utf8'));
    if (stored) {
      fields = stored;
      on = stored['shells'] !== false;
    } else {
      on = false;
    }
  } catch (error) {
    if (!hasCode(error, 'ENOENT')) throw error;
  }
  return {
    enabled: () => on,
    async set(next: boolean) {
      await mkdir(dirname(file), { recursive: true, mode: 0o700 });
      const text = JSON.stringify({ ...fields, version: FORMAT_VERSION, shells: next });
      await writeFile(file, text + '\n', { encoding: 'utf8', mode: 0o600 });
      fields = { ...fields, version: FORMAT_VERSION, shells: next };
      on = next;
    },
  };
}
