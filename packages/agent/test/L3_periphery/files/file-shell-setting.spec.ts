import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadShellSetting } from '../../../src/L3_periphery/files/file-shell-setting';

const fileIn = () => join(mkdtempSync(join(tmpdir(), 'sheep-shells-')), 'home', 'settings.json');

describe('loadShellSetting', () => {
  it('starts with consoles on when nothing was ever chosen, and writes nothing', async () => {
    const file = fileIn();
    const setting = await loadShellSetting(file);
    expect(setting.enabled()).toBe(true);
    expect(() => readFileSync(file, 'utf8')).toThrow();
  });

  it('keeps the choice across restarts', async () => {
    const file = fileIn();
    await (await loadShellSetting(file)).set(false);
    expect((await loadShellSetting(file)).enabled()).toBe(false);
    const again = await loadShellSetting(file);
    await again.set(true);
    expect(again.enabled()).toBe(true);
    expect((await loadShellSetting(file)).enabled()).toBe(true);
  });

  it('keeps the other settings of the file when it writes', async () => {
    const file = fileIn();
    const setting = await loadShellSetting(file);
    await setting.set(false);
    writeFileSync(file, JSON.stringify({ version: 1, shells: false, other: 'kept' }));
    await (await loadShellSetting(file)).set(true);
    expect(JSON.parse(readFileSync(file, 'utf8'))).toMatchObject({ shells: true, other: 'kept' });
  });

  it('turns consoles off, not on, when the file cannot be read, and leaves it untouched', async () => {
    const file = fileIn();
    await (await loadShellSetting(file)).set(true);
    for (const damaged of ['{broken', '[]', '{"version":1,"shells":"yes"}', '{"version":9}']) {
      writeFileSync(file, damaged);
      expect((await loadShellSetting(file)).enabled()).toBe(false);
      expect(readFileSync(file, 'utf8')).toBe(damaged);
    }
  });
});
