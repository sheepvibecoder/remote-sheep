// How the phone gets onto the line: pair with a scanned QR, reconnect with the
// pairing of the active profile, or ask for a QR. The handshake itself lives in the
// connection; this decides which credentials it gets and when a pairing is kept or
// dropped. A profile is one paired computer; the page shows one at a time.

import { generateKeyPair, type KeyPair } from '@remote-sheep/protocol';
import { readPairLink } from '../L1_domain/pair-link';
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
}

export interface StarterOptions {
  now?: () => number;
  generateKeys?: () => KeyPair;
  /** How long a probe waits for another profile's agent before calling it offline. */
  probeTimeoutMs?: number;
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
      this.store.setGate('scan');
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
      },
      ready: (device) => {
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
