// What `remote-sheep port` and a start on a busy port tell the owner about the port.

import {
  FIRST_LISTEN_PORT,
  LAST_LISTEN_PORT,
  presetListenPort,
  type PortSource,
} from '../../L1_domain/listen-port';
import type { PortProbe } from '../../L1_domain/ports/port-probe';

/** How to get off a busy port, depending on who chose it. */
export function busyPortHint(source: PortSource): string {
  return source === 'variable'
    ? 'set PORT to another port, or unset it'
    : 'choose another with `remote-sheep port <n>`, or `remote-sheep port auto` to pick a free one';
}

export interface PortSettings {
  variable: number | null;
  saved: number | null;
  file: string;
}

/** The port the next start listens on, and where it comes from. */
export function describePort({ variable, saved, file }: PortSettings): string {
  const preset = presetListenPort(variable, saved);
  if (preset?.source === 'variable') {
    return (
      'Port ' +
      String(preset.port) +
      ', from the PORT variable' +
      (saved === null ? '.' : ' (it overrides the saved port ' + String(saved) + ').')
    );
  }
  if (preset) return 'Port ' + String(preset.port) + ', saved in ' + file + '.';
  return (
    'No port saved yet: the next start takes the first free port from ' +
    String(FIRST_LISTEN_PORT) +
    ' to ' +
    String(LAST_LISTEN_PORT) +
    ' and saves it.'
  );
}

/**
 * Why `remote-sheep port <n>` must not save this port: another program holds it, and the next
 * start would fail on it or share it. null when it is free, or is the running agent's own port.
 */
export async function refusePortChoice(
  port: number,
  probe: PortProbe,
  runningPort: number | null,
): Promise<string | null> {
  if (port === runningPort || (await probe.isFree(port))) return null;
  return (
    'Port ' +
    String(port) +
    ' is in use on this computer; choose another, or `remote-sheep port auto`.'
  );
}
