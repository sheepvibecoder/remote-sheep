// Every message that travels between the phone and the agent.
//
// The phone and the agent compile against this one file, so a change to the
// wire format breaks the build on both sides instead of at runtime. Anything
// arriving from the network still goes through the decoders, because the
// compiler cannot vouch for bytes it never saw.
//
// Since protocol 2 these messages travel sealed inside the session that the
// handshake in `secure/` opens; only the two handshake frames go in clear.

import { decodeFrame, encodeFrame } from './frame';
import type { RelayChange, RelayInfo } from './relay-setting';
import { decodeBase64Url } from './secure/base64url';

export { decodeFrame, encodeFrame, type Frame } from './frame';
export { PROTOCOL } from './version';
export {
  decodeRelayEnvelope,
  encodeRelayEnvelope,
  isSendableCloseCode,
  type RelayEnvelope,
} from './relay-envelope';
export { decodeBase64Url, encodeBase64Url } from './secure/base64url';
export {
  checkRelaySetting,
  MAX_RELAY_CODE_LENGTH,
  RELAY_CODE_PROBLEM,
  RELAY_URL_PROBLEM,
  relayIsOn,
  type RelayChange,
  type RelayInfo,
  type RelaySetting,
  type RelaySettingCheck,
} from './relay-setting';
export { constantTimeEqual, generateKeyPair, publicKeyId, type KeyPair } from './secure/keys';
export {
  decodeInvite,
  encodeInvite,
  pairingProof,
  verifyPairingProof,
  type Invite,
} from './secure/invite';
export {
  acceptHandshake,
  startHandshake,
  type AcceptedHandshake,
  type Hello,
  type PhoneHandshake,
  type Welcome,
} from './secure/handshake';
export { decodeHello, decodeWelcome, encodeHello, encodeWelcome } from './secure/handshake-frames';
export type { SecureSession } from './secure/secure-session';

/** The coding agents a phone can ask Herdr to start; anything else is refused at the door. */
export const AGENT_KINDS = ['claude', 'codex'] as const;
export type AgentKind = (typeof AGENT_KINDS)[number];

export type AgentStatus = 'idle' | 'working' | 'blocked' | 'done' | 'unknown';

/** A coding agent with a transcript, or a plain shell that only has its terminal. */
export type SessionKind = 'agent' | 'shell';

export interface Session {
  /** Herdr pane id; every request names a session by it. */
  target: string;
  kind: SessionKind;
  title: string;
  status: AgentStatus;
  cwd: string;
  /** Last folder of cwd, which is how people name their projects. */
  project: string;
  /** Id of the Herdr workspace the pane lives in; empty when Herdr does not say. */
  space: string;
  /**
   * The coding agent Herdr detected in the pane (`claude`, `codex`, …), as Herdr names it.
   * Optional rather than null so an agent of the same protocol from before it existed still
   * fits; absent for a shell or when Herdr does not say.
   */
  agent?: string;
}

/** A Herdr workspace: where the phone can open a new session. */
export interface Workspace {
  id: string;
  label: string;
}

export type Role = 'user' | 'assistant';

/**
 * `at` is when the message was written (epoch ms), as the transcript dates it. Optional rather
 * than null so a phone or agent from before it existed still fits; absent when the line carries
 * no readable time.
 */
export type ChatMessage =
  | { id: string; role: Role; kind: 'text'; text: string; at?: number }
  // The bytes stay out of the chat payload: one screenshot is tens of
  // kilobytes, so the phone asks for it only when it scrolls into view.
  | { id: string; role: Role; kind: 'image'; media: string; at?: number };

/** A phone paired with the agent, as the phone's "linked devices" list shows it. */
export interface LinkedDevice {
  /** `publicKeyId` of the phone's identity key. */
  id: string;
  /** Epoch milliseconds, like every time below. */
  pairedAt: number;
  lastSeen: number;
  /** The first instant the agent no longer accepts the pairing. */
  expiresAt: number;
  /** True for the phone that asked. */
  current: boolean;
}

// ---- phone -> agent ----

/** Where one phone's browser wants its notifications: what `PushSubscription.toJSON()` gives. */
export interface PushSubscription {
  /** The push service URL; posting to it reaches this phone. */
  readonly endpoint: string;
  /** The phone's P-256 public key, base64url (65 bytes decoded). */
  readonly p256dh: string;
  /** The phone's authentication secret, base64url (16 bytes decoded). */
  readonly auth: string;
}

