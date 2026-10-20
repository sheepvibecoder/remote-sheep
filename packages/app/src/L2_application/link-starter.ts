// How the phone gets onto the line: pair with a scanned QR, reconnect with the
// pairing of the active profile, or ask for a QR. The handshake itself lives in the
// connection; this decides which credentials it gets and when a pairing is kept or
// dropped. A profile is one paired computer; the page shows one at a time.
//
// A page opened in a browser on the agent's own computer, with no profile yet, asks the agent
// that served it for a pairing link and opens on it as a scanned QR would: the person lands in
// the sessions list with nothing to scan. Its storage belongs to that address alone, so no profile
// there means this browser never paired with that agent.

import { generateKeyPair, type KeyPair } from '@remote-sheep/protocol';
import { readPairLink } from '../L1_domain/pair-link';
import type { LocalPairing } from '../L1_domain/ports/local-pairing';
import { isThisPcHost } from '../L1_domain/this-pc';
import { profileIdOf } from '../L1_domain/profile';
import type { AgentConnection, Connect, Credentials } from '../L1_domain/ports/agent-connection';
import type { PairingStore, StoredPairing } from '../L1_domain/ports/pairing-store';
import type { Preferences } from '../L1_domain/ports/preferences';
import type { Store } from './app.store';
import { ACTIVE_PROFILE } from './profile-choice';

export interface StarterHooks {
  /** After every successful (re)connection: the page re-sends what it watches. */
  ready(): void;
  /** Something the person should know that does not stop the app. */
  error(message: string): void;
  /**
   * Starts the page over on the profile now recorded as active: every per-profile
   * state (sessions, badges, the open chat) begins clean that way.
   */
  restart(): void;
  /** Opens the page on this pairing link (`#pair=…`), exactly as a scanned QR does. */
  pair(fragment: string): void;
}

export interface StarterOptions {
  now?: () => number;
  generateKeys?: () => KeyPair;
  /** How long a probe waits for another profile's agent before calling it offline. */
  probeTimeoutMs?: number;
  /** Where the page was served from, and how it asks that agent to pair it with no QR. */
  page?: { hostname: string; localPairing: LocalPairing };
}

const PROBE_TIMEOUT_MS = 8000;
const NEW_NAME = 'Computer ';

const describe = (error: unknown) => (error instanceof Error ? error.message : String(error));

export class LinkStarter {
  private current: AgentConnection | null = null;
  /** The profile on the line; null while the page waits for a QR. */
  private active: StoredPairing | null = null;
  private readonly now: () => number;
  private readonly generateKeys: () => KeyPair;
  private readonly probeTimeoutMs: number;
  private readonly page: StarterOptions['page'];

  constructor(
    private readonly store: Store,
    private readonly pairings: PairingStore,
    private readonly connect: Connect,
    private readonly hooks: StarterHooks,
    private readonly preferences: Preferences,
    options: StarterOptions = {},
  ) {
    this.now = options.now ?? Date.now;
    this.generateKeys = options.generateKeys ?? (() => generateKeyPair());
    this.probeTimeoutMs = options.probeTimeoutMs ?? PROBE_TIMEOUT_MS;
    this.page = options.page;
  }

  /** The open connection, or null while the page waits for a QR. */
  get connection(): AgentConnection | null {
    return this.current;
  }

  /** Starts from the URL fragment the page opened with (already gone from the address bar). */
  async start(fragment: string): Promise<void> {
    const link = readPairLink(fragment, this.now());
    const saved = await this.list();
    switch (link.kind) {
      case 'expired':
        this.store.setGate('invite-expired');
        return;
      case 'invalid':
        this.store.setGate('invite-invalid');
        return;
      case 'invite':
        // A new pairing always gets a new key pair: an old one may be the reason for the new QR.
        this.open(
          { phone: this.generateKeys(), agentKey: link.invite.agentKey, invite: link.invite },
          profileIdOf(link.invite.agentKey),
        );
        return;
      case 'none':
        break;
    }
    const wanted = this.preferences.getItem(ACTIVE_PROFILE);
    const profile = saved.find((p) => p.id === wanted) ?? saved[0];
    if (!profile) {
      if (!(await this.pairItself())) this.store.setGate('scan');
      return;
    }
    if (profile.id !== wanted) {
      // The page was built for another profile's preferences; start over on this one.
      this.preferences.setItem(ACTIVE_PROFILE, profile.id);
      this.hooks.restart();
      return;
    }
    this.active = profile;
    this.open({ phone: profile.phone, agentKey: profile.agentKey, invite: null }, profile.id);
  }

  close(): void {
    this.current?.close();
    this.current = null;
  }

  /** Makes another profile the active one; the page starts over on it. */
  switchTo(id: string): void {
    if (id === this.active?.id) return;
    this.preferences.setItem(ACTIVE_PROFILE, id);
    this.close();
    this.hooks.restart();
  }

  async rename(id: string, name: string): Promise<void> {
    const trimmed = name.trim();
    const profile = (await this.list()).find((p) => p.id === id);
    if (!profile || !trimmed) return;
    try {
      await this.pairings.save({ ...profile, name: trimmed });
    } catch (error) {
      this.hooks.error('this phone could not rename the computer: ' + describe(error));
      return;
    }
    if (this.active?.id === id) this.active = { ...this.active, name: trimmed };
    await this.list();
  }

