// The port a start listens on: the PORT variable, else the saved port, else the first free one
// of the candidates, which is then saved.
//
// A saved port is never probed nor swapped for a free one: moving silently would break the
// address every paired phone keeps. If it is busy, the start fails and says how to change it.

import { listenPortCandidates, presetListenPort, type PortSource } from '../L1_domain/listen-port';
import type { PortProbe } from '../L1_domain/ports/port-probe';
import type { SavedPort } from '../L1_domain/ports/saved-port';

export interface ChosenPort {
  port: number;
  source: PortSource;
}

export interface ChooseListenPortOptions {
  /** The PORT variable, null when unset. */
  variable: number | null;
  saved: SavedPort;
  probe: PortProbe;
  candidates?: readonly number[];
}

export async function chooseListenPort(options: ChooseListenPortOptions): Promise<ChosenPort> {
  const preset = presetListenPort(options.variable, await options.saved.load());
  if (preset) return preset;

  const candidates = options.candidates ?? listenPortCandidates();
  for (const port of candidates) {
    if (await options.probe.isFree(port)) {
      await options.saved.save(port);
      return { port, source: 'picked' };
    }
  }
  throw new Error(
    'no free port from ' +
      String(candidates[0]) +
      ' to ' +
      String(candidates.at(-1)) +
      '; choose one with `remote-sheep port <n>`',
  );
}
