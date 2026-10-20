// Settings → Port: a paired device reads the port the agent listens on and moves it.
//
// Moving means listening elsewhere, which only a new process can do, so the agent saves the port
// and restarts itself the way an update does: through the Herdr plugin's `restart` action. A copy
// run by hand cannot restart itself and is told how to do it on the computer instead. A busy
// port is refused before it is saved, or the restart would leave no agent running at all.

import type { PortState } from '@remote-sheep/protocol';
import { isListenPort, type PortSource } from '../L1_domain/listen-port';
import type { PortProbe } from '../L1_domain/ports/port-probe';
import type { PortRequests } from '../L1_domain/ports/port-requests';
import type { SavedPort } from '../L1_domain/ports/saved-port';

export const NOT_A_PLUGIN_PORT =
  'This agent does not run as the Herdr plugin, so it cannot restart itself. On the computer, ' +
  'run `remote-sheep port <n>` (or `remote-sheep port auto`), then restart the agent.';

export const PORT_FROM_VARIABLE =
  'The PORT variable sets the port on the computer and wins over any saved one: change or unset ' +
  'it there, then restart the agent.';

export const BAD_PORT = 'a port is a whole number from 1024 to 65535';

export const ALREADY_RESTARTING = 'the agent is already restarting';

export interface PortChangerOptions {
  /** The port this agent listens on and where it came from. */
  current: { port: number; source: PortSource };
  /** The PORT variable, null when unset. */
  variable: number | null;
  saved: SavedPort;
  probe: PortProbe;
  /** Starts a new agent in place of this one (the plugin's restart); null when it cannot. */
  restart: (() => Promise<void>) | null;
  /** How long the restart waits, so the device reads the answer before the link drops. */
  restartDelayMs: number;
  log?: (message: string) => void;
}

export class PortChanger implements PortRequests {
  private restarting = false;

  constructor(private readonly options: PortChangerOptions) {}

  async portState(): Promise<PortState> {
    const { current, variable, restart } = this.options;
    // PORT wins over everything else, so it is the reason even for a copy run by hand.
    const reason =
      variable !== null ? PORT_FROM_VARIABLE : restart === null ? NOT_A_PLUGIN_PORT : null;
    return {
      port: current.port,
      source: current.source,
      saved: await this.options.saved.load(),
      canChange: reason === null,
      reason,
      restarting: this.restarting,
    };
  }

  async changePort(set: number | 'auto'): Promise<PortState> {
    const restart = this.options.restart;
    if (this.options.variable !== null) throw new Error(PORT_FROM_VARIABLE);
    if (!restart) throw new Error(NOT_A_PLUGIN_PORT);
    if (this.restarting) throw new Error(ALREADY_RESTARTING);
    if (set === 'auto') {
      await this.options.saved.forget();
    } else {
      if (!isListenPort(set)) throw new Error(BAD_PORT);
      // Already listening there: keeping it needs no restart (and the probe would call it busy).
      if (set === this.options.current.port) {
        if ((await this.options.saved.load()) !== set) await this.options.saved.save(set);
        return this.portState();
      }
      if (!(await this.options.probe.isFree(set))) {
        throw new Error('port ' + String(set) + ' is in use on the computer; choose another');
      }
      await this.options.saved.save(set);
    }
    this.restarting = true;
    // The answer goes out first; restart() never rejects unhandled, so nothing waits for it.
    setTimeout(() => {
      restart().catch((err: unknown) => {
        this.restarting = false;
        this.options.log?.(
          'could not restart on the new port: ' +
            (err instanceof Error ? err.message : String(err)),
        );
      });
    }, this.options.restartDelayMs);
    return this.portState();
  }
}
