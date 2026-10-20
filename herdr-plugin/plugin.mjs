// What the Herdr plugin runs: `start`, `stop`, `status` or `qr` of the built agent, and
// `open-qr`, which asks Herdr to open the plugin's `qr` pane.
//
// Herdr runs plugin commands with no shell and, on Windows, in a `\\?\C:\...` folder where Node
// cannot resolve a relative script (EISDIR on lstat 'C:'). So herdr-plugin.toml starts Node with
// a short inline loader that strips that prefix from HERDR_PLUGIN_ROOT, moves there and imports
// this file; from here every path is built from this file's own location. The agent owns the
// lifecycle itself (packages/agent/src/L3_periphery/background): this only finds and runs it.
// The `qr` pane runs `remote-sheep qr`, which asks the running agent for a new pairing over its
// loopback control channel; closing the pane ends that command, never the agent.
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const COMMANDS = new Set(['start', 'stop', 'status', 'qr']);
const PLUGIN_ID = 'sheepvibecoder.remote-sheep';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const agent = join(root, 'packages', 'agent', 'dist', 'remote-sheep.js');
// `node -e <loader> start` leaves the command last on process.argv; so does `node plugin.mjs start`.
const command = process.argv.at(-1) ?? '';

if (command === 'open-qr') {
  // An action cannot show a QR itself (its output is not a terminal); it opens the pane that does.
  const herdr = process.env.HERDR_BIN_PATH || 'herdr';
  const result = spawnSync(
    herdr,
    ['plugin', 'pane', 'open', '--plugin', PLUGIN_ID, '--entrypoint', 'qr'],
    { stdio: 'inherit', windowsHide: true },
  );
  if (result.error) console.error(result.error.message);
  process.exitCode = result.status ?? 1;
} else if (!COMMANDS.has(command)) {
  console.error('usage: plugin.mjs start|stop|status|qr|open-qr');
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
