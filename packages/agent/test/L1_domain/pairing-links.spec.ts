import { describe, expect, it } from 'vitest';
import { decodeInvite, generateKeyPair, type Invite } from '@remote-sheep/protocol';
import { PairingLinks, pairingUrl } from '../../src/L1_domain/pairing-links';

const invite: Invite = {
  agentKey: generateKeyPair().publicKey,
  secret: new Uint8Array(32).fill(5),
  expiresAt: 1_700_000_300_000,
};

/** Hands out the same invite, counting how many were asked for. */
class FixedInvites {
  made = 0;
  createInvite(): Invite {
    this.made++;
    return invite;
  }
}

describe('pairingUrl', () => {
  it('puts the invite in the URL fragment, which the browser never sends', () => {
    const url = pairingUrl('http://192.168.1.20:3999', invite);
    expect(url).toMatch(/^http:\/\/192\.168\.1\.20:3999\/#pair=[\w-]+\.[\w-]+\.1700000300000$/);
    expect(decodeInvite(url.split('#pair=')[1] ?? '')).toEqual(invite);
  });
});

describe('PairingLinks', () => {
  it('lists the relay first, then the network, then this PC, all for one new invite', () => {
    const invites = new FixedInvites();
    const links = new PairingLinks(
      {
        relay: () => 'https://relay.example.com',
        network: ['http://192.168.1.20:3999', 'http://10.0.0.5:3999'],
        local: 'http://127.0.0.1:3999',
      },
      invites,
    );
    const pairing = links.newPairing();
    expect(invites.made).toBe(1);
    expect(pairing.expiresAt).toBe(invite.expiresAt);
    expect(pairing.links.map((link) => link.where)).toEqual([
      'relay',
      'network',
      'network',
      'this-pc',
    ]);
    expect(pairing.links[0]?.url).toBe(pairingUrl('https://relay.example.com', invite));
    expect(pairing.links[3]?.url).toBe(pairingUrl('http://127.0.0.1:3999', invite));
  });

  it('reads the relay on every pairing, so one set while the agent runs leads the next QR code', () => {
    let relay: string | null = null;
    const links = new PairingLinks(
      { relay: () => relay, network: [], local: 'http://127.0.0.1:3999' },
      new FixedInvites(),
    );
    expect(links.newPairing().links.map((link) => link.where)).toEqual(['this-pc']);
    relay = 'https://relay.example.com';
    expect(links.newPairing().links.map((link) => link.where)).toEqual(['relay', 'this-pc']);
    relay = null;
    expect(links.newPairing().links.map((link) => link.where)).toEqual(['this-pc']);
  });

  it('leaves out the relay when none is set, and always offers this PC', () => {
    const links = new PairingLinks(
      { relay: () => null, network: [], local: 'http://127.0.0.1:3999' },
      new FixedInvites(),
    );
    expect(links.newPairing().links).toEqual([
      { where: 'this-pc', url: pairingUrl('http://127.0.0.1:3999', invite) },
    ]);
  });
});
