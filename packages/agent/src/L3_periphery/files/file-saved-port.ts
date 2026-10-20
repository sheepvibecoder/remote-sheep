// The saved port, kept in port.json in the agent's data folder.
//
// Replaced atomically, so a crash mid-write never leaves half a number behind. A file that cannot
// be read as a port counts as none: the next start picks a free port and writes a good file.

import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { isListenPort } from '../../L1_domain/listen-port';
import type { SavedPort } from '../../L1_domain/ports/saved-port';

const hasCode = (error: unknown, code: string) =>
  error instanceof Error && 'code' in error && error.code === code;

export class FileSavedPort implements SavedPort {
  constructor(private readonly file: string) {}

  async load(): Promise<number | null> {
    let text: string;
    try {
      text = await readFile(this.file, 'utf8');
    } catch (error) {
      if (hasCode(error, 'ENOENT')) return null;
      throw error;
    }
    try {
      const json: unknown = JSON.parse(text);
      if (typeof json !== 'object' || json === null) return null;
      const { port } = json as Record<string, unknown>;
      return isListenPort(port) ? port : null;
    } catch {
      return null;
    }
  }

  async save(port: number): Promise<void> {
    await mkdir(dirname(this.file), { recursive: true, mode: 0o700 });
    const temp = this.file + '.' + String(process.pid) + '.tmp';
    try {
      await writeFile(temp, JSON.stringify({ port }) + '\n', 'utf8');
      await rename(temp, this.file);
    } catch (error) {
      await rm(temp, { force: true });
      throw error;
    }
  }

  /** True when a port was saved. */
  async forget(): Promise<boolean> {
    try {
      await rm(this.file);
      return true;
    } catch (error) {
      if (hasCode(error, 'ENOENT')) return false;
      throw error;
    }
  }
}
