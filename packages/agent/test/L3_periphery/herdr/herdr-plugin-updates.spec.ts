import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  herdrCommand,
  HerdrPluginUpdates,
  LINKED_PLUGIN,
  runsAsPlugin,
  TOO_OLD_HERDR,
} from '../../../src/L3_periphery/herdr/herdr-plugin-updates';

/**
 * A stand-in Herdr: a Node script that records its arguments and answers as told. Node runs it,
 * so the adapter calls a real process exactly as it calls Herdr.
 */
function fakeHerdr(answer: { stdout?: string; stderr?: string; code?: number }) {
  const dir = mkdtempSync(join(tmpdir(), 'sheep-herdr-'));
  const calls = join(dir, 'calls.jsonl');
  const script = join(dir, 'herdr.cjs');
  writeFileSync(
    script,
    [
      'const fs = require("fs");',
      'fs.appendFileSync(' +
        JSON.stringify(calls) +
        ', JSON.stringify(process.argv.slice(2)) + "\\n");',
      'process.stdout.write(' + JSON.stringify(answer.stdout ?? '') + ');',
      'process.stderr.write(' + JSON.stringify(answer.stderr ?? '') + ');',
      'process.exitCode = ' + String(answer.code ?? 0) + ';',
    ].join('\n'),
  );
  const updates = new HerdrPluginUpdates(herdrCommand(process.execPath, [script]));
  const called = () =>
    readFileSync(calls, 'utf8')
      .trim()
      .split('\n')
      .map((line) => JSON.parse(line) as string[]);
  return { updates, called };
}

describe('HerdrPluginUpdates', () => {
  it('asks Herdr to update exactly this plugin, with no questions, and reports a new build', async () => {
    const { updates, called } = fakeHerdr({
      stdout:
        'Updated sheepvibecoder.remote-sheep from sheepvibecoder/remote-sheep.\nConfig: /x/config\n',
    });
    expect(await updates.update()).toBe('updated');
    expect(called()).toEqual([['plugin', 'update', 'sheepvibecoder.remote-sheep', '--yes']]);
  });

  it('reports a plugin that is already up to date', async () => {
    const { updates } = fakeHerdr({
      stdout: 'sheepvibecoder.remote-sheep is already up to date.\n',
    });
    expect(await updates.update()).toBe('current');
  });

  it('fails with the last thing Herdr said when the update fails', async () => {
    const { updates } = fakeHerdr({
      stderr: 'cloning…\nerror updating sheepvibecoder.remote-sheep: git fetch failed\n',
      code: 1,
    });
    await expect(updates.update()).rejects.toThrow(
      'Herdr could not update the plugin: error updating sheepvibecoder.remote-sheep: git fetch failed',
    );
  });

  it('explains a plugin linked from a folder, which Herdr does not update', async () => {
    const { updates } = fakeHerdr({
      stderr: 'plugin is locally linked and cannot be updated: sheepvibecoder.remote-sheep\n',
      code: 1,
    });
    await expect(updates.update()).rejects.toThrow(LINKED_PLUGIN);
    // The checkout holds the built agent: a pull is enough, a build only after changing the code.
    expect(LINKED_PLUGIN).toContain('run `git pull` in that folder');
    expect(LINKED_PLUGIN).toContain('`pnpm build` only if you changed the code');
  });

  it('explains a Herdr too old to update plugins', async () => {
    const { updates } = fakeHerdr({
      stderr:
        'herdr plugin commands:\n  herdr plugin install <owner>/<repo>\n  herdr plugin link <path>\n',
      code: 2,
    });
    await expect(updates.update()).rejects.toThrow(TOO_OLD_HERDR);
  });

  it('says so when Herdr cannot be run at all', async () => {
    const missing = join(tmpdir(), 'no-such-herdr-' + String(process.pid));
    const updates = new HerdrPluginUpdates(herdrCommand(missing));
    await expect(updates.update()).rejects.toThrow('could not run Herdr');
  });

  it('restarts through the plugin action, so the newest installation starts', async () => {
    const { updates, called } = fakeHerdr({ stdout: '{"result":{}}' });
    await updates.restart();
    expect(called()).toEqual([
      ['plugin', 'action', 'invoke', 'sheepvibecoder.remote-sheep.restart'],
    ]);
  });

  it('fails a restart that Herdr refuses', async () => {
    const { updates } = fakeHerdr({ stderr: 'no server running\n', code: 1 });
    await expect(updates.restart()).rejects.toThrow('no server running');
  });
});

describe('runsAsPlugin', () => {
  it('is true only when Herdr started the agent as its plugin', () => {
    expect(runsAsPlugin({ HERDR_PLUGIN_ROOT: '/plugins/remote-sheep' })).toBe(true);
    expect(runsAsPlugin({ HERDR_PLUGIN_ROOT: '' })).toBe(false);
    expect(runsAsPlugin({})).toBe(false);
  });
});
