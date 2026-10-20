// `remote-sheep qr`'s side of the control channel: reads control.json and asks the running agent
// for a new pairing.
//
// control.json outlives an agent that was killed (Windows ends it without a goodbye), and its
// port may since belong to another program. So every failure to get an answer, quickly, reads
// as "not running" instead of a hang or a socket error. A program that took over that port,
// even under another user, could answer with links of its own: every link must name the agent
// key in this data folder, which only this agent can prove it holds when a device connects.
//
// `remote-sheep relay change` sends the relay access code, a secret of its own: before it does,
// the agent must prove it holds the secret in control.json (`/identify`), so an impostor on the
// port never sees the code.

import { randomBytes } from 'node:crypto';
import { request } from 'node:http';
import {
  constantTimeEqual,
  decodeInvite,
  type RelayChange,
  type RelayInfo,
} from '@remote-sheep/protocol';
import type { Pairing, PairingLink } from '../../L1_domain/pairing';
import { loadControlFile } from './control-file';
import { identityProof } from './http-control-server';

export const AGENT_NOT_RUNNING =
  'remote-sheep is not running. Start it with `remote-sheep start` (or the Herdr action ' +
  '"Start remote-sheep"), then try again.';

const AGENT_REFUSED =
  'The running remote-sheep refused the request. Restart it: `remote-sheep stop`, then ' +
  '`remote-sheep start`.';

export const AGENT_IMPOSTOR =
  "The program answering on remote-sheep's control port is not this remote-sheep, so nothing " +
  'is shown. Restart remote-sheep: `remote-sheep stop`, then `remote-sheep start`.';

const MAX_ANSWER_BYTES = 64 * 1024;
const PLACES = new Set(['relay', 'network', 'this-pc']);

export interface PairingRequest {
  /** control.json of the data folder. */
  controlFile: string;
  /** The public key in the same data folder; null when the agent never made one. */
  agentKey: Uint8Array | null;
  timeoutMs?: number;
}

export async function requestPairing(options: PairingRequest): Promise<Pairing> {
  const address = loadControlFile(options.controlFile);
  if (!address || !options.agentKey) throw new Error(AGENT_NOT_RUNNING);
  const answer = await post(
    address.port,
    '/pairing',
    { authorization: 'Bearer ' + address.secret },
    options.timeoutMs ?? 3000,
  );
  if (answer.status === 403) throw new Error(AGENT_REFUSED);
  const pairing = answer.status === 200 ? parsePairing(answer.body) : null;
  if (!pairing) throw new Error('remote-sheep gave an unexpected answer; restart it.');
  const agentKey = options.agentKey;
  if (!pairing.links.every((link) => namesAgent(link.url, agentKey))) {
    throw new Error(AGENT_IMPOSTOR);
  }
  return pairing;
}

export interface RelayRequest {
  /** control.json of the data folder. */
  controlFile: string;
  /** Absent: only read the relay. */
  change?: RelayChange;
  timeoutMs?: number;
}

/** Reads or changes the running agent's relay; rejects with a message for the person. */
export async function requestRelay(options: RelayRequest): Promise<RelayInfo> {
  const address = loadControlFile(options.controlFile);
  if (!address) throw new Error(AGENT_NOT_RUNNING);
  const timeoutMs = options.timeoutMs ?? 3000;
  const challenge = randomBytes(32).toString('base64url');
  const identity = await post(address.port, '/identify', { 'x-challenge': challenge }, timeoutMs);
  const proof = identity.status === 200 ? readField(identity.body, 'proof') : null;
  const expected = identityProof(address.secret, challenge);
  const encoder = new TextEncoder();
  if (proof === null || !constantTimeEqual(encoder.encode(proof), encoder.encode(expected))) {
    throw new Error(AGENT_IMPOSTOR);
  }
  const body = JSON.stringify(options.change ? { set: options.change } : {});
  const answer = await post(
    address.port,
    '/relay',
    { authorization: 'Bearer ' + address.secret, 'content-type': 'application/json' },
    timeoutMs,
    body,
  );
  if (answer.status === 403) throw new Error(AGENT_REFUSED);
  if (answer.status === 400) {
    throw new Error(readField(answer.body, 'error') ?? 'remote-sheep refused the change.');
  }
  const info = answer.status === 200 ? parseRelayInfo(answer.body) : null;
  if (!info) throw new Error('remote-sheep gave an unexpected answer; restart it.');
  return info;
}

function namesAgent(url: string, agentKey: Uint8Array): boolean {
  const marker = url.indexOf('#pair=');
  const invite = marker < 0 ? null : decodeInvite(url.slice(marker + '#pair='.length));
  return invite !== null && constantTimeEqual(invite.agentKey, agentKey);
}

function post(
  port: number,
  path: string,
  headers: Record<string, string>,
  timeoutMs: number,
  body?: string,
): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const notRunning = () => {
      reject(new Error(AGENT_NOT_RUNNING));
    };
    const req = request(
      {
        host: '127.0.0.1',
        port,
        method: 'POST',
        path,
        headers,
        // No keep-alive pool: the command exits as soon as it has its answer.
        agent: false,
      },
      (res) => {
        let text = '';
        res.setEncoding('utf8');
        res.on('data', (chunk: string) => {
          text += chunk;
          if (text.length > MAX_ANSWER_BYTES) req.destroy();
        });
        res.on('end', () => {
          clearTimeout(timer);
          resolve({ status: res.statusCode ?? 0, body: text });
        });
        res.on('error', notRunning);
      },
    );
    const timer = setTimeout(() => req.destroy(), timeoutMs);
    req.on('error', () => {
      clearTimeout(timer);
      notRunning();
    });
    req.on('close', () => {
      clearTimeout(timer);
    });
    req.end(body);
  });
}

function parsePairing(body: string): Pairing | null {
  let value: unknown;
  try {
    value = JSON.parse(body);
  } catch {
    return null;
  }
  if (typeof value !== 'object' || value === null) return null;
  const { links, expiresAt } = value as Record<string, unknown>;
  if (typeof expiresAt !== 'number' || !Array.isArray(links) || !links.length) return null;
  const parsed: PairingLink[] = [];
  for (const link of links as unknown[]) {
    if (typeof link !== 'object' || link === null) return null;
    const { where, url } = link as Record<string, unknown>;
    if (typeof where !== 'string' || !PLACES.has(where) || typeof url !== 'string') return null;
    parsed.push({ where: where as PairingLink['where'], url });
  }
  return { links: parsed, expiresAt };
}

function parseObject(body: string): Record<string, unknown> | null {
  try {
    const value: unknown = JSON.parse(body);
    return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function readField(body: string, name: string): string | null {
  const value = parseObject(body)?.[name];
  return typeof value === 'string' ? value : null;
}

function parseRelayInfo(body: string): RelayInfo | null {
  const value = parseObject(body);
  if (!value) return null;
  const { on, url, connected, fixed } = value;
  if (typeof on !== 'boolean' || typeof connected !== 'boolean' || typeof fixed !== 'boolean') {
    return null;
  }
  if (url !== null && typeof url !== 'string') return null;
  return { on, url, connected, fixed };
}
