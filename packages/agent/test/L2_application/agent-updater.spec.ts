import { describe, expect, it } from 'vitest';
import type { PluginUpdate, PluginUpdates } from '../../src/L1_domain/ports/plugin-updates';
import {
  AgentUpdater,
  ALREADY_UPDATING,
  NOT_A_PLUGIN,
} from '../../src/L2_application/agent-updater';

/** The plugin: each update waits for `finish` and then answers `result` or fails. */
class FakePlugin implements PluginUpdates {
  updates = 0;
  restarts = 0;
  result: PluginUpdate = 'updated';
  failure: Error | null = null;
  restartFailure: Error | null = null;
  private release: (() => void) | null = null;
  hold = false;

  async update(): Promise<PluginUpdate> {
    this.updates++;
    if (this.hold) {
      await new Promise<void>((resolve) => {
        this.release = resolve;
      });
    }
    if (this.failure) throw this.failure;
    return this.result;
  }

  restart(): Promise<void> {
    this.restarts++;
    return this.restartFailure ? Promise.reject(this.restartFailure) : Promise.resolve();
  }

  finish(): void {
    this.release?.();
  }
}

const tick = () => new Promise((resolve) => setTimeout(resolve, 10));

function setup(plugin: FakePlugin | null = new FakePlugin()) {
  const logged: string[] = [];
  const updater = new AgentUpdater({
    version: '1.2.3',
    plugin,
    restartDelayMs: 0,
    log: (message) => logged.push(message),
  });
  return { updater, plugin, logged };
}

describe('AgentUpdater', () => {
  it('tells the running version and whether it runs as the plugin', () => {
    expect(setup().updater.updateState()).toEqual({
      version: '1.2.3',
      plugin: true,
      updating: false,
    });
    expect(setup(null).updater.updateState()).toEqual({
      version: '1.2.3',
      plugin: false,
      updating: false,
    });
  });

  it('refuses to update an agent that does not run as the plugin, saying how to do it by hand', async () => {
    const { updater } = setup(null);
    await expect(updater.runUpdate()).rejects.toThrow(NOT_A_PLUGIN);
    expect(NOT_A_PLUGIN).toContain('herdr plugin update sheepvibecoder.remote-sheep');
  });

  it('answers at once and updates in the background, however long Herdr takes', async () => {
    const plugin = new FakePlugin();
    plugin.hold = true;
    const { updater } = setup(plugin);
    expect(await updater.runUpdate()).toEqual({ version: '1.2.3', plugin: true, updating: true });
    expect(plugin.updates).toBe(1);
    expect(updater.updateState()).toEqual({ version: '1.2.3', plugin: true, updating: true });
    plugin.finish();
    await tick();
    expect(updater.updateState()).toEqual({
      version: '1.2.3',
      plugin: true,
      updating: true,
      outcome: 'updated',
    });
  });

  it('restarts into the new build once the outcome is known', async () => {
    const plugin = new FakePlugin();
    const { updater } = setup(plugin);
    await updater.runUpdate();
    await tick();
    expect(plugin.restarts).toBe(1);
    // Still updating until this process ends, so a second request cannot start another.
    await expect(updater.runUpdate()).rejects.toThrow(ALREADY_UPDATING);
  });

  it('does not restart when the plugin is already current', async () => {
    const plugin = new FakePlugin();
    plugin.result = 'current';
    const { updater } = setup(plugin);
    await updater.runUpdate();
    await tick();
    expect(updater.updateState()).toEqual({
      version: '1.2.3',
      plugin: true,
      updating: false,
      outcome: 'current',
    });
    expect(plugin.restarts).toBe(0);
  });

  it('runs one update at a time: a second request while one runs is told so', async () => {
    const plugin = new FakePlugin();
    plugin.hold = true;
    plugin.result = 'current';
    const { updater } = setup(plugin);
    await updater.runUpdate();
    await expect(updater.runUpdate()).rejects.toThrow(ALREADY_UPDATING);
    plugin.finish();
    await tick();
    expect(plugin.updates).toBe(1);
  });

  it('keeps running and records why when the update fails, and lets a later one try again', async () => {
    const plugin = new FakePlugin();
    plugin.failure = new Error('Herdr could not update the plugin: network down');
    const { updater } = setup(plugin);
    await updater.runUpdate();
    await tick();
    expect(updater.updateState()).toEqual({
      version: '1.2.3',
      plugin: true,
      updating: false,
      outcome: 'failed',
      error: 'Herdr could not update the plugin: network down',
    });
    expect(plugin.restarts).toBe(0);
    plugin.failure = null;
    plugin.result = 'current';
    await updater.runUpdate();
    await tick();
    expect(updater.updateState().outcome).toBe('current');
  });

  it('records a restart that failed as a failed update, and logs it', async () => {
    const plugin = new FakePlugin();
    plugin.restartFailure = new Error('no Herdr server');
    const { updater, logged } = setup(plugin);
    await updater.runUpdate();
    await tick();
    const state = updater.updateState();
    expect(state).toMatchObject({ updating: false, outcome: 'failed' });
    expect(state.error).toContain('could not restart');
    expect(state.error).toContain('no Herdr server');
    expect(logged.join(' ')).toContain('no Herdr server');
  });
});
