import { createHmac } from 'node:crypto';
import { request } from 'node:http';
import { connect } from 'node:net';
import { afterEach, describe, expect, it } from 'vitest';
import type { RelayChange, RelayInfo } from '@remote-sheep/protocol';
import type { Pairing } from '../../../src/L1_domain/pairing';
import type { RelayRequests } from '../../../src/L1_domain/ports/relay';
import {
  HttpControlServer,
  isLoopbackAddress,
} from '../../../src/L3_periphery/control/http-control-server';

const PAIRING: Pairing = {
  links: [{ where: 'this-pc', url: 'http://127.0.0.1:3999/#pair=x' }],
  expiresAt: 1_700_000_300_000,
};

const servers: HttpControlServer[] = [];
afterEach(async () => {
  await Promise.all(servers.splice(0).map((s) => s.stop()));
});

async function started(newPairing: () => Pairing = () => PAIRING, timeoutMs?: number) {
  const server = new HttpControlServer({ newPairing }, { timeoutMs });
  servers.push(server);
  const port = await server.start();
  return { server, port };
}

/** A raw request, so the tests can send what a well-behaved client never would. */
function call(
  port: number,
  options: { method?: string; path?: string; headers?: Record<string, string>; body?: string },
): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = request(
      {
        host: '127.0.0.1',
        port,
        method: options.method ?? 'POST',
        path: options.path ?? '/pairing',
        headers: options.headers,
        agent: false,
      },
      (res) => {
        let body = '';
        res.setEncoding('utf8');
        res.on('data', (chunk: string) => (body += chunk));
        res.on('end', () => {
          resolve({ status: res.statusCode ?? 0, body });
        });
      },
    );
    req.on('error', reject);
    req.end(options.body);
  });
}

const OFF: RelayInfo = { on: false, url: null, connected: false, fixed: false };

/** Records the changes asked; refuses a code of "bad" the way RelaySwitch refuses one. */
class FakeRelay implements RelayRequests {
  changes: RelayChange[] = [];
  info = OFF;
  relay(): RelayInfo {
    return this.info;
  }
  async changeRelay(change: RelayChange): Promise<RelayInfo> {
    await Promise.resolve();
    if ('code' in change && change.code === 'bad') throw new Error('The access code is bad.');
    this.changes.push(change);
    this.info =
      'off' in change ? OFF : { on: true, url: change.url, connected: false, fixed: false };
    return this.info;
  }
}

async function withRelay() {
  const relay = new FakeRelay();
  const server = new HttpControlServer({ newPairing: () => PAIRING }, { relay });
  servers.push(server);
  const port = await server.start();
  return { server, port, relay, authorization: 'Bearer ' + server.secret };
}

describe('HttpControlServer relay', () => {
  it('reads the relay and changes it for a caller with the secret, never echoing the code', async () => {
    const { port, relay, authorization } = await withRelay();
    const read = await call(port, { path: '/relay', headers: { authorization }, body: '{}' });
    expect(read.status).toBe(200);
    expect(JSON.parse(read.body)).toEqual(OFF);
    const set = { url: 'https://relay.example.com', code: 'c0de' };
    const changed = await call(port, {
      path: '/relay',
      headers: { authorization },
      body: JSON.stringify({ set }),
    });
    expect(changed.status).toBe(200);
    expect(changed.body).not.toContain('c0de');
    expect(JSON.parse(changed.body)).toMatchObject({ on: true, url: 'https://relay.example.com' });
    const off = await call(port, {
      path: '/relay',
      headers: { authorization },
      body: JSON.stringify({ set: { off: true } }),
    });
    expect(JSON.parse(off.body)).toEqual(OFF);
    expect(relay.changes).toEqual([set, { off: true }]);
  });

  it('refuses a relay change without the secret, from a web page, or rebound, changing nothing', async () => {
    const { server, port, relay } = await withRelay();
    const body = JSON.stringify({ set: { off: true } });
    const authorization = 'Bearer ' + server.secret;
    const attempts: Record<string, string>[] = [
      {},
      { authorization: 'Bearer wrong' },
      { authorization, origin: 'http://evil.example' },
      { authorization, host: 'evil.example' },
    ];
    for (const headers of attempts) {
      expect(await call(port, { path: '/relay', headers, body })).toEqual({
        status: 403,
        body: '',
      });
    }
    expect(relay.changes).toEqual([]);
  });

  it('answers a malformed body or a refused change with 400 and the reason', async () => {
    const { port, relay, authorization } = await withRelay();
    for (const body of ['not json', '{"set":"off"}', '{"set":{"url":"https://r.dev"}}']) {
      const res = await call(port, { path: '/relay', headers: { authorization }, body });
      expect(res.status).toBe(400);
      expect(JSON.parse(res.body)).toEqual({ error: 'malformed relay request' });
    }
    const refused = await call(port, {
      path: '/relay',
      headers: { authorization },
      body: JSON.stringify({ set: { url: 'https://r.dev', code: 'bad' } }),
    });
    expect(refused.status).toBe(400);
    expect(JSON.parse(refused.body)).toEqual({ error: 'The access code is bad.' });
    const huge = await call(port, {
      path: '/relay',
      headers: { authorization },
      body: JSON.stringify({ set: { url: 'https://r.dev', code: 'x'.repeat(20_000) } }),
    }).catch(() => ({ status: 0, body: '' }));
    expect([0, 413]).toContain(huge.status);
    expect(relay.changes).toEqual([]);
  });

  it('proves it holds the secret to a caller that has not sent it, and only to this PC', async () => {
    const { server, port } = await withRelay();
    const challenge = 'A'.repeat(43);
    const res = await call(port, { path: '/identify', headers: { 'x-challenge': challenge } });
    expect(res.status).toBe(200);
    const expected = createHmac('sha256', server.secret)
      .update('remote-sheep control identity\n' + challenge)
      .digest('base64url');
    expect(JSON.parse(res.body)).toEqual({ proof: expected });
    expect(
      (await call(port, { path: '/identify', headers: { 'x-challenge': 'short' } })).status,
    ).toBe(400);
    expect(
      (
        await call(port, {
          path: '/identify',
          headers: { 'x-challenge': challenge, origin: 'http://evil.example' },
        })
      ).status,
    ).toBe(403);
  });

  it('has no relay route when the agent gave it no relay to change', async () => {
    const { server, port } = await started();
    const res = await call(port, {
      path: '/relay',
      headers: { authorization: 'Bearer ' + server.secret },
      body: '{}',
    });
    expect(res.status).toBe(404);
  });
});

