import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// The background agent has no console on Windows: a child started without windowsHide opens a
// console window that flashes on the owner's screen (seen with every Herdr call).

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..', '..', '..');

function sources(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sources(path);
    return entry.name.endsWith('.ts') ? [path] : [];
  });
}

describe('child processes', () => {
  it('are all started with windowsHide, in the agent and in the Herdr plugin', () => {
    const files = [
      ...sources(join(root, 'packages', 'agent', 'src')),
      join(root, 'herdr-plugin', 'plugin.mjs'),
    ];
    const calls: string[] = [];
    for (const file of files) {
      const text = readFileSync(file, 'utf8');
      for (const match of text.matchAll(/\b(spawn|spawnSync|execFile|execFileSync|exec|fork)\(/g)) {
        // The options follow the call within a few lines; a regex's own .exec( is no process.
        if (text.slice(Math.max(0, match.index - 1), match.index) === '.') continue;
        const call = text.slice(match.index, match.index + 400);
        calls.push(file);
        expect(call, file).toContain('windowsHide: true');
      }
    }
    expect(calls.length).toBeGreaterThanOrEqual(5);
  });
});