export type Request =
  /**
   * Which session to stream; null streams only the list. The raw terminal streams when
   * `terminal`; the chat streams when `chat`, which defaults to `!terminal` so a phone that never
   * sends it gets one or the other as before. Both at once is the split view. An agent older than
   * `chat` drops the field and streams only the terminal, so no protocol bump is needed.
   */
  | { kind: 'watch'; target: string | null; terminal: boolean; chat?: boolean }
  | { kind: 'prompt'; target: string; text: string }
  | { kind: 'keys'; target: string; keys: string[] }
  | { kind: 'image'; target: string; id: string }
  /** data travels as the frame's bytes. */
  | { kind: 'upload'; media: string; data: Uint8Array }
  | { kind: 'devices' }
  /** Unpairs the device exactly as `remote-sheep revoke <id>` does. */
  | { kind: 'unlink'; id: string }
  /** The agent's VAPID public key, which the phone needs to subscribe. */
  | { kind: 'push-key' }
  /**
   * Stores this phone's push subscription, replacing any earlier one. p256dh
   * and auth are base64url, as `PushSubscription.toJSON()` gives them.
   */
  | ({ kind: 'push-subscribe' } & PushSubscription)
  | { kind: 'push-unsubscribe' }
  /** The Herdr workspaces, to group sessions and to pick where a new one starts. */
  | { kind: 'spaces' }
  /** Reads whether phones may use plain consoles, or sets it when `on` is given. */
  | { kind: 'shells'; on?: boolean }
  /** Reads the relay, or changes it when `set` is given; the agent connects without a restart. */
  | { kind: 'relay'; set?: RelayChange }
  /**
   * Starts a coding agent (Claude Code when `agent` is absent, as older phones ask), or a plain
   * shell, in a new tab of this workspace.
   */
  | { kind: 'new-session'; space: string; shell: boolean; agent?: AgentKind };

export type ClientMessage =
  /**
   * First sealed frame after the handshake. When pairing, `proof` is
   * `pairingProof(invite secret, transcript)`; a paired phone sends none.
   */
  { type: 'confirm'; proof?: string } | { type: 'request'; id: number; request: Request };

// ---- agent -> phone ----

export interface ImageResult {
  media: string;
  /** Travels as the frame's bytes. */
  data: Uint8Array;
}

export interface PushKey {
  /** The VAPID public key: an uncompressed P-256 point, base64url. */
  key: string;
}

export interface UploadResult {
  /** Absolute path on the PC; the order names it so the session can open it. */
  path: string;
  name: string;
  bytes: number;
}

/** What each request kind answers with. */
export interface Results {
  watch: undefined;
  prompt: undefined;
  keys: undefined;
  image: ImageResult;
  upload: UploadResult;
  devices: LinkedDevice[];
  unlink: undefined;
  'push-key': PushKey;
  'push-subscribe': undefined;
  'push-unsubscribe': undefined;
  spaces: Workspace[];
  shells: { on: boolean };
  relay: RelayInfo;
  /** The pane of the new session, ready to open as a chat. */
  'new-session': { target: string };
}

export type ResultOf<R extends Request> = Results[R['kind']];

export type ServerMessage =
  /** device: the phone's id (`publicKeyId` of its identity key) as the agent stores it. */
  | { type: 'ready'; protocol: number; version: string; device: string }
  | { type: 'sessions'; sessions: Session[] }
  /**
   * model: the model of the latest reply, as the transcript names it; absent when unknown.
   * usedTokens: how much of the context window the session fills after its latest reply (input
   * plus cached tokens of that reply); absent when unknown, so older phones and agents still fit.
   */
  | {
      type: 'chat';
      target: string;
      messages: ChatMessage[];
      note: string | null;
      model?: string;
      usedTokens?: number;
    }
  | { type: 'terminal'; target: string; output: string }
  /** Why the agent cannot reach Herdr; null once it can again. */
  | { type: 'status'; herdrError: string | null }
  /** The paired phones again, after one was paired or unlinked. */
  | { type: 'devices'; devices: LinkedDevice[] }
  | { type: 'reply'; id: number; ok: true; result?: unknown }
  | { type: 'reply'; id: number; ok: false; error: string };

/** The handshake, up to the confirm, must complete within this window. */
export const AUTH_TIMEOUT_MS = 5000;

