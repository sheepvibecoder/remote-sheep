import { describe, expect, it } from 'vitest';
import {
  parseRelaySettings,
  relayPushWarning,
} from '../../../src/L3_periphery/relay/relay-settings';

describe('parseRelaySettings', () => {
  it('means no relay when neither variable is set', () => {
    expect(parseRelaySettings(undefined, undefined)).toBeNull();
    expect(parseRelaySettings('', '')).toBeNull();
  });

  it('returns the origin and the access code', () => {
    expect(parseRelaySettings('https://relay.example.com/some/path', ' code-1 ')).toEqual({
      url: 'https://relay.example.com',
      code: 'code-1',
    });
  });

  it('accepts http for a local relay and keeps its port', () => {
    expect(parseRelaySettings('http://localhost:8787', 'c')).toEqual({
      url: 'http://localhost:8787',
      code: 'c',
    });
  });

  it('fails when only one of the two is set', () => {
    expect(() => parseRelaySettings('https://relay.example.com', undefined)).toThrow(
      /REMOTE_SHEEP_RELAY_CODE/,
    );
    expect(() => parseRelaySettings(undefined, 'code')).toThrow(/REMOTE_SHEEP_RELAY/);
  });

  it('fails on a URL that is not http(s)', () => {
    expect(() => parseRelaySettings('ftp://relay.example.com', 'c')).toThrow(/http/);
    expect(() => parseRelaySettings('not a url', 'c')).toThrow(/http/);
  });
});

describe('relayPushWarning', () => {
  it('warns when the relay is plain http, since push services may refuse a non-https subject', () => {
    const warning = relayPushWarning({ url: 'http://localhost:8787', code: 'c' });
    expect(warning).toContain('https');
  });

  it('says nothing for an https relay or without a relay', () => {
    expect(relayPushWarning({ url: 'https://relay.example', code: 'c' })).toBeNull();
    expect(relayPushWarning(null)).toBeNull();
  });
});
