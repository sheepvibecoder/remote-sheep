// The running agent's control channel: an HTTP server on 127.0.0.1 that only this PC can reach,
// so `remote-sheep qr` (the Herdr plugin's QR pane) can ask it for a new pairing and exit while
// the agent keeps running.
//
// Asking for a pairing lets the caller pair a device, so every request must carry the secret
// from control.json, which only the agent's owner can read. A web page in a browser on this PC
// can reach loopback too: it cannot read the secret, and a request carrying an Origin or a
// foreign Host (DNS rebinding) is refused before the secret is even looked at. Refusals say
// nothing about why. Later operations (P4: set the relay) are more routes in `handle`.

import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';
import type { PairingRequests } from '../../L1_domain/ports/pairing-requests';

export interface HttpControlServerOptions {
  /** How long a connection may take to send its request; 5 s by default. */
  timeoutMs?: number | undefined;
}

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
    if (!this.allowed(req)) {
      res.writeHead(403).end();
      return;
    }
    if (req.method === 'POST' && req.url === '/pairing') {
      const body = JSON.stringify(this.operations.newPairing());
      res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' });
      res.end(body);
      return;
    }
    res.writeHead(404).end();
  }

  private allowed(req: IncomingMessage): boolean {
    if (!isLoopbackAddress(req.socket.remoteAddress)) return false;
    if (req.headers.origin !== undefined) return false;
    if (req.headers.host !== HOST + ':' + String(this.port)) return false;
    // Hashing first gives equal lengths, so the comparison leaks neither content nor length.
    return timingSafeEqual(digest(req.headers.authorization ?? ''), this.expected);
  }
}
