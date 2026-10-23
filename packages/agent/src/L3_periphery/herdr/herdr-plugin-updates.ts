// The plugin's update through Herdr: `herdr plugin update` fetches the commit the install asked
// for into a new installation folder and registers it (the built agent is committed, so there is
// no build step); nothing already running changes. So the agent then restarts through the
// plugin's `restart` action, which Herdr runs from the new installation, with the same state
// folder: the new build starts with the same data, port and relay. What Herdr prints is read as of Herdr 0.9.5 (src/cli/plugin.rs).

import { execFile } from 'node:child_process';
import type { PluginUpdate, PluginUpdates } from '../../L1_domain/ports/plugin-updates';

export const PLUGIN_ID = 'sheepvibecoder.remote-sheep';

export const LINKED_PLUGIN =
  'This plugin is linked from a folder on the computer (herdr plugin link), which Herdr does ' +
  'not update: run `git pull` in that folder (it holds the built agent; run `pnpm build` only if ' +
  'you changed the code), then restart the agent.';

export const TOO_OLD_HERDR =
  'This Herdr cannot update plugins yet: update Herdr on the computer, then try again.';

/** The update clones the repository, built agent included, which takes minutes on a slow link. */
const UPDATE_TIMEOUT_MS = 15 * 60_000;
const RESTART_TIMEOUT_MS = 60_000;

export interface CommandOutcome {
  /** The exit code; null when the command could not run or was stopped. */
  code: number | null;
  stdout: string;
  stderr: string;
  /** Why it could not run or was stopped; null when it ran to its end. */
  error: string | null;
}

export type HerdrCommand = (args: string[], timeoutMs: number) => Promise<CommandOutcome>;

/**
 * Runs Herdr with an argument array, never through a shell. `leading` goes before every command:
 * the script of a stand-in Herdr run by Node.
 */
export function herdrCommand(executable: string, leading: readonly string[] = []): HerdrCommand {
  return (args, timeoutMs) =>
    new Promise((resolve) => {
      execFile(
        executable,
        [...leading, ...args],
        { timeout: timeoutMs, windowsHide: true, maxBuffer: 16 * 1024 * 1024 },
        (err, stdout, stderr) => {
          if (!err) {
            resolve({ code: 0, stdout, stderr, error: null });
            return;
          }
          // A number is the exit code; a string (ENOENT, EACCES) means it never ran.
          const code = typeof err.code === 'number' ? err.code : null;
          const error = err.killed ? 'timed out' : code === null ? err.message : null;
          resolve({ code, stdout, stderr, error });
        },
      );
    });
}

/** Whether Herdr started this agent as its plugin: it hands every plugin command its root. */
export function runsAsPlugin(env: Readonly<Record<string, string | undefined>>): boolean {
  return Boolean(env['HERDR_PLUGIN_ROOT']);
}

export class HerdrPluginUpdates implements PluginUpdates {
  constructor(private readonly run: HerdrCommand) {}

  async update(): Promise<PluginUpdate> {
    // --yes: with no terminal Herdr refuses to ask for confirmation and stops.
    const outcome = await this.run(['plugin', 'update', PLUGIN_ID, '--yes'], UPDATE_TIMEOUT_MS);
    if (outcome.error !== null) throw new Error('could not run Herdr: ' + outcome.error);
    const said = outcome.stdout + '\n' + outcome.stderr;
    if (outcome.code === 0) return said.includes('is already up to date') ? 'current' : 'updated';
    if (said.includes('locally linked')) throw new Error(LINKED_PLUGIN);
    // An older Herdr answers an unknown plugin command with its usage, which has no update.
    if (said.includes('herdr plugin commands:') && !said.includes('plugin update')) {
      throw new Error(TOO_OLD_HERDR);
    }
    throw new Error('Herdr could not update the plugin: ' + lastLine(said));
  }

  async restart(): Promise<void> {
    const outcome = await this.run(
      ['plugin', 'action', 'invoke', PLUGIN_ID + '.restart'],
      RESTART_TIMEOUT_MS,
    );
    if (outcome.error !== null) throw new Error('could not run Herdr: ' + outcome.error);
    if (outcome.code !== 0) {
      throw new Error('Herdr could not restart the agent: ' + lastLine(outcome.stderr));
    }
  }
}

function lastLine(text: string): string {
  return (
    text
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .at(-1) ?? 'no reason given'
  );
}
