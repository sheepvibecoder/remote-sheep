import { describe, expect, it } from 'vitest';
import {
  encodeInvite,
  generateKeyPair,
  publicKeyId,
  type KeyPair,
  type Request,
  type ResultOf,
  type ServerMessage,
} from '@remote-sheep/protocol';
import type {
  AgentConnection,
  ConnectionHandlers,
  Credentials,
} from '../../src/L1_domain/ports/agent-connection';
import type { PairingStore, StoredPairing } from '../../src/L1_domain/ports/pairing-store';
import { Store } from '../../src/L2_application/app.store';
import { LinkStarter } from '../../src/L2_application/link-starter';
import { ACTIVE_PROFILE } from '../../src/L2_application/profile-choice';

const NOW = 1_700_000_000_000;
const agentKey = generateKeyPair().publicKey;
const agentId = publicKeyId(agentKey);
const invite = { agentKey, secret: new Uint8Array(32).fill(9), expiresAt: NOW + 60_000 };
const pairLink = '#pair=' + encodeInvite(invite);

class MemoryPairings implements PairingStore {
  saved: StoredPairing[] = [];
  failList = false;
  failSave = false;

  list(): Promise<StoredPairing[]> {
    return this.failList ? Promise.reject(new Error('blocked')) : Promise.resolve([...this.saved]);
  }

  save(pairing: StoredPairing): Promise<void> {
    if (this.failSave) return Promise.reject(new Error('quota'));
    const at = this.saved.findIndex((p) => p.id === pairing.id);
    if (at < 0) this.saved.push(pairing);
    else this.saved[at] = pairing;
    return Promise.resolve();
  }

  remove(id: string): Promise<void> {
    this.saved = this.saved.filter((p) => p.id !== id);
    return Promise.resolve();
  }

  find(id: string): StoredPairing | undefined {
    return this.saved.find((p) => p.id === id);
  }
}

class FakeConnection implements AgentConnection {
  closed = false;

  constructor(
    readonly credentials: Credentials,
    readonly handlers: ConnectionHandlers,
  ) {}

  readonly requests: Request[] = [];
  failRequests = false;

  request<R extends Request>(request: R): Promise<ResultOf<R>> {
    this.requests.push(request);
    if (this.failRequests) return Promise.reject(new Error('no paired device has the id dev1'));
    return Promise.resolve(undefined as ResultOf<R>);
  }

