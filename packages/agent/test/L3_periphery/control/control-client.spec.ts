import { mkdtempSync } from 'node:fs';
import { createServer as createHttpServer } from 'node:http';
import { createServer, type Server } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { decodeInvite, generateKeyPair, type Invite } from '@remote-sheep/protocol';
import { PairingLinks, pairingUrl } from '../../../src/L1_domain/pairing-links';
import { PairingService } from '../../../src/L2_application/pairing-service';
import {
  AGENT_IMPOSTOR,
  AGENT_NOT_RUNNING,
  requestPairing,
  requestRelay,
} from '../../../src/L3_periphery/control/control-client';
import { saveControlFile } from '../../../src/L3_periphery/control/control-file';
import { HttpControlServer } from '../../../src/L3_periphery/control/http-control-server';
import { MemoryDeviceRegistry } from '../../fakes/memory-device-registry';
import type { RelayChange, RelayInfo } from '@remote-sheep/protocol';

const AGENT_KEY = generateKeyPair().publicKey;
const ORIGINS = {
  relay: () => null,
  network: ['http://192.168.1.20:3999'],
  local: 'http://127.0.0.1:3999',
};

const closers: (() => Promise<void> | void)[] = [];
afterEach(async () => {
  for (const close of closers.splice(0)) await close();
});

function pairingService() {
  return new PairingService({
    registry: new MemoryDeviceRegistry(),
    clock: { now: () => 1_700_000_000_000 },
    random: { bytes: (n: number) => new Uint8Array(n).fill(7) },
    agentKey: AGENT_KEY,
  });
}

/** The real agent's side: its pairing service behind its control server. */
async function agent(service = pairingService()) {
  const server = new HttpControlServer(new PairingLinks(ORIGINS, service));
  closers.push(() => server.stop());
  const port = await server.start();
  return { server, port, service };
}

const controlFile = () => join(mkdtempSync(join(tmpdir(), 'sheep-ctl-')), 'control.json');

async function listening(server: Server | ReturnType<typeof createHttpServer>) {
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  closers.push(() => {
    server.close();
  });
  const address = server.address();
  if (address === null || typeof address === 'string') throw new Error('no port');
  return address.port;
}

describe('requestPairing', () => {
  it('asks the running agent for a new pairing with the secret in control.json', async () => {
    const { server, port } = await agent();
    const file = controlFile();
    await saveControlFile(file, { port, secret: server.secret });
    const pairing = await requestPairing({ controlFile: file, agentKey: AGENT_KEY });
    expect(pairing.links.map((link) => link.where)).toEqual(['network', 'this-pc']);
  });

  it('hands over a pairing the agent then accepts from a phone', async () => {
    const { server, port, service } = await agent();
    const file = controlFile();
    await saveControlFile(file, { port, secret: server.secret });
    const pairing = await requestPairing({ controlFile: file, agentKey: AGENT_KEY });
    const local = pairing.links.find((link) => link.where === 'this-pc');
    expect(local?.url.startsWith('http://127.0.0.1:3999/#pair=')).toBe(true);
    const invite = decodeInvite(local?.url.split('#pair=')[1] ?? '');
    const admission = await service.admit(generateKeyPair().publicKey, true);
    expect(admission.kind).toBe('pair');
    if (admission.kind === 'pair') expect(admission.invite.secret).toEqual(invite?.secret);
  });

  it('says the agent is not running when there is no control.json or no agent key', async () => {
    await expect(
      requestPairing({ controlFile: controlFile(), agentKey: AGENT_KEY }),
    ).rejects.toThrow(AGENT_NOT_RUNNING);
    const { server, port } = await agent();
    const file = controlFile();
    await saveControlFile(file, { port, secret: server.secret });
    await expect(requestPairing({ controlFile: file, agentKey: null })).rejects.toThrow(
      AGENT_NOT_RUNNING,
    );
  });

  it('says the agent is not running when control.json names a closed port', async () => {
    const { server, port } = await agent();
    await server.stop();
    const file = controlFile();
    await saveControlFile(file, { port, secret: 'stale' });
    await expect(requestPairing({ controlFile: file, agentKey: AGENT_KEY })).rejects.toThrow(
      AGENT_NOT_RUNNING,
    );
  });

  it('gives up quickly on a program that took the port and never answers', async () => {
    const port = await listening(createServer(() => undefined));
    const file = controlFile();
    await saveControlFile(file, { port, secret: 'stale' });
    const began = Date.now();
    await expect(
      requestPairing({ controlFile: file, agentKey: AGENT_KEY, timeoutMs: 300 }),
    ).rejects.toThrow(AGENT_NOT_RUNNING);
    expect(Date.now() - began).toBeLessThan(2000);
  });

  it('says the agent refused when the secret no longer matches', async () => {
    const { port } = await agent();
    const file = controlFile();
    await saveControlFile(file, { port, secret: 'old' });
    await expect(requestPairing({ controlFile: file, agentKey: AGENT_KEY })).rejects.toThrow(
      'refused',
    );
  });

  it('refuses links from a program that is not this agent, even one that answers like it', async () => {
    const fake: Invite = {
      agentKey: generateKeyPair().publicKey,
      secret: new Uint8Array(32).fill(1),
      expiresAt: 1_700_000_300_000,
    };
    const answers = [
      { links: [{ where: 'this-pc', url: pairingUrl('http://127.0.0.1:1', fake) }], expiresAt: 1 },
      { links: [{ where: 'this-pc', url: 'http://127.0.0.1:1/#pair=nonsense' }], expiresAt: 1 },
      { links: [{ where: 'this-pc', url: 'http://127.0.0.1:1/' }], expiresAt: 1 },
    ];
    for (const answer of answers) {
      const port = await listening(
        createHttpServer((_req, res) => {
          res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify(answer));
        }),
      );
      const file = controlFile();
      await saveControlFile(file, { port, secret: 'stale' });
      await expect(requestPairing({ controlFile: file, agentKey: AGENT_KEY })).rejects.toThrow(
        AGENT_IMPOSTOR,
      );
    }
  });

  it('says so when the answer is not a pairing at all', async () => {
    const port = await listening(
      createHttpServer((_req, res) => {
        res.writeHead(200).end('not json');
      }),
    );
    const file = controlFile();
    await saveControlFile(file, { port, secret: 'stale' });
    await expect(requestPairing({ controlFile: file, agentKey: AGENT_KEY })).rejects.toThrow(
      'unexpected answer',
    );
  });
});

