import { describe, expect, it } from 'vitest';
import { HttpLocalPairing } from '../../src/L3_periphery/http-local-pairing';

describe('HttpLocalPairing', () => {
  it('posts to the agent that served the page and reads the invite as a pairing fragment', async () => {
    const asked: [string, RequestInit | undefined][] = [];
    const pairing = new HttpLocalPairing(async (url, init) => {
      asked.push([url, init]);
      return new Response('{"invite":"abc.def.1"}', { status: 200 });
    });
    expect(await pairing.invite()).toBe('#pair=abc.def.1');
    expect(asked).toEqual([
      ['/local-pairing', { method: 'POST', cache: 'no-store', credentials: 'same-origin' }],
    ]);
  });

  it('fails with the HTTP status, or when the answer carries no invite', async () => {
    const refused = new HttpLocalPairing(async () => new Response('', { status: 403 }));
    await expect(refused.invite()).rejects.toThrow('HTTP 403');
    const odd = new HttpLocalPairing(async () => new Response('{"x":1}', { status: 200 }));
    await expect(odd.invite()).rejects.toThrow('no invite');
  });
});
