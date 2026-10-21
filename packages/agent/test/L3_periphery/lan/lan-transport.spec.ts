import { mkdtempSync, writeFileSync } from 'node:fs';
import { request as httpRequest } from 'node:http';
import { networkInterfaces, tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import WebSocket from 'ws';
import { CLOSE_PROTOCOL, SECURITY_HEADERS } from '@remote-sheep/protocol';
import { LanTransport } from '../../../src/L3_periphery/lan/lan-transport';
import type { Link } from '../../../src/L1_domain/ports/link';

function connect(port: number, path = '/ws', headers: Record<string, string> = {}) {
  const socket = new WebSocket('ws://127.0.0.1:' + port + path, { headers });
  // A refused upgrade is an expected outcome here, not an unhandled error.
  socket.on('error', () => undefined);
  const inbox: Buffer[] = [];
  socket.on('message', (data) => inbox.push(data as Buffer));
  const closed = new Promise<number>((resolve) => socket.on('close', (code) => resolve(code)));
  const opened = new Promise<void>((resolve) => socket.on('open', () => resolve()));
  return { socket, inbox, closed, opened };
}

async function until(check: () => boolean) {
  for (let i = 0; i < 100 && !check(); i++) await new Promise((r) => setTimeout(r, 20));
}

describe('LanTransport', () => {
  let transport: LanTransport | undefined;

  afterEach(async () => {
    await transport?.stop();
    transport = undefined;
  });

  async function start(
    accept: (link: Link) => void = () => {},
    extra: { maxPending?: number; pendingMs?: number } = {},
  ) {
    const appDir = mkdtempSync(join(tmpdir(), 'sheep-app-'));
    writeFileSync(join(appDir, 'index.html'), '<h1>sheep</h1>');
    transport = new LanTransport({ port: 0, appDir, ...extra });
    await transport.start(accept);
    return transport.port();
  }

  it('sends the security headers with the page and with a static asset', async () => {
    const port = await start();
    for (const path of ['/', '/index.html']) {
      const response = await fetch('http://127.0.0.1:' + port + path);
      for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
        expect(response.headers.get(name), path + ' ' + name).toBe(value);
      }
    }
  });

  it('moves binary frames both ways without reading them', async () => {
    const received: Uint8Array[] = [];
    const port = await start((link) =>
      link.onMessage((data) => {
        received.push(data);
        link.send(new Uint8Array([...data].reverse()));
      }),
    );
    const phone = connect(port);
    await phone.opened;
    phone.socket.send(new Uint8Array([1, 2, 3]));
    await until(() => phone.inbox.length > 0);
    expect(received.map((data) => [...data])).toEqual([[1, 2, 3]]);
    expect([...phone.inbox[0]!]).toEqual([3, 2, 1]);
  });

  it('closes a phone that sends text frames, as the stage 1 app does', async () => {
    const received: Uint8Array[] = [];
    const phone = connect(await start((link) => link.onMessage((data) => received.push(data))));
    await phone.opened;
    phone.socket.send(JSON.stringify({ type: 'auth', token: 'x' }));
    expect(await phone.closed).toBe(CLOSE_PROTOCOL);
    expect(received).toEqual([]);
  });

  it('answers a text ping with pong, the keepalive the phone sends', async () => {
    const received: Uint8Array[] = [];
    const phone = connect(await start((link) => link.onMessage((data) => received.push(data))));
    const texts: string[] = [];
    phone.socket.on('message', (data, isBinary) => {
      if (!isBinary) texts.push((data as Buffer).toString());
    });
    await phone.opened;
    phone.socket.send('ping');
    await until(() => texts.length > 0);
    expect(texts).toEqual(['pong']);
    expect(received).toEqual([]);
    expect(phone.socket.readyState).toBe(WebSocket.OPEN);
  });

  it('accepts a connection that names the agent room in the query string', async () => {
    let accepted = 0;
    const port = await start(() => accepted++);
    const phone = connect(port, '/ws?agent=0123456789abcdef');
    await phone.opened;
    await until(() => accepted > 0);
    expect(accepted).toBe(1);
  });

  it('closes the socket with the code the channel chose, and reports the end', async () => {
    let ended = false;
    const port = await start((link) => {
      link.onClose(() => (ended = true));
      link.onMessage(() => link.close(4003, 'revoked'));
    });
    const phone = connect(port);
    await phone.opened;
    phone.socket.send(new Uint8Array([0]));
    expect(await phone.closed).toBe(4003);
    await until(() => ended);
    expect(ended).toBe(true);
  });

  describe('the /ws upgrade', () => {
    /** Resolves with the HTTP status of a refused upgrade, or 101 when it opened. */
    function outcome(phone: ReturnType<typeof connect>): Promise<number> {
      return new Promise((resolve) => {
        phone.socket.on('unexpected-response', (_req, res) => resolve(res.statusCode ?? 0));
        phone.socket.on('open', () => resolve(101));
      });
    }

    it('refuses a page from another origin, and accepts the own origin or none', async () => {
      const port = await start();
      const own = 'http://127.0.0.1:' + String(port);
      expect(await outcome(connect(port, '/ws', { origin: 'https://evil.example' }))).toBe(403);
      expect(await outcome(connect(port, '/ws', { origin: 'null' }))).toBe(403);
      expect(await outcome(connect(port, '/ws', { origin: 'http://127.0.0.1:1' }))).toBe(403);
      expect(await outcome(connect(port, '/ws', { origin: own }))).toBe(101);
      expect(await outcome(connect(port))).toBe(101);
    });

    it('refuses the link past the pending cap, and takes one again when one closes', async () => {
      const port = await start(() => {}, { maxPending: 2, pendingMs: 60_000 });
      const first = connect(port);
      expect(await outcome(first)).toBe(101);
      expect(await outcome(connect(port))).toBe(101);
      expect(await outcome(connect(port))).toBe(503);
      first.socket.close();
      await first.closed;
      expect(await outcome(connect(port))).toBe(101);
    });

    it('stops counting a link that is still open after the handshake time', async () => {
      const port = await start(() => {}, { maxPending: 1, pendingMs: 100 });
      expect(await outcome(connect(port))).toBe(101);
      expect(await outcome(connect(port))).toBe(503);
      await new Promise((r) => setTimeout(r, 200));
      expect(await outcome(connect(port))).toBe(101);
    });
  });

  it('reports a port already in use instead of crashing', async () => {
    const port = await start();
    const second = new LanTransport({ port, appDir: '.' });
    await expect(second.start(() => {})).rejects.toThrow(
      'port ' + String(port) + ' is already in use; is remote-sheep already running?',
    );
  });

  it('adds how to change the port to the in-use message', async () => {
    const port = await start();
    const second = new LanTransport({ port, appDir: '.', busyHint: 'pick another' });
    await expect(second.start(() => {})).rejects.toThrow(
      'port ' +
        String(port) +
        ' is already in use; is remote-sheep already running? Or pick another.',
    );
  });

  it('serves the phone app and refuses paths outside it', async () => {
    const port = await start();
    const page = await fetch('http://127.0.0.1:' + port + '/');
    expect(page.status).toBe(200);
    expect(await page.text()).toBe('<h1>sheep</h1>');
    const escape = await fetch('http://127.0.0.1:' + port + '/..%2F..%2Fsecret.txt');
    expect(escape.status).toBe(404);
  });

  describe('POST /local-pairing, which pairs a browser on this PC with no QR', () => {
    let invites = 0;

    async function startLocal() {
      invites = 0;
      const appDir = mkdtempSync(join(tmpdir(), 'sheep-app-'));
      writeFileSync(join(appDir, 'index.html'), '<h1>sheep</h1>');
      transport = new LanTransport({
        port: 0,
        appDir,
        localInvite: () => 'invite-' + String(++invites),
      });
      await transport.start(() => {});
      return transport.port();
    }

    function post(
      port: number,
      headers: Record<string, string>,
      { address = '127.0.0.1', method = 'POST' } = {},
    ) {
      return new Promise<{ status: number; headers: Record<string, unknown>; body: string }>(
        (resolve, reject) => {
          const req = httpRequest(
            { host: address, port, path: '/local-pairing', method, headers },
            (res) => {
              let body = '';
              res.setEncoding('utf8');
              res.on('data', (chunk: string) => (body += chunk));
              res.on('end', () => {
                resolve({ status: res.statusCode ?? 0, headers: res.headers, body });
              });
            },
          );
          req.on('error', reject);
          req.end();
        },
      );
    }

    const sameOrigin = (host: string) => ({
      host,
      origin: 'http://' + host,
      'sec-fetch-site': 'same-origin',
    });

    it('hands a page served from 127.0.0.1 or localhost a new invite, with no CORS header', async () => {
      const port = await startLocal();
      const first = await post(port, sameOrigin('127.0.0.1:' + String(port)));
      expect(first.status).toBe(200);
      expect(JSON.parse(first.body)).toEqual({ invite: 'invite-1' });
      expect(first.headers['cache-control']).toBe('no-store');
      expect(Object.keys(first.headers).some((name) => name.startsWith('access-control-'))).toBe(
        false,
      );
      const second = await post(port, sameOrigin('localhost:' + String(port)));
      expect(JSON.parse(second.body)).toEqual({ invite: 'invite-2' });
    });

    it('accepts a same-origin request from a browser that sends no Sec-Fetch-Site', async () => {
      const port = await startLocal();
      const host = '127.0.0.1:' + String(port);
      const answer = await post(port, { host, origin: 'http://' + host });
      expect(answer.status).toBe(200);
    });

    it('refuses a foreign Origin, a missing Origin and a cross-site request, making no invite', async () => {
      const port = await startLocal();
      const host = '127.0.0.1:' + String(port);
      const refused: Record<string, string>[] = [
        { host, origin: 'http://evil.example', 'sec-fetch-site': 'cross-site' },
        { host, origin: 'http://evil.example' },
        { host, origin: 'http://localhost:' + String(port) },
        { host, origin: 'https://' + host },
        { host, 'sec-fetch-site': 'same-origin' },
        { host, origin: 'http://' + host, 'sec-fetch-site': 'same-site' },
        { host, origin: 'null' },
      ];
      for (const headers of refused) {
        const answer = await post(port, headers);
        expect(answer.status, JSON.stringify(headers)).toBe(403);
        expect(answer.body).toBe('');
      }
      expect(invites).toBe(0);
    });

    it('refuses a Host other than localhost or 127.0.0.1 on its own port (DNS rebinding)', async () => {
      const port = await startLocal();
      for (const host of [
        'evil.example:' + String(port),
        '127.0.0.1:' + String(port + 1),
        '127.0.0.1',
        'localhost',
        '192.168.1.20:' + String(port),
      ]) {
        const answer = await post(port, sameOrigin(host));
        expect(answer.status, host).toBe(403);
      }
      expect(invites).toBe(0);
    });

    it('answers only POST, and is absent when the agent gives no invites', async () => {
      const port = await startLocal();
      const get = await post(port, sameOrigin('127.0.0.1:' + String(port)), { method: 'GET' });
      expect(get.status).toBe(404);
      expect(invites).toBe(0);
      const plain = await start();
      const absent = await post(plain, sameOrigin('127.0.0.1:' + String(plain)));
      expect(absent.status).toBe(404);
    });

    const lan = Object.values(networkInterfaces())
      .flat()
      .find((i) => i?.family === 'IPv4' && !i.internal)?.address;

    it.skipIf(lan === undefined)(
      'refuses a request that arrives from another address, even with a loopback Host',
      async () => {
        const port = await startLocal();
        const answer = await post(port, sameOrigin('127.0.0.1:' + String(port)), {
          address: lan ?? '',
        });
        expect(answer.status).toBe(403);
        expect(invites).toBe(0);
      },
    );
  });
});
