import { mkdtempSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  loadRelaySettingsFile,
  maskCode,
  removeRelaySettingsFile,
  resolveRelaySettings,
  saveRelaySettingsFile,
} from '../../../src/L3_periphery/relay/relay-settings-file';

const fileIn = () => join(mkdtempSync(join(tmpdir(), 'sheep-relay-')), 'home', 'relay.json');

describe('relay settings file', () => {
  it('saves and loads the same settings, owner-only, leaving no temp file', async () => {
    const file = fileIn();
    const saved = await saveRelaySettingsFile(file, 'https://relay.example.com/x', ' abc123 ');
    expect(saved).toEqual({ url: 'https://relay.example.com', code: 'abc123' });
    expect(loadRelaySettingsFile(file)).toEqual(saved);
    expect(JSON.parse(readFileSync(file, 'utf8'))).toEqual(saved);
    expect(readdirSync(dirname(file))).toEqual(['relay.json']);
    if (process.platform !== 'win32') expect(statSync(file).mode & 0o777).toBe(0o600);
  });

  it('replaces an earlier file', async () => {
    const file = fileIn();
    await saveRelaySettingsFile(file, 'https://a.example.com', 'one');
    await saveRelaySettingsFile(file, 'https://b.example.com', 'two');
    expect(loadRelaySettingsFile(file)).toEqual({ url: 'https://b.example.com', code: 'two' });
  });

  it('refuses invalid settings without writing anything', async () => {
    const file = fileIn();
    await expect(saveRelaySettingsFile(file, 'ftp://x', 'code')).rejects.toThrow('http(s) URL');
    await expect(saveRelaySettingsFile(file, 'https://x.example.com', '')).rejects.toThrow();
    expect(loadRelaySettingsFile(file)).toBeNull();
  });

  it('reads a missing file as no relay', () => {
    expect(loadRelaySettingsFile(fileIn())).toBeNull();
  });

  it('names the file when it is damaged', async () => {
    const file = fileIn();
    await saveRelaySettingsFile(file, 'https://a.example.com', 'one');
    for (const text of [
      'not json',
      '[]',
      '{"url":"https://a.example.com"}',
      '{"url":1,"code":2}',
    ]) {
      writeFileSync(file, text);
      expect(() => loadRelaySettingsFile(file)).toThrow('damaged relay settings ' + file);
    }
  });

  it('removes the file and says whether there was one', async () => {
    const file = fileIn();
    await saveRelaySettingsFile(file, 'https://a.example.com', 'one');
    expect(await removeRelaySettingsFile(file)).toBe(true);
    expect(await removeRelaySettingsFile(file)).toBe(false);
    expect(loadRelaySettingsFile(file)).toBeNull();
  });

  it('masks the code but for its first two characters', () => {
    expect(maskCode('abc123')).toBe('ab…');
    expect(maskCode('a')).toBe('a…');
  });
});

describe('resolveRelaySettings', () => {
  it('uses the file when no variable is set', async () => {
    const file = fileIn();
    await saveRelaySettingsFile(file, 'https://file.example.com', 'filecode');
    expect(resolveRelaySettings(file, {})).toEqual({
      url: 'https://file.example.com',
      code: 'filecode',
    });
  });

  it('lets the variables override the file, even one of them', async () => {
    const file = fileIn();
    await saveRelaySettingsFile(file, 'https://file.example.com', 'filecode');
    expect(
      resolveRelaySettings(file, {
        REMOTE_SHEEP_RELAY: 'https://env.example.com',
        REMOTE_SHEEP_RELAY_CODE: 'envcode',
      }),
    ).toEqual({ url: 'https://env.example.com', code: 'envcode' });
    expect(() =>
      resolveRelaySettings(file, { REMOTE_SHEEP_RELAY: 'https://env.example.com' }),
    ).toThrow('REMOTE_SHEEP_RELAY_CODE');
  });

  it('means no relay with neither', () => {
    expect(resolveRelaySettings(fileIn(), {})).toBeNull();
  });

  it('does not read a damaged file when the variables decide', async () => {
    const file = fileIn();
    await saveRelaySettingsFile(file, 'https://file.example.com', 'filecode');
    writeFileSync(file, 'garbage');
    expect(
      resolveRelaySettings(file, {
        REMOTE_SHEEP_RELAY: 'https://env.example.com',
        REMOTE_SHEEP_RELAY_CODE: 'c',
      }),
    ).toEqual({ url: 'https://env.example.com', code: 'c' });
    expect(() => resolveRelaySettings(file, {})).toThrow('damaged relay settings');
  });
});