describe('requestRelay', () => {
  const OFF: RelayInfo = { on: false, url: null, connected: false, fixed: false };

  async function relayAgent() {
    const changes: RelayChange[] = [];
    let info = OFF;
    const server = new HttpControlServer(new PairingLinks(ORIGINS, pairingService()), {
      relay: {
        relay: () => info,
        changeRelay: async (change) => {
          await Promise.resolve();
          if ('code' in change && change.code === 'refuse') throw new Error('Not this one.');
          changes.push(change);
          info =
            'off' in change ? OFF : { on: true, url: change.url, connected: true, fixed: false };
          return info;
        },
      },
    });
    closers.push(() => server.stop());
    const file = controlFile();
    await saveControlFile(file, { port: await server.start(), secret: server.secret });
    return { file, changes };
  }

  it('reads, sets and turns off the relay of the running agent', async () => {
    const { file, changes } = await relayAgent();
    expect(await requestRelay({ controlFile: file })).toEqual(OFF);
    const set = { url: 'https://relay.example.com', code: 'c0de' };
    expect(await requestRelay({ controlFile: file, change: set })).toEqual({
      on: true,
      url: 'https://relay.example.com',
      connected: true,
      fixed: false,
    });
    expect(await requestRelay({ controlFile: file, change: { off: true } })).toEqual(OFF);
    expect(changes).toEqual([set, { off: true }]);
  });

  it('passes on why the agent refused a change', async () => {
    const { file } = await relayAgent();
    await expect(
      requestRelay({ controlFile: file, change: { url: 'https://r.dev', code: 'refuse' } }),
    ).rejects.toThrow('Not this one.');
  });

  it('says the agent is not running, like qr, with no control.json or a closed port', async () => {
    await expect(requestRelay({ controlFile: controlFile() })).rejects.toThrow(AGENT_NOT_RUNNING);
    const server = new HttpControlServer({ newPairing: () => ({ links: [], expiresAt: 0 }) });
    const port = await server.start();
    await server.stop();
    const file = controlFile();
    await saveControlFile(file, { port, secret: 'stale' });
    await expect(requestRelay({ controlFile: file, change: { off: true } })).rejects.toThrow(
      AGENT_NOT_RUNNING,
    );
  });

  it('never hands the access code to a program that cannot prove it is this agent', async () => {
    const received: string[] = [];
    const port = await listening(
      createHttpServer((req, res) => {
        let body = '';
        req.on('data', (chunk: Buffer) => (body += chunk.toString()));
        req.on('end', () => {
          received.push(req.url + ' ' + body);
          res
            .writeHead(200, { 'content-type': 'application/json' })
            .end(JSON.stringify({ proof: 'made-up', ...OFF }));
        });
      }),
    );
    const file = controlFile();
    await saveControlFile(file, { port, secret: 'stale' });
    await expect(
      requestRelay({ controlFile: file, change: { url: 'https://r.dev', code: 'c0de' } }),
    ).rejects.toThrow(AGENT_IMPOSTOR);
    expect(received.join(' ')).not.toContain('c0de');
    expect(received.every((line) => line.startsWith('/identify'))).toBe(true);
  });
});
