// `remote-sheep qr`'s side of the control channel: reads control.json and asks the running agent
// for a new pairing.
//
// control.json outlives an agent that was killed (Windows ends it without a goodbye), and its
// port may since belong to another program. So every failure to get an answer, quickly, reads
// as "not running" instead of a hang or a socket error. A program that took over that port,
// even under another user, could answer with links of its own: every link must name the agent
// key in this data folder, which only this agent can prove it holds when a device connects.

import { request } from 'node:http';
import { constantTimeEqual, decodeInvite } from '@remote-sheep/protocol';
import type { Pairing, PairingLink } from '../../L1_domain/pairing';
import { loadControlFile } from './control-file';

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
  const answer = await post(address.port, '/pairing', address.secret, options.timeoutMs ?? 3000);
  if (answer.status === 403) throw new Error(AGENT_REFUSED);
  const pairing = answer.status === 200 ? parsePairing(answer.body) : null;
  if (!pairing) throw new Error('remote-sheep gave an unexpected answer; restart it.');
  const agentKey = options.agentKey;
  if (!pairing.links.every((link) => namesAgent(link.url, agentKey))) {
    throw new Error(AGENT_IMPOSTOR);
  }
  return pairing;
}

function namesAgent(url: string, agentKey: Uint8Array): boolean {
  const marker = url.indexOf('#pair=');
  const invite = marker < 0 ? null : decodeInvite(url.slice(marker + '#pair='.length));
  return invite !== null && constantTimeEqual(invite.agentKey, agentKey);
}

function post(
  port: number,
  path: string,
  secret: string,
  timeoutMs: number,
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
        headers: { authorization: 'Bearer ' + secret },
        // No keep-alive pool: the command exits as soon as it has its answer.
        agent: false,
      },
      (res) => {
        let body = '';
        res.setEncoding('utf8');
        res.on('data', (chunk: string) => {
          body += chunk;
          if (body.length > MAX_ANSWER_BYTES) req.destroy();
        });
        res.on('end', () => {
          clearTimeout(timer);
          resolve({ status: res.statusCode ?? 0, body });
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
    req.end();
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
