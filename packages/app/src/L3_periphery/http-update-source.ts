// Reads `version.json`, which the build writes next to the page. Both the agent
// and the relay serve it with the app, so it names exactly what a reload would load.

import type { UpdateSource } from '../L1_domain/ports/update-source';

type Fetch = (url: string, init?: RequestInit) => Promise<Response>;

export class HttpUpdateSource implements UpdateSource {
  constructor(private readonly fetchFn: Fetch) {}

  async latestVersion(): Promise<string> {
    // No cache: the question is precisely whether a cached page is stale.
    const response = await this.fetchFn('/version.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('HTTP ' + String(response.status));
    const body = (await response.json()) as { version?: unknown };
    if (typeof body.version !== 'string') throw new Error('the server published no version');
    return body.version;
  }
}
