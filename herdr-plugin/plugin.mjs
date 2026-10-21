// What the Herdr plugin runs: `start`, `stop`, `restart`, `status`, `qr` or `relay` of the built
// agent, and
// `open-qr` or `open-relay`, which ask Herdr to open the plugin's pane of that name. `restart` is
// also how an update from the app reaches the new build: Herdr runs it from the new installation.
//
// Herdr runs plugin commands with no shell and, on Windows, in a `\\?\C:\...` folder where Node
// cannot resolve a relative script (EISDIR on lstat 'C:'). So herdr-plugin.toml starts Node with
// a short inline loader that strips that prefix from HERDR_PLUGIN_ROOT, moves there and imports
// this file; from here every path is built from this file's own location. The agent owns the
// lifecycle itself (packages/agent/src/L3_periphery/background): this only finds and runs it.
// The `qr` pane runs `remote-sheep qr`, which asks the running agent for a new pairing over its
// loopback control channel; closing the pane ends that command, never the agent. The `relay` pane
// runs `remote-sheep relay change`, which asks for the relay URL and access code and hands them to
// the running agent the same way.
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// What each command runs in the built agent.
const COMMANDS = new Map([
  ['start', ['start']],
  ['stop', ['stop']],
  ['restart', ['restart']],
  ['status', ['status']],
  ['qr', ['qr']],
  ['relay', ['relay', 'change']],
]);
const PANES = new Map([
  ['open-qr', 'qr'],
  ['open-relay', 'relay'],
]);
const PLUGIN_ID = 'sheepvibecoder.remote-sheep';
// Herdr runs the [[startup]] hook only when its server starts, not on `plugin install`, so right
// after an install nothing is running yet. The panes start the agent first (a no-op when it
// already runs), so install, then Show pairing QR, works with no extra step.
const NEEDS_AGENT = new Set(['qr', 'relay']);

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const agent = join(root, 'packages', 'agent', 'dist', 'remote-sheep.js');
// `node -e <loader> start` leaves the command last on process.argv; so does `node plugin.mjs start`.
const command = process.argv.at(-1) ?? '';

const pane = PANES.get(command);
const args = COMMANDS.get(command);

if (pane) {
  // An action's output is not a terminal, so it cannot show a QR or ask a question itself; it
  // opens the pane that does.
  const herdr = process.env.HERDR_BIN_PATH || 'herdr';
  const result = spawnSync(
    herdr,
    ['plugin', 'pane', 'open', '--plugin', PLUGIN_ID, '--entrypoint', pane],
    { stdio: 'inherit', windowsHide: true },
  );
  if (result.error) console.error(result.error.message);
  process.exitCode = result.status ?? 1;
} else if (!args) {
  console.error('usage: plugin.mjs start|stop|restart|status|qr|relay|open-qr|open-relay');
  process.exitCode = 2;
} else if (!existsSync(agent)) {
  console.error('remote-sheep is not built: run `pnpm install` and `pnpm build` in ' + root);
  process.exitCode = 1;
} else {
  const started = NEEDS_AGENT.has(command) ? runAgent(['start']) : 0;
  process.exitCode = started === 0 ? runAgent(args) : started;
}

function runAgent(agentArgs) {
  const result = spawnSync(process.execPath, [agent, ...agentArgs], {
    cwd: root,
    stdio: 'inherit',
    windowsHide: true,
  });
  if (result.error) console.error(result.error.message);
  return result.status ?? 1;
}
