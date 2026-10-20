import { describe, expect, it } from 'vitest';
import { checkRelaySetting, MAX_RELAY_CODE_LENGTH, relayIsOn } from '../src/relay-setting';

describe('checkRelaySetting', () => {
  it('keeps the origin of an https relay and the trimmed code', () => {
    expect(checkRelaySetting(' https://relay.example.dev/ ', ' abc-123 ')).toEqual({
      ok: true,
      setting: { url: 'https://relay.example.dev', code: 'abc-123' },
    });
  });

  it('accepts plain http only for a relay on this computer, as `wrangler dev` serves it', () => {
    expect(checkRelaySetting('http://127.0.0.1:8787', 'c')).toEqual({
      ok: true,
      setting: { url: 'http://127.0.0.1:8787', code: 'c' },
    });
    expect(checkRelaySetting('http://localhost:8787', 'c').ok).toBe(true);
  });

  it('refuses a URL that is not https, naming what it expects', () => {
    for (const url of ['http://relay.example.dev', 'wss://relay.example.dev', 'relay', '']) {
      expect(checkRelaySetting(url, 'code')).toEqual({
        ok: false,
        error: 'The relay URL must start with https:// (for example https://my-relay.workers.dev).',
      });
    }
  });

  it('refuses an empty code, one with spaces and one longer than the limit', () => {
    const error = {
      ok: false,
      error:
        'The access code must be 1 to ' +
        String(MAX_RELAY_CODE_LENGTH) +
        ' characters, with no spaces.',
    };
    expect(checkRelaySetting('https://r.dev', '  ')).toEqual(error);
    expect(checkRelaySetting('https://r.dev', 'two words')).toEqual(error);
    expect(checkRelaySetting('https://r.dev', 'x'.repeat(MAX_RELAY_CODE_LENGTH + 1))).toEqual(
      error,
    );
    expect(checkRelaySetting('https://r.dev', 'x'.repeat(MAX_RELAY_CODE_LENGTH)).ok).toBe(true);
  });
});

describe('relayIsOn', () => {
  it('is on only with a URL to show, so on and url never disagree for the reader', () => {
    const info = { connected: false, fixed: false };
    expect(relayIsOn({ ...info, on: true, url: 'https://r.dev' })).toBe(true);
    expect(relayIsOn({ ...info, on: false, url: null })).toBe(false);
    expect(relayIsOn({ ...info, on: true, url: null })).toBe(false);
    expect(relayIsOn({ ...info, on: false, url: 'https://r.dev' })).toBe(false);
  });
});
