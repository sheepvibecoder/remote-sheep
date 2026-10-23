// The agent's own update, asked for from a paired device (Settings → Update).
//
// Only an agent started by the Herdr plugin can update itself: Herdr fetches the new version,
// built agent included, then the agent restarts into it. A copy of the code run by hand is
// someone's checkout, which this never touches; the person is told how to update it instead. One
// update runs at a time. Herdr takes minutes, longer than a device waits for an answer, so a run
// is answered at once and the device reads the state until the outcome appears. The restart ends this process
// and drops the link; a restart that fails is recorded as a failed update.

import type { UpdateState } from '@remote-sheep/protocol';
import type { PluginUpdates, UpdateRequests } from '../L1_domain/ports/plugin-updates';

export const NOT_A_PLUGIN =
  'This agent does not run as the Herdr plugin, so it cannot update itself. On the computer, ' +
  'run `herdr plugin update sheepvibecoder.remote-sheep`, or `git pull` in a copy of the code ' +
  '(it holds the built agent; run `pnpm build` only if you changed the code), then restart the ' +
  'agent.';

export const ALREADY_UPDATING = 'an update is already running on this computer';

export const RESTART_FAILED = 'the update is installed but the agent could not restart into it: ';

export interface AgentUpdaterOptions {
  /** The version this agent runs. */
  version: string;
  /** The plugin it runs as; null when it was started some other way. */
  plugin: PluginUpdates | null;
  /** How long the restart waits after the outcome, so a device can read it first. */
  restartDelayMs: number;
  log?: (message: string) => void;
}

type Ended = Pick<UpdateState, 'outcome' | 'error'>;

export class AgentUpdater implements UpdateRequests {
  private updating = false;
  private ended: Ended = {};

  constructor(private readonly options: AgentUpdaterOptions) {}

  updateState(): UpdateState {
    return {
      version: this.options.version,
      plugin: this.options.plugin !== null,
      updating: this.updating,
      ...this.ended,
    };
  }

  runUpdate(): Promise<UpdateState> {
    const plugin = this.options.plugin;
    if (!plugin) return Promise.reject(new Error(NOT_A_PLUGIN));
    if (this.updating) return Promise.reject(new Error(ALREADY_UPDATING));
    this.updating = true;
    this.ended = {};
    // The outcome is read through updateState; update() never rejects, so nothing waits for it.
    void this.update(plugin);
    return Promise.resolve(this.updateState());
  }

  private async update(plugin: PluginUpdates): Promise<void> {
    try {
      const outcome = await plugin.update();
      this.ended = { outcome };
    } catch (err) {
      this.fail(message(err));
      return;
    }
    if (this.ended.outcome === 'current') {
      this.updating = false;
      return;
    }
    // Still updating until this process ends, so a second request cannot start another.
    setTimeout(() => {
      plugin.restart().catch((err: unknown) => {
        this.fail(RESTART_FAILED + message(err));
        this.options.log?.(RESTART_FAILED + message(err));
      });
    }, this.options.restartDelayMs);
  }

  private fail(error: string): void {
    this.updating = false;
    this.ended = { outcome: 'failed', error };
  }
}

function message(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
