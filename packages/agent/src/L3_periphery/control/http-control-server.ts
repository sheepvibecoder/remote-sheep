// The running agent's control channel: an HTTP server on 127.0.0.1 that only this PC can reach,
// so `remote-sheep qr` (the Herdr plugin's QR pane) can ask it for a new pairing and exit while
// the agent keeps running.
//
// Asking for a pairing lets the caller pair a device, so every request must carry the secret
// from control.json, which only the agent's owner can read. A web page in a browser on this PC
// can reach loopback too: it cannot read the secret, and a request carrying an Origin or a
// foreign Host (DNS rebinding) is refused before the secret is even looked at. Refusals say
// nothing about why.
//
// `remote-sheep relay change` sends the relay access code here. Before it does, it asks
// `/identify` (which needs no secret, only this PC) to prove that the server holds the secret in
// control.json: a program that took over a dead agent's port gets the old secret, never the code.

import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';
import { decodeRelayChange } from '@remote-sheep/protocol';
import type { PairingRequests } from '../../L1_domain/ports/pairing-requests';
import type { RelayRequests } from '../../L1_domain/ports/relay';
import { RELAY_DIAL_WAIT_MS } from '../../L2_application/relay-switch';

export interface HttpControlServerOptions {
  /** How long a connection may take to send its request; 5 s by default. */
  timeoutMs?: number | undefined;
  /** Lets this PC read and change the relay; without it there is no `/relay`. */
  relay?: RelayRequests | undefined;
}

/** What the server answers to `/identify`: proof that it holds `secret`, bound to `challenge`. */
export function identityProof(secret: string, challenge: string): string {
  return createHmac('sha256', secret)
    .update('remote-sheep control identity\n' + challenge)
    .digest('base64url');
}

const CHALLENGE = /^[\w-]{43}$/;
// A relay URL and code fit in far less; anything bigger is not our client.
const MAX_BODY_BYTES = 8 * 1024;

const HOST = '127.0.0.1';
const SECRET_BYTES = 32;
// Requests carry no body and answer at once; anything slower is not our client.
const REQUEST_TIMEOUT_MS = 5000;
// Node enforces the timeouts on a timer that runs every 30 s by default, so a silent connection
// would stay open for half a minute; checking every second closes it right after its timeout.
const CHECK_INTERVAL_MS = 1000;

export function isLoopbackAddress(address: string | undefined): boolean {
  return address === '127.0.0.1' || address === '::ffff:127.0.0.1' || address === '::1';
}

const digest = (text: string) => createHash('sha256').update(text, 'utf8').digest();

export class HttpControlServer {
  /** What a caller must send as `Authorization: Bearer <secret>`; new for every agent. */
  readonly secret = randomBytes(SECRET_BYTES).toString('base64url');
  private readonly expected = digest('Bearer ' + this.secret);
  private server: Server | null = null;
  private port = 0;

  constructor(
    private readonly operations: PairingRequests,
    private readonly options: HttpControlServerOptions = {},
  ) {}

  /** Listens on an ephemeral loopback port and resolves with it. */
  async start(): Promise<number> {
    const timeout = this.options.timeoutMs ?? REQUEST_TIMEOUT_MS;
    const server = createServer(
      {
        requestTimeout: timeout,
        headersTimeout: timeout,
        connectionsCheckingInterval: Math.min(CHECK_INTERVAL_MS, timeout),
      },
      (req, res) => {
        this.handle(req, res);
      },
    );
    // The request timeouts start with the first byte; a connection that sends nothing at all
    // is closed by the socket's own inactivity timeout.
    server.timeout = timeout;
    await new Promise<void>((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, HOST, () => {
        server.off('error', reject);
        resolve();
      });
    });
    this.server = server;
    this.port = (server.address() as AddressInfo).port;
    return this.port;
  }

  address(): { address: string; port: number } | null {
    const info = this.server?.address();
    return info && typeof info === 'object' ? { address: info.address, port: info.port } : null;
  }

  async stop(): Promise<void> {
    const server = this.server;
    this.server = null;
    if (!server) return;
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }

  private handle(req: IncomingMessage, res: ServerResponse): void {
    if (!this.fromThisPc(req)) {
      res.writeHead(403).end();
      return;
    }
    if (req.method === 'POST' && req.url === '/identify') {
      const challenge = req.headers['x-challenge'];
      if (typeof challenge !== 'string' || !CHALLENGE.test(challenge)) {
        res.writeHead(400).end();
        return;
      }
      answer(res, 200, { proof: identityProof(this.secret, challenge) });
      return;
    }
    if (!this.authorized(req)) {
      res.writeHead(403).end();
      return;
    }
    if (req.method === 'POST' && req.url === '/pairing') {
      answer(res, 200, this.operations.newPairing());
      return;
    }
    const relay = this.options.relay;
    if (relay && req.method === 'POST' && req.url === '/relay') {
      // A change answers only once the relay connected, failed or kept it waiting, so this one
      // connection may stay quiet that long without counting as a stalled client.
      req.socket.setTimeout(RELAY_DIAL_WAIT_MS + (this.options.timeoutMs ?? REQUEST_TIMEOUT_MS));
      void this.changeRelay(relay, req, res);
      return;
    }
    res.writeHead(404).end();
  }

  /** `{}` reads the relay; `{ "set": … }` changes it. Refusals carry the reason for the person. */
  private async changeRelay(
    relay: RelayRequests,
    req: IncomingMessage,
    res: ServerResponse,
  ): Promise<void> {
    const text = await readBody(req);
    if (text === null) {
      res.writeHead(413, { connection: 'close' }).end();
      return;
    }
    let value: unknown;
    try {
      value = JSON.parse(text);
    } catch {
      value = null;
    }
    const fields =
      typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null;
    const change = fields?.['set'] === undefined ? undefined : decodeRelayChange(fields['set']);
    if (!fields || change === null) {
      answer(res, 400, { error: 'malformed relay request' });
      return;
    }
    try {
      answer(res, 200, change ? await relay.changeRelay(change) : relay.relay());
    } catch (error) {
      answer(res, 400, { error: error instanceof Error ? error.message : String(error) });
    }
  }

  /** What a web page in a browser on this PC cannot pass: loopback, no Origin, our own Host. */
  private fromThisPc(req: IncomingMessage): boolean {
    if (!isLoopbackAddress(req.socket.remoteAddress)) return false;
    if (req.headers.origin !== undefined) return false;
    return req.headers.host === HOST + ':' + String(this.port);
  }

  private authorized(req: IncomingMessage): boolean {
    // Hashing first gives equal lengths, so the comparison leaks neither content nor length.
    return timingSafeEqual(digest(req.headers.authorization ?? ''), this.expected);
  }
}

function answer(res: ServerResponse, status: number, value: unknown): void {
  res.writeHead(status, { 'content-type': 'application/json', 'cache-control': 'no-store' });
  res.end(JSON.stringify(value));
}

/** The body as text; null once it passes the limit, without reading the rest. */
function readBody(req: IncomingMessage): Promise<string | null> {
  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    let size = 0;
    req.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        req.removeAllListeners('data');
        req.pause();
        resolve(null);
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      resolve(Buffer.concat(chunks).toString('utf8'));
    });
    req.on('error', () => {
      resolve(null);
    });
  });
}
