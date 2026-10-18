import { describe, expect, it } from 'vitest';
import { decodeInvite, generateKeyPair } from '@remote-sheep/protocol';
import { pairingUrl, renderQr } from '../../../src/L3_periphery/terminal/pairing-qr';

describe('pairingUrl', () => {
  it('puts the invite in the URL fragment, which the browser never sends', () => {
    const invite = {
      agentKey: generateKeyPair().publicKey,
      secret: new Uint8Array(32).fill(5),
      expiresAt: 1_700_000_300_000,
    };
    const url = pairingUrl('http://192.168.1.20:3999', invite);
    expect(url).toMatch(/^http:\/\/192\.168\.1\.20:3999\/#pair=[\w-]+\.[\w-]+\.1700000300000$/);
    expect(decodeInvite(url.split('#pair=')[1]!)).toEqual(invite);
  });
});

describe('renderQr', () => {
  it('draws the text as a QR code made of terminal blocks', async () => {
    const qr = await renderQr('http://192.168.1.20:3999/#pair=abc');
    const lines = qr.trim().split('\n');
    expect(lines.length).toBeGreaterThan(10);
    expect(qr).toMatch(/[█▀▄]/);
  });
});
