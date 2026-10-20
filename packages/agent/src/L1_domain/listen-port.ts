// Which port the agent listens on when nobody chose one.
//
// The phone keeps the agent's address, port included, so the port is picked once and kept: 3998
// when it is free, otherwise the next free one in a short range. The range stays small so a
// phone that lost the address can still be pointed at a handful of likely ports.

export const FIRST_LISTEN_PORT = 3998;
export const LAST_LISTEN_PORT = 4049;

/** Below 1024 a port needs administrator rights on most systems. */
const LOWEST_USER_PORT = 1024;
const HIGHEST_PORT = 65535;

/** Where the port in use came from. */
export type PortSource = 'variable' | 'saved' | 'picked';

/**
 * The port a start must use when one is chosen: the PORT variable wins over the saved port. null
 * when neither is set, and the start picks a free port.
 */
export function presetListenPort(
  variable: number | null,
  saved: number | null,
): { port: number; source: 'variable' | 'saved' } | null {
  if (variable !== null) return { port: variable, source: 'variable' };
  if (saved !== null) return { port: saved, source: 'saved' };
  return null;
}

/** The PORT variable as a port; null when unset or empty. A bad value throws, naming PORT. */
export function portFromVariable(value: string | undefined): number | null {
  if (!value) return null;
  const port = parseListenPort(value);
  if (port === null) {
    throw new Error('PORT must be a whole number from 1024 to 65535, not "' + value + '"');
  }
  return port;
}

/** The ports a first start tries, in order. */
export function listenPortCandidates(): number[] {
  return Array.from(
    { length: LAST_LISTEN_PORT - FIRST_LISTEN_PORT + 1 },
    (_, index) => FIRST_LISTEN_PORT + index,
  );
}

/** A port the owner may choose: a whole number from 1024 to 65535; null for anything else. */
export function parseListenPort(text: string): number | null {
  const trimmed = text.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const port = Number(trimmed);
  return isListenPort(port) ? port : null;
}

export function isListenPort(port: unknown): port is number {
  return (
    typeof port === 'number' &&
    Number.isInteger(port) &&
    port >= LOWEST_USER_PORT &&
    port <= HIGHEST_PORT
  );
}
