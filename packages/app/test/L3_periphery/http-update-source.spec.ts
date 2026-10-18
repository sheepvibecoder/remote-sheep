import { describe, expect, it } from 'vitest';
import { HttpUpdateSource } from '../../src/L3_periphery/http-update-source';

describe('HttpUpdateSource', () => {
  it('reads the version the server publishes, skipping every cache', async () => {
    const asked: [string, RequestInit | undefined][] = [];
    const source = new HttpUpdateSource(async (url, init) => {
      asked.push([url, init]);
      return new Response('{"version":"0.6.0"}', { status: 200 });
    });
    expect(await source.latestVersion()).toBe('0.6.0');
    expect(asked).toEqual([['/version.json', { cache: 'no-store' }]]);
  });

  it('fails with the HTTP status, or when the answer carries no version', async () => {
    const missing = new HttpUpdateSource(async () => new Response('', { status: 404 }));
    await expect(missing.latestVersion()).rejects.toThrow('HTTP 404');
    const odd = new HttpUpdateSource(async () => new Response('{"v":1}', { status: 200 }));
    await expect(odd.latestVersion()).rejects.toThrow('no version');
  });
});
