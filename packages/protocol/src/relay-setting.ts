// What makes a relay setting usable, shared by the agent (which stores and dials it) and the
// app (which checks it before sending it): one rule, the same messages on both sides.
//
// The relay carries the phone's traffic over the internet, so only https is accepted; plain http
// only for a relay on this same computer, which is how `wrangler dev` serves one while testing.
// The code travels in an HTTP Authorization header, so it is printable ASCII with no spaces.

export interface RelaySetting {
  /** Origin of the relay, scheme included, without any path. */
  readonly url: string;
  /** The access code the relay owner issued to this agent. */
  readonly code: string;
}

/** What a paired device may ask of the relay: use this one, or turn it off and forget it. */
export type RelayChange = { url: string; code: string } | { off: true };

/** The relay as the agent runs it; the access code never travels back. */
export interface RelayInfo {
  /** Whether a relay is set. */
  on: boolean;
  /** Its origin, null while off. */
  url: string | null;
  /** Whether the agent's socket to it is open right now. */
  connected: boolean;
  /** Set by the REMOTE_SHEEP_RELAY variables on the computer, which only they can change. */
  fixed: boolean;
}

/** Whether there is a relay to show: on, with its URL. One rule for every reader of RelayInfo. */
export function relayIsOn(info: RelayInfo): info is RelayInfo & { url: string } {
  return info.on && info.url !== null;
}

export const MAX_RELAY_CODE_LENGTH = 256;

export const RELAY_URL_PROBLEM =
  'The relay URL must start with https:// (for example https://my-relay.workers.dev).';

export const RELAY_CODE_PROBLEM =
  'The access code must be 1 to ' + String(MAX_RELAY_CODE_LENGTH) + ' characters, with no spaces.';

const LOCAL_HOSTS = new Set(['127.0.0.1', 'localhost', '[::1]']);
const CODE = /^[\x21-\x7e]+$/;

export type RelaySettingCheck =
  | { readonly ok: true; readonly setting: RelaySetting }
  | { readonly ok: false; readonly error: string };

/** Trims both, keeps only the URL's origin, and says in plain words what is wrong. */
export function checkRelaySetting(url: string, code: string): RelaySettingCheck {
  const origin = relayOrigin(url.trim());
  if (!origin) return { ok: false, error: RELAY_URL_PROBLEM };
  const trimmed = code.trim();
  if (trimmed.length > MAX_RELAY_CODE_LENGTH || !CODE.test(trimmed)) {
    return { ok: false, error: RELAY_CODE_PROBLEM };
  }
  return { ok: true, setting: { url: origin, code: trimmed } };
}

function relayOrigin(text: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(text);
  } catch {
    return null;
  }
  if (parsed.username || parsed.password) return null;
  if (parsed.protocol === 'https:') return parsed.origin;
  if (parsed.protocol === 'http:' && LOCAL_HOSTS.has(parsed.hostname)) return parsed.origin;
  return null;
}