  /**
   * Forgets a computer on this phone. The active one is also asked to unlink this
   * phone, so it drops from that computer's device list; then the page moves on.
   */
  async remove(id: string): Promise<void> {
    if (this.active?.id === id) {
      await this.current?.request({ kind: 'unlink', id: this.active.device }).catch(() => {
        // Offline or already unlinked: the phone forgets it all the same.
      });
    }
    try {
      await this.pairings.remove(id);
    } catch (error) {
      this.hooks.error('this phone could not forget the computer: ' + describe(error));
      return;
    }
    const rest = await this.list();
    if (this.active?.id !== id) return;
    this.active = null;
    this.close();
    const next = rest[0];
    if (next) {
      this.switchTo(next.id);
    } else {
      this.store.setGate('scan');
    }
  }

  /**
   * Asks every other profile's agent whether it answers now. The active one needs no
   * probe: its own link says so. Each probe is a full handshake that hangs up once ready.
   */
  async checkProfiles(): Promise<void> {
    const others = (await this.list()).filter((p) => p.id !== this.active?.id);
    for (const profile of others) this.store.setReach(profile.id, 'checking');
    await Promise.all(
      others.map(async (profile) => {
        this.store.setReach(profile.id, (await this.probe(profile)) ? 'online' : 'offline');
      }),
    );
  }

  private probe(profile: StoredPairing): Promise<boolean> {
    return new Promise((resolve) => {
      let line: AgentConnection | null = null;
      let finished = false;
      const finish = (online: boolean) => {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        line?.close();
        resolve(online);
      };
      const timer = setTimeout(() => {
        finish(false);
      }, this.probeTimeoutMs);
      line = this.connect(
        { phone: profile.phone, agentKey: profile.agentKey, invite: null },
        {
          message: () => undefined,
          state: (state) => {
            if (state !== 'connecting' && state !== 'open') finish(false);
          },
          ready: () => {
            finish(true);
          },
        },
      );
    });
  }

  private onThisPc(): boolean {
    return this.page !== undefined && isThisPcHost(this.page.hostname);
  }

  private async pairAgain(id: string): Promise<void> {
    this.close();
    await this.forget(id);
    await this.pairItself();
  }

  /** On this PC, asks the agent for a pairing link and opens on it; false when it cannot. */
  private async pairItself(): Promise<boolean> {
    const page = this.page;
    if (!page || !this.onThisPc()) return false;
    let fragment: string;
    try {
      fragment = await page.localPairing.invite();
    } catch (error) {
      this.hooks.error('this browser could not pair itself: ' + describe(error));
      return false;
    }
    if (readPairLink(fragment, this.now()).kind !== 'invite') return false;
    this.hooks.pair(fragment);
    return true;
  }

  /** Reads the stored profiles and hands them to the store; empty when they cannot be read. */
  private async list(): Promise<StoredPairing[]> {
    let saved: StoredPairing[] = [];
    try {
      saved = await this.pairings.list();
    } catch (error) {
      this.hooks.error('this phone cannot read its saved pairing: ' + describe(error));
    }
    this.store.setProfiles(
      saved.map((p) => ({ id: p.id, name: p.name })),
      this.active?.id ?? this.preferences.getItem(ACTIVE_PROFILE),
    );
    return saved;
  }

  private open(credentials: Credentials, id: string): void {
    this.close();
    this.store.setGate(null);
    // Kept only once a sealed `ready` proved the agent of the QR is on the other end.
    let unsaved = credentials.invite !== null;
    this.current = this.connect(credentials, {
      message: (message) => this.store.receive(message),
      state: (state) => {
        this.store.setLink(state);
        // The link is already over; forget reports its own failure, so nothing waits for it.
        if (state === 'expired') void this.forget(id);
        // On this PC a kept profile the agent refuses is from an identity it no longer has (its
        // data folder was replaced): drop it and pair again, as a page with no profile does.
        // Never for a pairing link, so a refused pairing cannot start another one.
        if (state === 'unauthorized' && credentials.invite === null && this.onThisPc()) {
          void this.pairAgain(id);
        }
      },
      ready: (device) => {
        this.store.setThisDevice(device);
        if (unsaved) {
          unsaved = false;
          // The link works whether or not the save lands; remember reports its own failure.
          void this.remember(credentials, id, device);
        }
        this.hooks.ready();
      },
    });
  }

  private async remember(credentials: Credentials, id: string, device: string): Promise<void> {
    let saved: StoredPairing[] = [];
    try {
      saved = await this.pairings.list();
    } catch {
      // Unreadable means there is nothing to replace; the new pairing still gets saved.
    }
    const previous = saved.find((p) => p.id === id);
    const pairing: StoredPairing = {
      id,
      name: previous?.name ?? NEW_NAME + String(saved.length + 1),
      phone: credentials.phone,
      agentKey: credentials.agentKey,
      device,
    };
    try {
      await this.pairings.save(pairing);
    } catch (error) {
      this.hooks.error('this phone could not save its pairing: ' + describe(error));
      return;
    }
    this.active = pairing;
    this.preferences.setItem(ACTIVE_PROFILE, id);
    await this.list();
    // Scanning a new QR of the same computer makes this browser a new device there;
    // the one it was before is dropped so its list shows each browser once.
    if (previous && previous.device !== device) {
      this.current?.request({ kind: 'unlink', id: previous.device }).catch(() => {
        // Already unlinked or expired: either way it is gone, which is the point.
      });
    }
  }

  private async forget(id: string): Promise<void> {
    try {
      await this.pairings.remove(id);
    } catch (error) {
      this.hooks.error('this phone could not forget its pairing: ' + describe(error));
    }
    if (this.active?.id === id) this.active = null;
    await this.list();
  }
}
