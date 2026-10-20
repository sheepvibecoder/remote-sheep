// Phones on the same network reach the agent directly: one HTTP(S) server that
// serves the phone app and upgrades /ws to a WebSocket.
//
// This adapter only moves bytes. Who may talk, and in which format, is the
// channel's business, so the relay of stage 3 can replace this file alone.
//
// One exception: `POST /local-pairing` hands a new invite to the app page when it was opened
// in a browser on this PC, so that browser pairs with no QR. Only such a page can pass its checks:
// the connection comes from loopback (never the LAN, and the relay never reaches this server),
// the Host is this server's own loopback name (a DNS-rebinding page names its own domain), and
// the Origin is that same address (another site's page, or a request with no Origin, is refused).
// No CORS header is ever sent. Any program on this PC can still ask, as it could read the agent's
// files: that is the trade-off of pairing "only from your PC".

import { readFileSync } from 'node:fs';
import {
  createServer as createHttp,
  type IncomingMessage,
  type Server,
  type ServerResponse,
} from 'node:http';
import { createServer as createHttps } from 'node:https';
import type { AddressInfo } from 'node:net';
import { extname, resolve, sep } from 'node:path';
import { type RawData, WebSocket, WebSocketServer } from 'ws';
import { CLOSE_PROTOCOL, RELAY_PING, RELAY_PONG } from '@remote-sheep/protocol';
import type { Link, LinkServer } from '../../L1_domain/ports/link';
import { isLoopbackAddress } from '../control/http-control-server';

export interface LanOptions {
  port: number;
  /** Built phone app (index.html and its assets). */
  appDir: string;
  tls?: { cert: Buffer; key: Buffer };
  /** How to change the port, added to the message when it is already in use. */
  busyHint?: string;
  /** A new encoded invite for a browser on this PC; without it there is no `/local-pairing`. */
  localInvite?: () => string;
}

const LOCAL_PAIRING = '/local-pairing';
const LOOPBACK_NAMES = ['localhost', '127.0.0.1'];

// Above the 12 MB upload limit, so a photo just over it is refused with a
// message by the upload store instead of a dropped socket.
const MAX_MESSAGE_BYTES = 16 * 1024 * 1024;

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.woff2': 'font/woff2',
};

function toBytes(data: RawData): Uint8Array {
  if (Array.isArray(data)) return Buffer.concat(data);
  return data instanceof ArrayBuffer ? new Uint8Array(data) : data;
}

// Handlers start as no-ops: a frame or a close can arrive before the channel subscribes.
const ignore = (): void => undefined;

class LanLink implements Link {
  private message: (data: Uint8Array) => void = ignore;
  private end: () => void = ignore;

  constructor(private readonly socket: WebSocket) {
    socket.on('message', (data, isBinary) => {
      // Every message is a binary frame. The only text allowed is the phone's keepalive
      // (it sends the same ping to the relay); other text is what the stage 1 app sends.
      if (!isBinary) {
        if (new TextDecoder().decode(toBytes(data)) === RELAY_PING) {
          if (socket.readyState === WebSocket.OPEN) socket.send(RELAY_PONG);
          return;
        }
        this.close(CLOSE_PROTOCOL, 'binary frames only');
        return;
      }
      this.message(toBytes(data));
    });
    socket.on('close', () => this.end());
    socket.on('error', () => socket.terminate());
  }

  send(data: Uint8Array): void {
    if (this.socket.readyState === WebSocket.OPEN) this.socket.send(data);
  }

  close(code: number, reason: string): void {
    this.socket.close(code, reason);
  }

  onMessage(handler: (data: Uint8Array) => void): void {
    this.message = handler;
  }

  onClose(handler: () => void): void {
    this.end = handler;
  }
}

export class LanTransport implements LinkServer {
  private server: Server | null = null;
  private sockets: WebSocketServer | null = null;
  private readonly appDir: string;

  constructor(private readonly options: LanOptions) {
    this.appDir = resolve(options.appDir);
  }