/**
 * Close code for an unknown phone, a wrong pairing proof, a malformed
 * handshake or a frame that fails to decrypt.
 */
export const CLOSE_UNAUTHORIZED = 4001;

/** Close code sent to a peer that speaks another protocol version or text frames. */
export const CLOSE_PROTOCOL = 4002;

/**
 * Close code for a pairing that expired or was revoked: unlike 4001 the phone
 * knows its key is no longer accepted and asks the user to scan a new QR.
 */
export const CLOSE_PAIRING_EXPIRED = 4003;

/**
 * Close code from the relay to a phone whose agent just left. A phone that connects while
 * the agent is offline gets HTTP 503 instead. Not final: the phone retries until it returns.
 */
export const CLOSE_AGENT_OFFLINE = 4010;

/**
 * Keepalive text frames. The relay answers them without waking up, so idle
 * sockets stay open behind Cloudflare's proxy at no cost.
 */
export const RELAY_PING = 'ping';
export const RELAY_PONG = 'pong';

// ---- validation ----

type Json = Record<string, unknown>;

const isObject = (value: unknown): value is Json =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isText = (value: unknown): value is string => typeof value === 'string' && value.length > 0;

/** An HMAC-SHA256 pairing proof: 32 bytes as canonical base64url. */
const isProof = (value: unknown): value is string =>
  typeof value === 'string' && decodeBase64Url(value)?.length === 32;

/** base64url text that decodes to exactly `length` bytes. */
const isKeyOf = (value: unknown, length: number): value is string =>
  typeof value === 'string' && decodeBase64Url(value)?.length === length;

