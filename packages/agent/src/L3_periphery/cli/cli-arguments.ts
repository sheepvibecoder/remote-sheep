// The command line of `remote-sheep`: which of its jobs to do.

import { parseListenPort } from '../../L1_domain/listen-port';

export type Command =
  /** `background`: launched by `start`, so no pairing link goes into the log. */
  | { kind: 'serve'; background: boolean }
  | { kind: 'qr' }
  | { kind: 'start' }
  | { kind: 'stop' }
  | { kind: 'status' }
  | { kind: 'devices' }
  | { kind: 'revoke'; id: string }
  | { kind: 'relay-set'; url: string; code: string }
  | { kind: 'relay-show' }
  | { kind: 'relay-off' }
  | { kind: 'port-show' }
  | { kind: 'port-set'; port: number }
  | { kind: 'port-auto' }
  | { kind: 'help' }
  | { kind: 'error'; message: string };

export const USAGE = `Usage:
  remote-sheep               serve the phone app and print a QR code to pair a phone
                             (press Enter for a new QR code; each one pairs one phone
                             and expires after 5 minutes)
  remote-sheep qr            ask the running agent for a new QR code and pairing links,
                             including one for a browser on this PC (127.0.0.1); Enter
                             shows a new one, q or Esc closes it and the agent keeps running
  remote-sheep devices       list paired phones: id, paired, last used, expires
  remote-sheep revoke <id>   unpair a phone; a running agent disconnects it within 5 seconds
  remote-sheep --help        show this help

To keep the agent running with no window (the Herdr plugin does this for you):
  remote-sheep start         start it in the background; does nothing if it already runs;
                             pair with remote-sheep qr
  remote-sheep stop          stop the agent started with remote-sheep start
  remote-sheep status        say whether it runs, with its PID, port and log file

The first start listens on port 3999, or the next free one up to 4049, and saves it so the
phone's address stays the same:
  remote-sheep port          show the port and where it comes from
  remote-sheep port <n>      save another port (1024-65535); restart the agent to use it:
                             remote-sheep stop, then remote-sheep start (or restart Herdr)
  remote-sheep port auto     forget the saved port; the next start picks a free one again
The environment variable PORT still overrides the saved port when set.

To also serve phones outside this network, save your relay once:
  remote-sheep relay set <url> <code>   https URL of your relay and the access code its owner
                                        issued to this agent; every start then uses it
  remote-sheep relay                    show the saved relay (the code is masked)
  remote-sheep relay off                forget it; the agent serves the local network only
With a relay the agent can also notify phones when a session finishes (opt-in on the phone).
The environment variables REMOTE_SHEEP_RELAY and REMOTE_SHEEP_RELAY_CODE still work and
override the saved relay when set.

A pairing expires 24 hours after its last use or 7 days after it was made,
whichever comes first; the phone then asks for a new QR code.`;

export function parseArguments(args: readonly string[]): Command {
  const [command = 'serve', ...rest] = args;
  switch (command) {
    case 'serve':
      // `--background` is how `start` launches the agent; people just run `remote-sheep`.
      if (rest.length === 1 && rest[0] === '--background')
        return { kind: 'serve', background: true };
      return rest.length
        ? { kind: 'error', message: 'serve takes no arguments' }
        : { kind: 'serve', background: false };
    case '--help':
    case '-h':
    case 'help':
      return { kind: 'help' };
    case 'qr':
    case 'start':
    case 'stop':
    case 'status':
    case 'devices':
      return rest.length
        ? { kind: 'error', message: command + ' takes no arguments' }
        : { kind: command };
    case 'revoke': {
      const [id, ...extra] = rest;
      if (id === undefined) {
        return { kind: 'error', message: 'revoke needs a device id (see `remote-sheep devices`)' };
      }
      if (extra.length) return { kind: 'error', message: 'revoke takes one device id' };
      return { kind: 'revoke', id };
    }
    case 'relay': {
      const [sub, ...args] = rest;
      if (sub === undefined) return { kind: 'relay-show' };
      if (sub === 'off') {
        return args.length
          ? { kind: 'error', message: 'relay off takes no arguments' }
          : { kind: 'relay-off' };
      }
      if (sub === 'set') {
        const [url, code] = args;
        if (url === undefined || code === undefined || args.length > 2) {
          return { kind: 'error', message: 'relay set needs a relay URL and an access code' };
        }
        return { kind: 'relay-set', url, code };
      }
      return {
        kind: 'error',
        message:
          'unknown relay command: ' +
          sub +
          ' (use `relay`, `relay set <url> <code>` or `relay off`)',
      };
    }
    case 'port': {
      const [value, ...extra] = rest;
      if (value === undefined) return { kind: 'port-show' };
      if (extra.length) {
        return { kind: 'error', message: 'port takes one value: a port number or `auto`' };
      }
      if (value === 'auto') return { kind: 'port-auto' };
      const port = parseListenPort(value);
      return port === null
        ? { kind: 'error', message: 'port needs a whole number from 1024 to 65535, or `auto`' }
        : { kind: 'port-set', port };
    }
    default:
      return { kind: 'error', message: 'unknown command: ' + command };
  }
}