  async start(accept: (link: Link) => void): Promise<void> {
    const serveFile = (req: IncomingMessage, res: ServerResponse) => this.serve(req, res);
    const server = this.options.tls
      ? createHttps({ cert: this.options.tls.cert, key: this.options.tls.key }, serveFile)
      : createHttp(serveFile);
    const sockets = new WebSocketServer({ server, path: '/ws', maxPayload: MAX_MESSAGE_BYTES });
    sockets.on('connection', (socket) => accept(new LanLink(socket)));
    // The socket server re-emits every error of the http server; the listen
    // below already reports them, and an unheard error would end the process.
    sockets.on('error', ignore);

    this.server = server;
    this.sockets = sockets;
    await new Promise<void>((done, fail) => {
      server.once('error', (err: NodeJS.ErrnoException) => {
        fail(
          err.code === 'EADDRINUSE'
            ? new Error(
                'port ' +
                  this.options.port +
                  ' is already in use; is remote-sheep already running?' +
                  (this.options.busyHint ? ' Or ' + this.options.busyHint + '.' : ''),
              )
            : err,
        );
      });
      server.listen(this.options.port, '0.0.0.0', () => done());
    });
  }

  async stop(): Promise<void> {
    for (const client of this.sockets?.clients ?? []) client.terminate();
    this.sockets?.close();
    await new Promise<void>((done) => (this.server ? this.server.close(() => done()) : done()));
    this.server = null;
    this.sockets = null;
  }

  port(): number {
    return (this.server?.address() as AddressInfo | null)?.port ?? 0;
  }

  private serve(req: IncomingMessage, res: ServerResponse): void {
    const notFound = () => {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      res.end('not found');
    };
    if (this.options.localInvite && req.method === 'POST' && req.url === LOCAL_PAIRING) {
      this.pairLocally(req, res, this.options.localInvite);
      return;
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      notFound();
      return;
    }

    let pathname: string;
    try {
      pathname = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname);
    } catch {
      notFound();
      return;
    }
    const wanted = pathname === '/' ? '/index.html' : pathname;
    // Resolving first and checking the prefix after is what stops a request
    // like /../../secrets from escaping the directory.
    const file = resolve(this.appDir, '.' + wanted);
    if (!file.startsWith(this.appDir + sep)) {
      notFound();
      return;
    }

    let body: Buffer;
    try {
      body = readFileSync(file);
    } catch {
      notFound();
      return;
    }
    // Hashed asset names never change, so only they may be cached; the page
    // and the manifest must always be fresh or a fix never reaches the phone.
    const hashed = /[.-][A-Za-z0-9_-]{8,}\.(js|css)$/.test(file);
    res.writeHead(200, {
      'content-type': TYPES[extname(file)] ?? 'application/octet-stream',
      'cache-control': hashed ? 'public, max-age=31536000, immutable' : 'no-store',
      'x-content-type-options': 'nosniff',
    });
    res.end(req.method === 'HEAD' ? undefined : body);
  }

  /** Refusals say nothing about why and make no invite, so the live QR stays valid. */
  private pairLocally(req: IncomingMessage, res: ServerResponse, invite: () => string): void {
    if (!this.fromThisPcPage(req)) {
      res.writeHead(403).end();
      return;
    }
    res.writeHead(200, {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    });
    res.end(JSON.stringify({ invite: invite() }));
  }

  private fromThisPcPage(req: IncomingMessage): boolean {
    if (!isLoopbackAddress(req.socket.remoteAddress)) return false;
    const host = req.headers.host;
    const own = LOOPBACK_NAMES.map((name) => name + ':' + String(this.port()));
    if (host === undefined || !own.includes(host)) return false;
    const scheme = this.options.tls ? 'https://' : 'http://';
    if (req.headers.origin !== scheme + host) return false;
    // Browsers that send it say where the request came from; only the page itself may ask.
    const site = req.headers['sec-fetch-site'];
    return site === undefined || site === 'same-origin';
  }
}
