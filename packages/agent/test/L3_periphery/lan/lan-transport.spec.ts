import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import WebSocket from 'ws';
import { CLOSE_PROTOCOL } from '@remote-sheep/protocol';
import { LanTransport } from '../../../src/L3_periphery/lan/lan-transport';
import type { Link } from '../../../src/L1_domain/ports/link';

function connect(port: number, path = '/ws') {
  const socket = new WebSocket('ws://127.0.0.1:' + port + path);
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

  async function start(accept: (link: Link) => void = () => {}) {
    const appDir = mkdtempSync(join(tmpdir(), 'sheep-app-'));
    writeFileSync(join(appDir, 'index.html'), '<h1>sheep</h1>');
    transport = new LanTransport({ port: 0, appDir });
    await transport.start(accept);
    return transport.port();
  }

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

  it('reports a port already in use instead of crashing', async () => {
    const port = await start();
    const second = new LanTransport({ port, appDir: '.' });
    await expect(second.start(() => {})).rejects.toThrow(/in use/);
  });

  it('serves the phone app and refuses paths outside it', async () => {
    const port = await start();
    const page = await fetch('http://127.0.0.1:' + port + '/');
    expect(page.status).toBe(200);
    expect(await page.text()).toBe('<h1>sheep</h1>');
    const escape = await fetch('http://127.0.0.1:' + port + '/..%2F..%2Fsecret.txt');
    expect(escape.status).toBe(404);
  });
});