/** The agent posts to the endpoint, so only https and a parsable URL get stored. */
function isHttpsUrl(value: unknown): value is string {
  if (!isText(value)) return false;
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

function parseRequest(value: unknown, bytes: Uint8Array | null): Request | null {
  if (!isObject(value)) return null;
  // Only an upload carries bytes; anywhere else they are a malformed frame.
  if (value['kind'] === 'upload') {
    if (!isText(value['media']) || !bytes) return null;
    return { kind: 'upload', media: value['media'], data: bytes };
  }
  if (bytes) return null;
  switch (value['kind']) {
    case 'watch':
      if (value['target'] !== null && !isText(value['target'])) return null;
      if (typeof value['terminal'] !== 'boolean') return null;
      if (value['chat'] !== undefined && typeof value['chat'] !== 'boolean') return null;
      return {
        kind: 'watch',
        target: value['target'],
        terminal: value['terminal'],
        ...(value['chat'] === undefined ? {} : { chat: value['chat'] }),
      };
    case 'prompt':
      if (!isText(value['target']) || !isText(value['text'])) return null;
      return { kind: 'prompt', target: value['target'], text: value['text'] };
    case 'keys':
      if (!isText(value['target']) || !Array.isArray(value['keys']) || value['keys'].length === 0) {
        return null;
      }
      if (!value['keys'].every(isText)) return null;
      return { kind: 'keys', target: value['target'], keys: value['keys'] };
    case 'image':
      if (!isText(value['target']) || !isText(value['id'])) return null;
      return { kind: 'image', target: value['target'], id: value['id'] };
    case 'devices':
      return { kind: 'devices' };
    case 'unlink':
      if (!isText(value['id'])) return null;
      return { kind: 'unlink', id: value['id'] };
    case 'push-key':
      return { kind: 'push-key' };
    case 'push-subscribe': {
      const { endpoint, p256dh, auth } = value;
      if (!isHttpsUrl(endpoint) || !isKeyOf(p256dh, 65) || !isKeyOf(auth, 16)) return null;
      return { kind: 'push-subscribe', endpoint, p256dh, auth };
    }
    case 'push-unsubscribe':
      return { kind: 'push-unsubscribe' };
    case 'spaces':
      return { kind: 'spaces' };
    case 'shells':
      if (value['on'] !== undefined && typeof value['on'] !== 'boolean') return null;
      return { kind: 'shells', ...(value['on'] === undefined ? {} : { on: value['on'] }) };
    case 'relay': {
      if (value['set'] === undefined) return { kind: 'relay' };
      const set = decodeRelayChange(value['set']);
      return set ? { kind: 'relay', set } : null;
    }
    case 'new-session': {
      if (!isText(value['space'])) return null;
      // Absent from phones older than shells: they only ever start Claude Code.
      if (value['shell'] !== undefined && typeof value['shell'] !== 'boolean') return null;
      const agent = value['agent'];
      if (agent !== undefined && !AGENT_KINDS.some((known) => known === agent)) return null;
      return {
        kind: 'new-session',
        space: value['space'],
        shell: value['shell'] === true,
        ...(agent === undefined ? {} : { agent: agent as AgentKind }),
      };
    }
    default:
      return null;
  }
}

// Generous bounds on the shape only: what makes a URL or a code usable is `checkRelaySetting`,
// which the agent applies so the device hears why, instead of an unknown-request answer.
const MAX_RELAY_URL_TEXT = 2048;
const MAX_RELAY_CODE_TEXT = 1024;

/** A relay change of the right shape, or null; also what the agent's control channel reads. */
export function decodeRelayChange(value: unknown): RelayChange | null {
  if (!isObject(value)) return null;
  const keys = Object.keys(value);
  if (value['off'] === true) return keys.length === 1 ? { off: true } : null;
  const { url, code } = value;
  if (keys.length !== 2 || typeof url !== 'string' || typeof code !== 'string') return null;
  if (url.length > MAX_RELAY_URL_TEXT || code.length > MAX_RELAY_CODE_TEXT) return null;
  return { url, code };
}

// ---- codecs ----

/** Moves a `data` byte field out of an object, so it can travel as the frame's bytes. */
function splitBytes(value: unknown): [unknown, Uint8Array | null] {
  if (!isObject(value) || !(value['data'] instanceof Uint8Array)) return [value, null];
  const { data, ...rest } = value;
  return [rest, data];
}

export function encodeClientMessage(message: ClientMessage): Uint8Array {
  if (message.type !== 'request') return encodeFrame(message);
  const [request, bytes] = splitBytes(message.request);
  return encodeFrame({ ...message, request }, bytes);
}

/** Returns null for anything that is not a well-formed client message. */
export function decodeClientMessage(data: Uint8Array): ClientMessage | null {
  const frame = decodeFrame(data);
  if (!frame || !isObject(frame.header)) return null;
  const value = frame.header;

  if (value['type'] === 'confirm') {
    if (frame.bytes) return null;
    if (!('proof' in value)) return { type: 'confirm' };
    return isProof(value['proof']) ? { type: 'confirm', proof: value['proof'] } : null;
  }
  if (value['type'] === 'request') {
    if (!Number.isSafeInteger(value['id'])) return null;
    const request = parseRequest(value['request'], frame.bytes);
    return request ? { type: 'request', id: value['id'] as number, request } : null;
  }
  return null;
}

const REQUEST_KINDS: ReadonlySet<string> = new Set<Request['kind']>([
  'watch',
  'prompt',
  'keys',
  'image',
  'upload',
  'devices',
  'unlink',
  'push-key',
  'push-subscribe',
  'push-unsubscribe',
]);

/**
 * The id and kind of a well-formed request of a kind this build does not know;
 * null for anything else. A newer app may ask an older agent for something
 * new, and an answer that says so beats a dropped connection.
 */
export function readUnknownRequest(data: Uint8Array): { id: number; kind: string } | null {
  const frame = decodeFrame(data);
  if (!frame || !isObject(frame.header)) return null;
  const { type, id, request } = frame.header;
  if (type !== 'request' || !Number.isSafeInteger(id) || !isObject(request)) return null;
  const kind = request['kind'];
  if (!isText(kind) || REQUEST_KINDS.has(kind)) return null;
  return { id: id as number, kind };
}

export function encodeServerMessage(message: ServerMessage): Uint8Array {
  if (message.type !== 'reply' || !message.ok) return encodeFrame(message);
  const [result, bytes] = splitBytes(message.result);
  return encodeFrame({ ...message, result }, bytes);
}

/**
 * The phone talks only to the agent it paired with, so this checks the shape
 * loosely: a message type, and reply bytes put back where the agent took them.
 */
export function decodeServerMessage(data: Uint8Array): ServerMessage | null {
  const frame = decodeFrame(data);
  if (!frame || !isObject(frame.header) || typeof frame.header['type'] !== 'string') return null;
  const message = frame.header as ServerMessage;
  if (frame.bytes && message.type === 'reply' && message.ok && isObject(message.result)) {
    return { ...message, result: { ...message.result, data: frame.bytes } };
  }
  return message;
}
