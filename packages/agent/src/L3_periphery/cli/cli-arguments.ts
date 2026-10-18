// The command line of `remote-sheep`: which of its jobs to do.

export type Command =
  | { kind: 'serve' }
  | { kind: 'devices' }
  | { kind: 'revoke'; id: string }
  | { kind: 'relay-set'; url: string; code: string }
  | { kind: 'relay-show' }
  | { kind: 'relay-off' }
  | { kind: 'help' }
  | { kind: 'error'; message: string };

export const USAGE = `Usage:
  remote-sheep               serve the phone app and print a QR code to pair a phone
                             (press Enter for a new QR code; each one pairs one phone
                             and expires after 5 minutes)
  remote-sheep devices       list paired phones: id, paired, last used, expires
  remote-sheep revoke <id>   unpair a phone; a running agent disconnects it within 5 seconds
  remote-sheep --help        show this help

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
    case '--help':
    case '-h':
    case 'help':
      return { kind: 'help' };
    case 'serve':
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
    default:
      return { kind: 'error', message: 'unknown command: ' + command };
  }
}
