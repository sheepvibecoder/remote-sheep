// Asks the agent that served this page for a pairing, over plain HTTP to the same address.
//
// The agent answers only a same-origin request from loopback (lan-transport.ts), so this works
// only in a browser on its own computer; anywhere else it is refused and the page asks for a QR.

import type { LocalPairing } from '../L1_domain/ports/local-pairing';

type Fetch = (url: string, init?: RequestInit) => Promise<Response>;

export class HttpLocalPairing implements LocalPairing {
  constructor(private readonly fetchFn: Fetch) {}

  async invite(): Promise<string> {
    const response = await this.fetchFn('/local-pairing', {
      method: 'POST',
      cache: 'no-store',
      credentials: 'same-origin',
    });
    if (!response.ok) throw new Error('HTTP ' + String(response.status));
    const body = (await response.json()) as { invite?: unknown };
    if (typeof body.invite !== 'string') throw new Error('the computer sent no invite');
    return '#pair=' + body.invite;
  }
}
