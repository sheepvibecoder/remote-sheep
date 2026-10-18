// Reads the two environment variables that switch the relay on. A pure function so a
// typo is caught at start with a clear message, and so it can be tested without the
// process environment.

export interface RelaySettings {
  /** Origin of the relay, http(s) scheme included, without any path. */
  url: string;
  /** The access code the relay owner issued to this agent. */
  code: string;
}

/** null when neither variable is set: no relay, the agent serves the LAN only. */
export function parseRelaySettings(
  url: string | undefined,
  code: string | undefined,
): RelaySettings | null {
  const rawUrl = url?.trim() ?? '';
  const rawCode = code?.trim() ?? '';
  if (!rawUrl && !rawCode) return null;
  if (!rawUrl) throw new Error('REMOTE_SHEEP_RELAY_CODE is set but REMOTE_SHEEP_RELAY is not');
  if (!rawCode) throw new Error('REMOTE_SHEEP_RELAY is set but REMOTE_SHEEP_RELAY_CODE is not');

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error('REMOTE_SHEEP_RELAY must be an http(s) URL, got: ' + rawUrl);
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error('REMOTE_SHEEP_RELAY must be an http(s) URL, got: ' + rawUrl);
  }
  return { url: parsed.origin, code: rawCode };
}

/**
 * Web Push uses the relay origin as its VAPID subject, and real push services may refuse a
 * non-https one. Plain http stays allowed so `wrangler dev` works; this is only a heads-up.
 */
export function relayPushWarning(settings: RelaySettings | null): string | null {
  if (!settings?.url.startsWith('http://')) return null;
  return 'REMOTE_SHEEP_RELAY is http: notifications need an https relay, push services may refuse this one';
}
