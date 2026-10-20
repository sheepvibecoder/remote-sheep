import { describe, expect, it } from 'vitest';
import type { PortProbe } from '../../src/L1_domain/ports/port-probe';
import type { SavedPort } from '../../src/L1_domain/ports/saved-port';
import {
  NOT_A_PLUGIN_PORT,
  PORT_FROM_VARIABLE,
  PortChanger,
  type PortChangerOptions,
} from '../../src/L2_application/port-changer';

class FakeSavedPort implements SavedPort {
  readonly saves: number[] = [];
  forgets = 0;
  constructor(public port: number | null) {}

  load() {
    return Promise.resolve(this.port);
  }

  save(port: number) {
    this.saves.push(port);
    this.port = port;
    return Promise.resolve();
  }

  forget() {
    this.forgets++;
    const had = this.port !== null;
    this.port = null;
    return Promise.resolve(had);
  }
}

class FakeProbe implements PortProbe {
  readonly asked: number[] = [];
  constructor(private readonly busy: ReadonlySet<number> = new Set()) {}

  isFree(port: number) {
    this.asked.push(port);
    return Promise.resolve(!this.busy.has(port));
  }
}

const tick = () => new Promise((resolve) => setTimeout(resolve, 10));

function setup(overrides: Partial<PortChangerOptions> = {}) {
  const saved = new FakeSavedPort(3998);
  const probe = new FakeProbe(new Set([4000]));
  const logged: string[] = [];
  let restarts = 0;
  const changer = new PortChanger({
    current: { port: 3998, source: 'saved' },
    variable: null,
    saved,
    probe,
    restart: () => {
      restarts++;
      return Promise.resolve();
    },
    restartDelayMs: 0,
    log: (message) => logged.push(message),
    ...overrides,
  });
  return { changer, saved, probe, logged, restarts: () => restarts };
}

describe('PortChanger', () => {
  it('tells the port in use, where it came from and the saved one', async () => {
    expect(await setup().changer.portState()).toEqual({
      port: 3998,
      source: 'saved',
      saved: 3998,
      canChange: true,
      reason: null,
      restarting: false,
    });
  });

  it('saves a free port and restarts the agent on it', async () => {
    const { changer, saved, probe, restarts } = setup();
    const state = await changer.changePort(4100);
    expect(state).toMatchObject({ port: 3998, saved: 4100, restarting: true });
    expect(probe.asked).toEqual([4100]);
    expect(saved.saves).toEqual([4100]);
    await tick();
    expect(restarts()).toBe(1);
  });

  it('forgets the saved port on auto and restarts, so the start picks a free one', async () => {
    const { changer, saved, restarts } = setup();
    const state = await changer.changePort('auto');
    expect(state).toMatchObject({ saved: null, restarting: true });
    expect(saved.forgets).toBe(1);
    await tick();
    expect(restarts()).toBe(1);
  });

  it('refuses a busy port and a port outside 1024-65535, saving nothing', async () => {
    const { changer, saved, restarts } = setup();
    await expect(changer.changePort(4000)).rejects.toThrow(
      'port 4000 is in use on the computer; choose another',
    );
    for (const port of [80, 1023, 65536, 4100.5]) {
      await expect(changer.changePort(port)).rejects.toThrow(
        'a port is a whole number from 1024 to 65535',
      );
    }
    await tick();
    expect(saved.saves).toEqual([]);
    expect(restarts()).toBe(0);
  });

  it('does nothing for the port it already listens on and keeps', async () => {
    const { changer, saved, probe, restarts } = setup();
    const state = await changer.changePort(3998);
    expect(state.restarting).toBe(false);
    expect(probe.asked).toEqual([]);
    expect(saved.saves).toEqual([]);
    await tick();
    expect(restarts()).toBe(0);
  });

  it('keeps the port it listens on after auto with no restart, though the probe would call it busy', async () => {
    const { changer, saved, probe, restarts } = setup();
    saved.port = null;
    const state = await changer.changePort(3998);
    expect(state).toMatchObject({ saved: 3998, restarting: false });
    expect(probe.asked).toEqual([]);
    await tick();
    expect(restarts()).toBe(0);
  });

  it('refuses when not run as the plugin, saying how to do it by hand', async () => {
    const { changer, saved } = setup({ restart: null });
    expect(await changer.portState()).toMatchObject({
      canChange: false,
      reason: NOT_A_PLUGIN_PORT,
    });
    await expect(changer.changePort(4100)).rejects.toThrow(NOT_A_PLUGIN_PORT);
    expect(NOT_A_PLUGIN_PORT).toContain('remote-sheep port <n>');
    expect(saved.saves).toEqual([]);
  });

  it('refuses while PORT is set, which would win over any saved port', async () => {
    const { changer, saved } = setup({
      variable: 4200,
      current: { port: 4200, source: 'variable' },
    });
    // PORT wins over a plugin restart too: the reason names PORT, not `remote-sheep port`.
    expect(await changer.portState()).toMatchObject({
      canChange: false,
      reason: PORT_FROM_VARIABLE,
    });
    expect(PORT_FROM_VARIABLE).not.toContain('remote-sheep port');
    await expect(changer.changePort(4100)).rejects.toThrow(PORT_FROM_VARIABLE);
    expect(saved.saves).toEqual([]);
  });

  it('refuses a second change while it restarts, and reports a restart that failed', async () => {
    const { changer, logged } = setup({
      restart: () => Promise.reject(new Error('Herdr is gone')),
      restartDelayMs: 20,
    });
    await changer.changePort(4100);
    await expect(changer.changePort(4101)).rejects.toThrow('the agent is already restarting');
    await new Promise((resolve) => setTimeout(resolve, 40));
    expect(logged).toEqual(['could not restart on the new port: Herdr is gone']);
    expect((await changer.portState()).restarting).toBe(false);
  });
});
