import { createServer, type IncomingMessage, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { createPublicKey, createVerify } from 'node:crypto';
import { afterEach, describe, expect, it } from 'vitest';
import { decodeBase64Url, encodeBase64Url } from '@remote-sheep/protocol';
import { WebPushSender } from '../../../src/L3_periphery/push/web-push-sender';
import { generateP256 } from '../../../src/L3_periphery/push/web-push-encryption';
import { newVapidKeys } from '../../../src/L3_periphery/push/web-push-vapid';

const NOW = 1_700_000_000_000;
const PAYLOAD = '{"title":"api: finished","target":"p1"}';

interface Received {
  headers: IncomingMessage['headers'];
  body: Buffer;
  url: string | undefined;
}

describe('WebPushSender', () => {
  let server: Server | undefined;
  afterEach(() => {
    server?.close();
    server?.closeAllConnections();
  });

  async function pushService(status: number) {
    const received: Received[] = [];
    const listening = createServer((req, res) => {
      const chunks: Buffer[] = [];
      req.on('data', (c: Buffer) => chunks.push(c));
      req.on('end', () => {
        received.push({ headers: req.headers, body: Buffer.concat(chunks), url: req.url });
        res.statusCode = status;
        res.end();
      });
    });
    server = listening;
    await new Promise<void>((resolve) => listening.listen(0, '127.0.0.1', resolve));
    const origin = 'http://127.0.0.1:' + String((listening.address() as AddressInfo).port);
    return { received, origin };
  }

  function phone() {
    const keys = generateP256();
    return {
      p256dh: encodeBase64Url(keys.publicKey),
      auth: encodeBase64Url(new Uint8Array(16).fill(3)),
    };
  }

  const vapid = newVapidKeys();
  const sender = () =>
    new WebPushSender({
      vapid,
      allowInsecure: true,
      now: () => NOW,
    });

  const SUBJECT = 'https://relay.example';

  it('posts an encrypted body to the endpoint, signed with a VAPID token', async () => {
    const { received, origin } = await pushService(201);
    const subscriber = phone();
    const result = await sender().send(
      { endpoint: origin + '/push/abc', ...subscriber },
      PAYLOAD,
      SUBJECT,
    );
    expect(result).toBe('sent');

    const request = received[0];
    expect(request?.url).toBe('/push/abc');
    const headers = request?.headers;
    expect(headers?.['content-encoding']).toBe('aes128gcm');
    expect(headers?.['content-type']).toBe('application/octet-stream');
    expect(headers?.['ttl']).toBe('86400');
    expect(headers?.['urgency']).toBe('high');
    // header (21) + sender point (65) + payload + delimiter (1) + GCM tag (16)
    expect(request?.body.length).toBe(21 + 65 + PAYLOAD.length + 1 + 16);

    const match = /^vapid t=([\w-]+)\.([\w-]+)\.([\w-]+), k=([\w-]+)$/.exec(
      headers?.authorization ?? '',
    );
    expect(match).not.toBeNull();
    const [, head = '', claims = '', signature = '', key] = match ?? [];
    expect(key).toBe(encodeBase64Url(vapid.publicKey));
    expect(JSON.parse(Buffer.from(head, 'base64url').toString())).toEqual({
      typ: 'JWT',
      alg: 'ES256',
    });
    expect(JSON.parse(Buffer.from(claims, 'base64url').toString())).toEqual({
      aud: origin,
      exp: NOW / 1000 + 12 * 3600,
      sub: 'https://relay.example',
    });
    const raw = decodeBase64Url(signature);
    expect(raw?.length).toBe(64);
    const valid = createVerify('sha256')
      .update(head + '.' + claims)
      .verify(
        { key: createPublicKey(vapid.privateKey), dsaEncoding: 'ieee-p1363' },
        raw ?? new Uint8Array(),
      );
    expect(valid).toBe(true);
  });

  it('names the subject it is given on each send, so a new relay counts at once', async () => {
    const { received, origin } = await pushService(201);
    await sender().send({ endpoint: origin + '/a', ...phone() }, '{}', 'https://other.example');
    const claims = /t=[\w-]+\.([\w-]+)\./.exec(received[0]?.headers.authorization ?? '')?.[1];
    expect(JSON.parse(Buffer.from(claims ?? '', 'base64url').toString())).toMatchObject({
      sub: 'https://other.example',
    });
  });

  it('answers gone for 404 and 410', async () => {
    for (const status of [404, 410]) {
      const { origin } = await pushService(status);
      const result = await sender().send({ endpoint: origin + '/x', ...phone() }, '{}', SUBJECT);
      expect(result).toBe('gone');
      server?.close();
    }
  });

  it('fails with the status for anything else', async () => {
    const { origin } = await pushService(429);
    await expect(
      sender().send({ endpoint: origin + '/x', ...phone() }, '{}', SUBJECT),
    ).rejects.toThrow('429');
  });

  it('refuses a plain http endpoint unless told otherwise', async () => {
    const strict = new WebPushSender({ vapid });
    await expect(
      strict.send({ endpoint: 'http://127.0.0.1:1/x', ...phone() }, '{}', SUBJECT),
    ).rejects.toThrow('https');
  });
});
