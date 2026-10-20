import { describe, expect, it } from 'vitest';
import { parseArguments, USAGE } from '../../../src/L3_periphery/cli/cli-arguments';

describe('parseArguments', () => {
  it('serves by default', () => {
    expect(parseArguments([])).toEqual({ kind: 'serve', background: false });
    expect(parseArguments(['serve'])).toEqual({ kind: 'serve', background: false });
  });

  it('serves in the background when `start` launches it, and only then', () => {
    expect(parseArguments(['serve', '--background'])).toEqual({ kind: 'serve', background: true });
    expect(parseArguments(['serve', '--background', 'x'])).toEqual({
      kind: 'error',
      message: 'serve takes no arguments',
    });
  });

  it('asks the running agent for a pairing QR', () => {
    expect(parseArguments(['qr'])).toEqual({ kind: 'qr' });
    expect(parseArguments(['qr', 'x'])).toEqual({
      kind: 'error',
      message: 'qr takes no arguments',
    });
    expect(USAGE).toContain('remote-sheep qr');
  });

  it('lists devices and revokes one by id', () => {
    expect(parseArguments(['devices'])).toEqual({ kind: 'devices' });
    expect(parseArguments(['revoke', '0123456789abcdef'])).toEqual({
      kind: 'revoke',
      id: '0123456789abcdef',
    });
  });

  it('sets, shows and switches off the relay', () => {
    expect(parseArguments(['relay'])).toEqual({ kind: 'relay-show' });
    expect(parseArguments(['relay', 'off'])).toEqual({ kind: 'relay-off' });
    expect(parseArguments(['relay', 'set', 'https://r.example.com', 'abc'])).toEqual({
      kind: 'relay-set',
      url: 'https://r.example.com',
      code: 'abc',
    });
    expect(USAGE).toContain('remote-sheep relay set <url> <code>');
  });

  it('asks the running agent to change its relay with `relay change`, which takes no arguments', () => {
    expect(parseArguments(['relay', 'change'])).toEqual({ kind: 'relay-change' });
    expect(parseArguments(['relay', 'change', 'x'])).toEqual({
      kind: 'error',
      message: 'relay change takes no arguments; it asks for the URL and the access code',
    });
    expect(USAGE).toContain('remote-sheep relay change');
  });

  it('explains wrong relay arguments', () => {
    const set = 'relay set needs a relay URL and an access code';
    expect(parseArguments(['relay', 'set'])).toEqual({ kind: 'error', message: set });
    expect(parseArguments(['relay', 'set', 'https://r.example.com'])).toEqual({
      kind: 'error',
      message: set,
    });
    expect(parseArguments(['relay', 'set', 'a', 'b', 'c'])).toEqual({
      kind: 'error',
      message: set,
    });
    expect(parseArguments(['relay', 'off', 'x'])).toEqual({
      kind: 'error',
      message: 'relay off takes no arguments',
    });
    expect(parseArguments(['relay', 'nope'])).toEqual({
      kind: 'error',
      message: 'unknown relay command: nope (use `relay`, `relay set <url> <code>` or `relay off`)',
    });
  });

  it('shows the help', () => {
    expect(parseArguments(['--help'])).toEqual({ kind: 'help' });
    expect(parseArguments(['-h'])).toEqual({ kind: 'help' });
    expect(parseArguments(['help'])).toEqual({ kind: 'help' });
    expect(USAGE).toContain('remote-sheep revoke <id>');
  });

  it('explains what is wrong with anything else', () => {
    expect(parseArguments(['revoke'])).toEqual({
      kind: 'error',
      message: 'revoke needs a device id (see `remote-sheep devices`)',
    });
    expect(parseArguments(['revoke', 'a', 'b'])).toEqual({
      kind: 'error',
      message: 'revoke takes one device id',
    });
    expect(parseArguments(['devices', 'x'])).toEqual({
      kind: 'error',
      message: 'devices takes no arguments',
    });
    expect(parseArguments(['serve', 'x'])).toEqual({
      kind: 'error',
      message: 'serve takes no arguments',
    });
    expect(parseArguments(['pair'])).toEqual({ kind: 'error', message: 'unknown command: pair' });
  });
});

describe('parseArguments for the background agent', () => {
  it('starts, stops and reports the agent in the background', () => {
    expect(parseArguments(['start'])).toEqual({ kind: 'start' });
    expect(parseArguments(['stop'])).toEqual({ kind: 'stop' });
    expect(parseArguments(['status'])).toEqual({ kind: 'status' });
    expect(parseArguments(['restart'])).toEqual({ kind: 'restart' });
    expect(parseArguments(['restart', 'x'])).toEqual({
      kind: 'error',
      message: 'restart takes no arguments',
    });
    expect(USAGE).toContain('remote-sheep restart');
    expect(parseArguments(['start', 'x'])).toEqual({
      kind: 'error',
      message: 'start takes no arguments',
    });
    expect(USAGE).toContain('remote-sheep start');
  });
});

describe('parseArguments for the port', () => {
  it('shows, saves or forgets the port', () => {
    expect(parseArguments(['port'])).toEqual({ kind: 'port-show' });
    expect(parseArguments(['port', '3994'])).toEqual({ kind: 'port-set', port: 3994 });
    expect(parseArguments(['port', 'auto'])).toEqual({ kind: 'port-auto' });
    expect(USAGE).toContain('remote-sheep port <n>');
    expect(USAGE).toContain('remote-sheep port auto');
  });

  it('refuses a value that is not a usable port', () => {
    for (const value of ['80', '65536', 'abc', '4000.5']) {
      expect(parseArguments(['port', value])).toEqual({
        kind: 'error',
        message: 'port needs a whole number from 1024 to 65535, or `auto`',
      });
    }
    expect(parseArguments(['port', '4000', 'x'])).toEqual({
      kind: 'error',
      message: 'port takes one value: a port number or `auto`',
    });
  });
});
