// What the plugin's start, restart and stop say in Herdr: a notification, since an action's own
// output is easy to miss and a silent start looks like one that did not work. A start that
// worked names the address to open in this PC's browser, which pairs it at once.
//
// A notification is a courtesy: when Herdr cannot show it, the action still succeeds.

import type { LifecycleAnnouncer, StartResult } from '../background/background-agent';
import type { HerdrCommand } from './herdr-plugin-updates';

export interface HerdrNotice {
  title: string;
  body: string;
}

// Short: a Herdr that hangs must not hold up the start or stop it reports on.
const NOTICE_TIMEOUT_MS = 2500;
const MAX_REASON = 120;

export const STOP_NOTICE: HerdrNotice = {
  title: 'remote-sheep stopped',
  body: 'start it again from Herdr',
};

export function startNotice(result: StartResult): HerdrNotice {
  if (result.port !== null && (result.kind === 'started' || result.kind === 'already-running')) {
    return { title: 'remote-sheep ✓', body: 'open http://localhost:' + String(result.port) };
  }
  if (result.kind === 'failed') {
    return { title: 'remote-sheep could not start', body: shortReason(result.message) };
  }
  return {
    title: 'remote-sheep could not start',
    body: 'it runs but does not listen yet; see remote-sheep status',
  };
}

/** The plugin's lifecycle as Herdr notifications. */
export function herdrAnnouncer(run: HerdrCommand): LifecycleAnnouncer {
  return {
    started: (result) => showNotice(run, startNotice(result)),
    stopped: () => showNotice(run, STOP_NOTICE),
  };
}

/** Shows the notice; never rejects, whatever Herdr does. */
export async function showNotice(run: HerdrCommand, notice: HerdrNotice): Promise<void> {
  try {
    await run(['notification', 'show', notice.title, '--body', notice.body], NOTICE_TIMEOUT_MS);
  } catch {
    // Herdr could not show it; the action's outcome stands without it.
  }
}

/** The last line of a failure, where the agent's log says why; cut to fit a notification. */
function shortReason(message: string): string {
  const last =
    message
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .at(-1) ?? 'no reason given';
  return last.length > MAX_REASON ? last.slice(0, MAX_REASON - 1) + '…' : last;
}
