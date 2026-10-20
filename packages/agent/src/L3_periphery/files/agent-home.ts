// Where the agent keeps its keys, paired devices and photos.
//
// Run as a Herdr plugin, the data belongs in the state folder Herdr gives the plugin: the
// plugin root is a managed checkout that an update replaces. REMOTE_SHEEP_HOME still wins,
// so a test or a second agent can point at a scratch folder.

import { join } from 'node:path';

export function agentHome(
  env: Readonly<Record<string, string | undefined>>,
  userHome: string,
): string {
  return (
    env['REMOTE_SHEEP_HOME'] || env['HERDR_PLUGIN_STATE_DIR'] || join(userHome, '.remote-sheep')
  );
}
