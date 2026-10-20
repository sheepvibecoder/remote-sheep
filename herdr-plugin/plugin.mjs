// What the Herdr plugin runs: `start`, `stop` or `status` of the built agent.
//
// Herdr runs plugin commands with no shell and, on Windows, in a `\\?\C:\...` folder where Node
// cannot resolve a relative script (EISDIR on lstat 'C:'). So herdr-plugin.toml starts Node with
// a short inline loader that strips that prefix from HERDR_PLUGIN_ROOT, moves there and imports
// this file; from here every path is built from this file's own location. The agent owns the
// lifecycle itself (packages/agent/src/L3_periphery/background): this only finds and runs it.
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const COMMANDS = new Set(['start', 'stop', 'status']);

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const agent = join(root, 'packages', 'agent', 'dist', 'remote-sheep.js');
// `node -e <loader> start` leaves the command last on process.argv; so does `node plugin.mjs start`.
const command = process.argv.at(-1) ?? '';

if (!COMMANDS.has(command)) {
  console.error('usage: plugin.mjs start|stop|status');
  process.exitCode = 2;
} else if (!existsSync(agent)) {
  console.error('remote-sheep is not built: run `pnpm install` and `pnpm build` in ' + root);
  process.exitCode = 1;
} else {
  const result = spawnSync(process.execPath, [agent, command], {
    cwd: root,
    stdio: 'inherit',
    windowsHide: true,
  });
  if (result.error) console.error(result.error.message);
  process.exitCode = result.status ?? 1;
}