describe('HttpControlServer', () => {
  it('listens on loopback only, on a port of its own', async () => {
    const { server, port } = await started();
    expect(port).toBeGreaterThan(0);
    expect(server.address()).toEqual({ address: '127.0.0.1', port });
  });

  it('refuses a missing or wrong secret, and says nothing about why', async () => {
    let asked = 0;
    const { server, port } = await started(() => {
      asked++;
      return PAIRING;
    });
    const attempts: Record<string, string>[] = [
      {},
      { authorization: 'Bearer wrong' },
      { authorization: server.secret },
      { authorization: 'Bearer ' + server.secret + 'x' },
    ];
    for (const headers of attempts) {
      expect(await call(port, { headers })).toEqual({ status: 403, body: '' });
    }
    expect(asked).toBe(0);
  });

  it('refuses what a web page could send: an Origin, or a Host that is not loopback', async () => {
    const { server, port } = await started();
    const authorization = 'Bearer ' + server.secret;
    const fromPage = await call(port, {
      headers: { authorization, origin: 'http://evil.example' },
    });
    expect(fromPage.status).toBe(403);
    const rebound = await call(port, { headers: { authorization, host: 'evil.example' } });
    expect(rebound.status).toBe(403);
  });

  it('answers only the operations it has', async () => {
    const { server, port } = await started();
    const authorization = 'Bearer ' + server.secret;
    expect(await call(port, { method: 'GET', headers: { authorization } })).toEqual({
      status: 404,
      body: '',
    });
    expect((await call(port, { path: '/other', headers: { authorization } })).status).toBe(404);
  });

  it('hands a new pairing to a caller with the secret', async () => {
    const { server, port } = await started();
    const res = await call(port, { headers: { authorization: 'Bearer ' + server.secret } });
    expect(res.status).toBe(200);
    expect(JSON.parse(res.body)).toEqual(PAIRING);
  });

  it('makes a new secret for every agent', () => {
    const a = new HttpControlServer({ newPairing: () => PAIRING });
    const b = new HttpControlServer({ newPairing: () => PAIRING });
    expect(a.secret).toMatch(/^[\w-]{43}$/);
    expect(a.secret).not.toBe(b.secret);
  });

  it('closes a connection that sends nothing, or its headers too slowly, soon after its timeout', async () => {
    const { port } = await started(undefined, 200);
    for (const sent of ['', 'POST /pairing HTTP/1.1\r\nHost: 127.0.0.1\r\n']) {
      const socket = connect(port, '127.0.0.1', () => {
        if (sent) socket.write(sent);
      });
      socket.on('error', () => undefined);
      // Read what the server sends (its 408), or the socket never sees the end.
      socket.resume();
      const began = Date.now();
      await new Promise<void>((resolve) => socket.on('close', () => resolve()));
      // Node checks request timeouts every 30 s by default; the server checks every second.
      expect(Date.now() - began).toBeLessThan(3000);
    }
  }, 15_000);

  it('closes with the agent', async () => {
    const { server, port } = await started();
    await server.stop();
    await expect(call(port, {})).rejects.toThrow();
  });
});

describe('isLoopbackAddress', () => {
  it('accepts only this computer', () => {
    for (const address of ['127.0.0.1', '::ffff:127.0.0.1', '::1']) {
      expect(isLoopbackAddress(address)).toBe(true);
    }
    for (const address of ['192.168.1.20', '::ffff:10.0.0.2', '0.0.0.0', undefined]) {
      expect(isLoopbackAddress(address)).toBe(false);
    }
  });
});
