import { describe, expect, it } from 'vitest';
import {
  FIRST_LISTEN_PORT,
  LAST_LISTEN_PORT,
  listenPortCandidates,
  parseListenPort,
  portFromVariable,
  presetListenPort,
} from '../../src/L1_domain/listen-port';

describe('parseListenPort', () => {
  it('takes a whole number from 1024 to 65535', () => {
    expect(parseListenPort('1024')).toBe(1024);
    expect(parseListenPort('3994')).toBe(3994);
    expect(parseListenPort(' 65535 ')).toBe(65535);
  });

  it('refuses anything else', () => {
    for (const text of ['', 'auto', '80', '1023', '65536', '3999.5', '0x0fa0', '1e4', '-4000']) {
      expect(parseListenPort(text)).toBeNull();
    }
  });
});

describe('listenPortCandidates', () => {
  it('tries 3998 first, then the next ports up to the last one', () => {
    const ports = listenPortCandidates();
    expect(ports[0]).toBe(3998);
    expect(ports[0]).toBe(FIRST_LISTEN_PORT);
    expect(ports.at(-1)).toBe(LAST_LISTEN_PORT);
    expect(ports).toHaveLength(LAST_LISTEN_PORT - FIRST_LISTEN_PORT + 1);
  });
});

describe('presetListenPort', () => {
  it('lets the PORT variable win over the saved port', () => {
    expect(presetListenPort(4100, 4005)).toEqual({ port: 4100, source: 'variable' });
    expect(presetListenPort(4100, null)).toEqual({ port: 4100, source: 'variable' });
  });

  it('uses the saved port without the variable, and leaves the pick for neither', () => {
    expect(presetListenPort(null, 4005)).toEqual({ port: 4005, source: 'saved' });
    expect(presetListenPort(null, null)).toBeNull();
  });
});

describe('portFromVariable', () => {
  it('reads a valid PORT, and an unset or empty one as none', () => {
    expect(portFromVariable('4100')).toBe(4100);
    expect(portFromVariable(undefined)).toBeNull();
    expect(portFromVariable('')).toBeNull();
  });

  it('refuses a PORT that is not a usable port, naming the variable', () => {
    for (const value of ['abc', '80', '70000']) {
      expect(() => portFromVariable(value)).toThrow(
        'PORT must be a whole number from 1024 to 65535, not "' + value + '"',
      );
    }
  });
});
