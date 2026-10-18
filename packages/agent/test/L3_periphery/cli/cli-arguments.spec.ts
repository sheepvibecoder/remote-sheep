import { describe, expect, it } from 'vitest';
import { parseArguments, USAGE } from '../../../src/L3_periphery/cli/cli-arguments';

describe('parseArguments', () => {
  it('serves by default', () => {
    expect(parseArguments([])).toEqual({ kind: 'serve' });
    expect(parseArguments(['serve'])).toEqual({ kind: 'serve' });
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
