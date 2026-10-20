import { describe, expect, it } from 'vitest';
import { busyPortHint, describePort } from '../../../src/L3_periphery/cli/port-messages';

describe('busyPortHint', () => {
  it('points at PORT when the variable chose the port', () => {
    expect(busyPortHint('variable')).toBe('set PORT to another port, or unset it');
  });

  it('points at `remote-sheep port` for a saved or picked port', () => {
    for (const source of ['saved', 'picked'] as const) {
      expect(busyPortHint(source)).toBe(
        'choose another with `remote-sheep port <n>`, or `remote-sheep port auto` to pick a free one',
      );
    }
  });
});

describe('describePort', () => {
  it('says where the port comes from', () => {
    expect(describePort({ variable: 4100, saved: 4005, file: 'port.json' })).toBe(
      'Port 4100, from the PORT variable (it overrides the saved port 4005).',
    );
    expect(describePort({ variable: 4100, saved: null, file: 'port.json' })).toBe(
      'Port 4100, from the PORT variable.',
    );
    expect(describePort({ variable: null, saved: 4005, file: 'port.json' })).toBe(
      'Port 4005, saved in port.json.',
    );
    expect(describePort({ variable: null, saved: null, file: 'port.json' })).toBe(
      'No port saved yet: the next start takes the first free port from 3999 to 4049 and saves it.',
    );
  });
});
