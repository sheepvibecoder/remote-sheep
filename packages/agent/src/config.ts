// Paths and tuning in one place, so no module invents its own.
//
// Everything the agent writes lives in ~/.remote-sheep (or the state folder Herdr gives
// the plugin), never next to the code: the agent key and certificate are secrets, the
// paired devices decide who may drive the panes, and photos are private.

import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { agentHome } from './L3_periphery/files/agent-home';
import { herdrExecutable } from './L3_periphery/herdr/herdr-multiplexer';
import { resolveRelaySettings } from './L3_periphery/relay/relay-settings-file';

// A .env in the folder the agent starts from saves typing the same variables on every
// start. Node never overrides a variable already set, so the shell still wins.
if (existsSync('.env')) process.loadEnvFile('.env');

const home = agentHome(process.env, homedir());
const relayFile = join(home, 'relay.json');

// Optional: the variables (which override) or `remote-sheep relay set`; with neither the
// agent serves the LAN only. A damaged relay.json stops the start here, naming the file.
const relay = resolveRelaySettings(relayFile, process.env);
const claudeHome = join(homedir(), '.claude');

export const config = {
  /** The PORT variable as typed, which overrides the saved port; checked by `portFromVariable`. */
  portVariable: process.env['PORT'],
  /** The port saved by the first start or `remote-sheep port <n>`. */
  portFile: join(home, 'port.json'),
  herdr: herdrExecutable(process.env, process.platform),

  /** null when no relay is configured. */
  relay,

  home,
  relayFile,
  settingsFile: join(home, 'settings.json'),
  agentKeyFile: join(home, 'agent-key.json'),
  vapidFile: join(home, 'vapid.json'),
  devicesFile: join(home, 'devices.json'),
  certFile: join(home, 'cert.pem'),
  keyFile: join(home, 'key.pem'),
  uploadsDir: join(home, 'uploads'),
  maxUploadBytes: 12 * 1024 * 1024,

  claudeSessionsDir: join(claudeHome, 'sessions'),
  claudeProjectsDir: join(claudeHome, 'projects'),
  // A single turn can carry very large tool results, so a small window would
  // reach back only a message or two.
  tailBytes: 2 * 1024 * 1024,
  maxMessages: 40,

  listIntervalMs: 2000,
  terminalIntervalMs: 1500,
  debounceMs: 150,
  // How often open phones are re-checked: under the 5 s promised for a revocation,
  // with room for reading the devices file.
  pairingCheckIntervalMs: 4000,
};
