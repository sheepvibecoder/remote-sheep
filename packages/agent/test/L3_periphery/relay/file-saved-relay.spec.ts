import { mkdtempSync, readdirSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { FileSavedRelay } from '../../../src/L3_periphery/relay/file-saved-relay';
import {
  loadRelaySettingsFile,
  relayVariablesSet,
} from '../../../src/L3_periphery/relay/relay-settings-file';

const fileIn = () => join(mkdtempSync(join(tmpdir(), 'sheep-relay-')), 'home', 'relay.json');

describe('FileSavedRelay', () => {
  it('keeps the relay in relay.json, owner-only, where the next start reads it', async () => {
    const file = fileIn();
    await new FileSavedRelay(file).save({ url: 'https://relay.example.com', code: 'c0de' });
    expect(loadRelaySettingsFile(file)).toEqual({ url: 'https://relay.example.com', code: 'c0de' });
    expect(readdirSync(dirname(file))).toEqual(['relay.json']);
    if (process.platform !== 'win32') expect(statSync(file).mode & 0o777).toBe(0o600);
  });

  it('forgets it, and forgetting twice is fine', async () => {
    const file = fileIn();
    const saved = new FileSavedRelay(file);
    await saved.save({ url: 'https://relay.example.com', code: 'c0de' });
    await saved.forget();
    await saved.forget();
    expect(loadRelaySettingsFile(file)).toBeNull();
  });
});

describe('relayVariablesSet', () => {
  it('is true when either relay variable holds something, as `resolveRelaySettings` decides', () => {
    expect(relayVariablesSet({})).toBe(false);
    expect(relayVariablesSet({ REMOTE_SHEEP_RELAY: '  ' })).toBe(false);
    expect(relayVariablesSet({ REMOTE_SHEEP_RELAY: 'https://r.dev' })).toBe(true);
    expect(relayVariablesSet({ REMOTE_SHEEP_RELAY_CODE: 'c' })).toBe(true);
  });
});