  close(): void {
    this.closed = true;
  }
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

/** The page's host name and what its agent answers when this browser asks to pair itself. */
interface LocalPage {
  hostname: string;
  answer?: () => Promise<string>;
}

function setup(
  stored: StoredPairing[] = [],
  active: string | null = stored[0]?.id ?? null,
  page: LocalPage = { hostname: '192.168.1.20' },
) {
  const pairings = new MemoryPairings();
  pairings.saved = [...stored];
  const preferences = new Map<string, string>();
  if (active) preferences.set(ACTIVE_PROFILE, active);
  const store = new Store(
    { getItem: () => null, setItem: () => undefined },
    {
      support: () => 'unsupported',
      current: () => Promise.resolve(null),
      subscribe: () => Promise.reject(new Error('unused')),
      unsubscribe: () => Promise.resolve(),
    },
  );
  const connections: FakeConnection[] = [];
  const readies: number[] = [];
  const restarts: number[] = [];
  const errors: string[] = [];
  const pairs: string[] = [];
  let localAsks = 0;
  const fresh: KeyPair = generateKeyPair();
  const starter = new LinkStarter(
    store,
    pairings,
    (credentials, handlers) => {
      const connection = new FakeConnection(credentials, handlers);
      connections.push(connection);
      return connection;
    },
    {
      ready: () => readies.push(1),
      error: (message) => errors.push(message),
      restart: () => restarts.push(1),
      pair: (fragment) => pairs.push(fragment),
    },
    {
      getItem: (key) => preferences.get(key) ?? null,
      setItem: (key, value) => preferences.set(key, value),
    },
    {
      now: () => NOW,
      generateKeys: () => fresh,
      probeTimeoutMs: 50,
      page: {
        hostname: page.hostname,
        localPairing: {
          invite: () => {
            localAsks++;
            return page.answer ? page.answer() : Promise.resolve(pairLink);
          },
        },
      },
    },
  );
  return {
    starter,
    store,
    pairings,
    preferences,
    connections,
    readies,
    restarts,
    errors,
    fresh,
    pairs,
    localAsks: () => localAsks,
  };
}

const storedPairing = (key = agentKey, name = 'Office', device = 'dev1'): StoredPairing => ({
  id: publicKeyId(key),
  name,
  phone: generateKeyPair(),
  agentKey: key,
  device,
});

const otherComputer = (name: string) => storedPairing(generateKeyPair().publicKey, name);

describe('LinkStarter', () => {
  it('pairs with a fresh key pair when the page opens with an invite', async () => {
    const { starter, store, connections, fresh } = setup([otherComputer('Home')]);
    await starter.start(pairLink);
    expect(connections).toHaveLength(1);
    expect(connections[0]?.credentials).toEqual({ phone: fresh, agentKey, invite });
    expect(starter.connection).toBe(connections[0]);
    expect(store.state.gate).toBeNull();
  });

  it('saves the pairing as a new profile only once the agent says ready', async () => {
    const { starter, pairings, preferences, connections, readies, fresh } = setup();
    await starter.start(pairLink);
    const handlers = connections[0]?.handlers;
    handlers?.state('connecting');
    handlers?.state('closed');
    await settle();
    expect(pairings.saved).toEqual([]);
    handlers?.ready('dev1');
    await settle();
    expect(pairings.saved).toEqual([
      { id: agentId, name: 'Computer 1', phone: fresh, agentKey, device: 'dev1' },
    ]);
    expect(preferences.get(ACTIVE_PROFILE)).toBe(agentId);
    expect(readies).toHaveLength(1);
    // A reconnection is not a new pairing: nothing is written again.
    pairings.saved = [];
    handlers?.ready('dev1');
    await settle();
    expect(pairings.saved).toEqual([]);
    expect(readies).toHaveLength(2);
  });

  it('keeps the profile of another computer when it pairs with a second one', async () => {
    const home = otherComputer('Home');
    const { starter, pairings, store, connections } = setup([home]);
    await starter.start(pairLink);
    connections[0]?.handlers.ready('dev2');
    await settle();
    expect(pairings.saved.map((p) => p.name)).toEqual(['Home', 'Computer 2']);
    expect(connections[0]?.requests).toEqual([]);
    expect(store.state.profiles).toEqual([
      { id: home.id, name: 'Home', active: false, reach: null },
      { id: agentId, name: 'Computer 2', active: true, reach: null },
    ]);
  });

  it('unlinks the device this browser was before when it pairs again with the same agent', async () => {
    const { starter, pairings, connections, errors } = setup([storedPairing()]);
    await starter.start(pairLink);
    connections[0]?.handlers.ready('dev2');
    await settle();
    expect(pairings.find(agentId)?.device).toBe('dev2');
    // Pairing the same computer again keeps the name the person gave it.
    expect(pairings.find(agentId)?.name).toBe('Office');
    expect(connections[0]?.requests).toEqual([{ kind: 'unlink', id: 'dev1' }]);
    expect(errors).toEqual([]);
  });

  it('stays quiet when the device it was before is already gone', async () => {
    const { starter, connections, errors } = setup([storedPairing()]);
    await starter.start(pairLink);
    const connection = connections[0];
    if (connection) connection.failRequests = true;
    connection?.handlers.ready('dev2');
    await settle();
    expect(connection?.requests).toEqual([{ kind: 'unlink', id: 'dev1' }]);
    expect(errors).toEqual([]);
  });

  it('connects with the active profile and no invite on a normal start', async () => {
    const home = otherComputer('Home');
    const office = storedPairing();
    const { starter, pairings, connections, store } = setup([home, office], office.id);
    await starter.start('');
    expect(connections).toHaveLength(1);
    expect(connections[0]?.credentials).toEqual({ phone: office.phone, agentKey, invite: null });
    expect(store.state.gate).toBeNull();
    expect(store.activeProfileName()).toBe('Office');
    connections[0]?.handlers.ready('dev1');
    await settle();
    expect(pairings.saved).toEqual([home, office]);
  });

  it('starts over on the first profile when the active one is gone', async () => {
    const home = otherComputer('Home');
    const { starter, preferences, connections, restarts } = setup([home], 'gone');
    await starter.start('');
    expect(connections).toHaveLength(0);
    expect(preferences.get(ACTIVE_PROFILE)).toBe(home.id);
    expect(restarts).toHaveLength(1);
  });

  it('asks to scan a QR code when nothing is stored', async () => {
    const { starter, store, connections } = setup();
    await starter.start('');
    expect(connections).toHaveLength(0);
    expect(store.state.gate).toBe('scan');
    expect(starter.connection).toBeNull();
  });

  it('pairs a browser on this PC by itself when it has no profile, as a scanned QR would', async () => {
    for (const hostname of ['127.0.0.1', 'localhost']) {
      const { starter, store, connections, pairs, localAsks } = setup([], null, { hostname });
      await starter.start('');
      expect(localAsks()).toBe(1);
      expect(pairs).toEqual([pairLink]);
      expect(connections).toHaveLength(0);
      expect(store.state.gate).toBeNull();
    }
  });

  it('never asks to pair itself from another address, or with a profile already kept', async () => {
    const lan = setup();
    await lan.starter.start('');
    expect(lan.localAsks()).toBe(0);
    expect(lan.store.state.gate).toBe('scan');
    const kept = setup([storedPairing()], agentId, { hostname: '127.0.0.1' });
    await kept.starter.start('');
    expect(kept.localAsks()).toBe(0);
    expect(kept.connections).toHaveLength(1);
    const linked = setup([], null, { hostname: 'localhost' });
    await linked.starter.start(pairLink);
    expect(linked.localAsks()).toBe(0);
    expect(linked.pairs).toEqual([]);
  });

  it('asks to scan and says why when this PC refuses to pair the browser', async () => {
    const refused = setup([], null, {
      hostname: '127.0.0.1',
      answer: () => Promise.reject(new Error('HTTP 403')),
    });
    await refused.starter.start('');
    expect(refused.store.state.gate).toBe('scan');
    expect(refused.pairs).toEqual([]);
    expect(refused.errors).toEqual(['this browser could not pair itself: HTTP 403']);
    const odd = setup([], null, { hostname: '127.0.0.1', answer: () => Promise.resolve('#x') });
    await odd.starter.start('');
    expect(odd.store.state.gate).toBe('scan');
    expect(odd.pairs).toEqual([]);
  });

  it('asks to scan and says why when the stored pairings cannot be read', async () => {
    const { starter, store, pairings, connections, errors } = setup();
    pairings.failList = true;
    await starter.start('');
    expect(connections).toHaveLength(0);
    expect(store.state.gate).toBe('scan');
    expect(errors).toEqual(['this phone cannot read its saved pairing: blocked']);
  });

  it('refuses an expired or malformed invite without connecting', async () => {
    const late = setup([storedPairing()]);
    await late.starter.start('#pair=' + encodeInvite({ ...invite, expiresAt: NOW - 1 }));
    expect(late.connections).toHaveLength(0);
    expect(late.store.state.gate).toBe('invite-expired');

    const bad = setup();
    await bad.starter.start('#pair=garbage');
    expect(bad.connections).toHaveLength(0);
    expect(bad.store.state.gate).toBe('invite-invalid');
  });

  it('forgets only that profile when its agent says the pairing expired or was revoked', async () => {
    const home = otherComputer('Home');
    const office = storedPairing();
    const { starter, store, pairings, connections } = setup([home, office], office.id);
    await starter.start('');
    connections[0]?.handlers.state('expired');
    await settle();
    expect(pairings.saved).toEqual([home]);
    expect(store.state.link).toBe('expired');
    expect(store.state.gate).toBe('expired');
    // The gate can still offer the computer that is left.
    expect(store.state.profiles).toEqual([
      { id: home.id, name: 'Home', active: false, reach: null },
    ]);
  });

  it('keeps the stored pairing when the agent rejects the phone outright', async () => {
    const { starter, store, pairings, connections } = setup([storedPairing()]);
    await starter.start('');
    connections[0]?.handlers.state('unauthorized');
    await settle();
    expect(pairings.saved).toHaveLength(1);
    expect(store.state.gate).toBe('unauthorized');
  });

  it('on this PC, drops a profile the agent refuses (an old identity) and pairs itself again', async () => {
    const { starter, store, pairings, connections, pairs, localAsks } = setup(
      [storedPairing()],
      agentId,
      { hostname: '127.0.0.1' },
    );
    await starter.start('');
    connections[0]?.handlers.state('unauthorized');
    await settle();
    await settle();
    expect(pairings.saved).toEqual([]);
    expect(localAsks()).toBe(1);
    expect(pairs).toEqual([pairLink]);
    expect(store.state.profiles).toEqual([]);
  });

  it('never pairs itself again after a refused pairing link, so it cannot loop', async () => {
    const { starter, connections, pairs, localAsks } = setup([], null, { hostname: 'localhost' });
    await starter.start(pairLink);
    connections[0]?.handlers.state('unauthorized');
    await settle();
    expect(localAsks()).toBe(0);
    expect(pairs).toEqual([]);
  });

  it('tells the store which device this browser is once the agent says ready', async () => {
    const { starter, store, connections } = setup([storedPairing()]);
    await starter.start('');
    connections[0]?.handlers.ready('dev1');
    expect(store.thisDevice()).toBe('dev1');
  });

  it('hands pushes to the store and closes the connection on request', async () => {
    const { starter, store, connections } = setup([storedPairing()]);
    await starter.start('');
    const push: ServerMessage = { type: 'status', herdrError: 'down' };
    connections[0]?.handlers.message(push);
    expect(store.state.herdrError).toBe('down');
    starter.close();
    expect(connections[0]?.closed).toBe(true);
    expect(starter.connection).toBeNull();
  });

  it('says so when it could not save a new pairing', async () => {
    const { starter, pairings, connections, errors } = setup();
    pairings.failSave = true;
    await starter.start(pairLink);
    connections[0]?.handlers.ready('dev1');
    await settle();
    expect(errors).toEqual(['this phone could not save its pairing: quota']);
  });

  it('switches profile by recording it and starting the page over', async () => {
    const home = otherComputer('Home');
    const office = storedPairing();
    const { starter, preferences, connections, restarts } = setup([home, office], office.id);
    await starter.start('');
    starter.switchTo(office.id);
    expect(restarts).toHaveLength(0);
    starter.switchTo(home.id);
    expect(preferences.get(ACTIVE_PROFILE)).toBe(home.id);
    expect(connections[0]?.closed).toBe(true);
    expect(restarts).toHaveLength(1);
  });

  it('renames a profile and ignores a blank name', async () => {
    const office = storedPairing();
    const { starter, pairings, store } = setup([office]);
    await starter.start('');
    await starter.rename(office.id, '  Work  ');
    expect(pairings.find(office.id)?.name).toBe('Work');
    expect(store.activeProfileName()).toBe('Work');
    await starter.rename(office.id, '   ');
    expect(pairings.find(office.id)?.name).toBe('Work');
  });

  it('keeps the old name and says why when a rename cannot be saved', async () => {
    const office = storedPairing();
    const { starter, pairings, store, errors } = setup([office]);
    await starter.start('');
    pairings.failSave = true;
    await starter.rename(office.id, 'Work');
    expect(pairings.find(office.id)?.name).toBe('Office');
    expect(store.activeProfileName()).toBe('Office');
    expect(errors).toEqual(['this phone could not rename the computer: quota']);
  });

  it('removes the active profile, unlinks this phone there and moves to the next one', async () => {
    const home = otherComputer('Home');
    const office = storedPairing();
    const { starter, pairings, preferences, connections, restarts } = setup(
      [office, home],
      office.id,
    );
    await starter.start('');
    await starter.remove(office.id);
    expect(connections[0]?.requests).toEqual([{ kind: 'unlink', id: 'dev1' }]);
    expect(pairings.saved).toEqual([home]);
    expect(preferences.get(ACTIVE_PROFILE)).toBe(home.id);
    expect(restarts).toHaveLength(1);
  });

  it('asks for a QR code once the last profile is removed', async () => {
    const office = storedPairing();
    const { starter, store, pairings, restarts } = setup([office]);
    await starter.start('');
    await starter.remove(office.id);
    expect(pairings.saved).toEqual([]);
    expect(store.state.gate).toBe('scan');
    expect(restarts).toHaveLength(0);
  });

  it('removes another profile without touching the line', async () => {
    const home = otherComputer('Home');
    const office = storedPairing();
    const { starter, pairings, connections, restarts } = setup([office, home], office.id);
    await starter.start('');
    await starter.remove(home.id);
    expect(pairings.saved).toEqual([office]);
    expect(connections[0]?.requests).toEqual([]);
    expect(connections[0]?.closed).toBe(false);
    expect(restarts).toHaveLength(0);
  });

  it('marks another profile online when its agent completes a handshake, then hangs up', async () => {
    const home = otherComputer('Home');
    const office = storedPairing();
    const { starter, store, connections } = setup([office, home], office.id);
    await starter.start('');
    const checking = starter.checkProfiles();
    await settle();
    expect(store.state.profiles.find((p) => p.id === home.id)?.reach).toBe('checking');
    const probe = connections[1];
    expect(probe?.credentials).toEqual({
      phone: home.phone,
      agentKey: home.agentKey,
      invite: null,
    });
    probe?.handlers.state('connecting');
    probe?.handlers.ready('dev9');
    await checking;
    expect(store.state.profiles.find((p) => p.id === home.id)?.reach).toBe('online');
    expect(probe?.closed).toBe(true);
    // The active profile is never probed: its own link tells.
    expect(connections).toHaveLength(2);
    expect(store.state.profiles.find((p) => p.id === office.id)?.reach).toBeNull();
  });

  it('marks another profile offline when its agent refuses or never answers', async () => {
    const home = otherComputer('Home');
    const lab = otherComputer('Lab');
    const office = storedPairing();
    const { starter, store, connections } = setup([office, home, lab], office.id);
    await starter.start('');
    const checking = starter.checkProfiles();
    await settle();
    connections[1]?.handlers.state('closed');
    await checking;
    const reach = (id: string) => store.state.profiles.find((p) => p.id === id)?.reach;
    expect(reach(home.id)).toBe('offline');
    expect(reach(lab.id)).toBe('offline');
    expect(connections[1]?.closed).toBe(true);
    expect(connections[2]?.closed).toBe(true);
  });
});
