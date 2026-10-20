import { describe, expect, it } from 'vitest';
import { RELAY_CODE_PROBLEM, RELAY_URL_PROBLEM, type RelaySetting } from '@remote-sheep/protocol';
import type { RelayDialer, RelayOutcome, SavedRelay } from '../../src/L1_domain/ports/relay';
import {
  RELAY_DIAL_WAIT_MS,
  RELAY_FIXED,
  RelaySwitch,
} from '../../src/L2_application/relay-switch';

class MemorySavedRelay implements SavedRelay {
  setting: RelaySetting | null = null;
  async save(setting: RelaySetting): Promise<void> {
    this.setting = setting;
    await Promise.resolve();
  }
  async forget(): Promise<void> {
    this.setting = null;
    await Promise.resolve();
  }
}

/** Records what was dialled; "connects" at once unless `next` says otherwise. */
class FakeDialer implements RelayDialer {
  calls: string[] = [];
  waits: number[] = [];
  open = false;
  trouble: string | null = null;
  next: RelayOutcome = { connected: true, problem: null };
  async dial(setting: RelaySetting): Promise<void> {
    this.calls.push('dial ' + setting.url + ' ' + setting.code);
    this.open = this.next.connected;
    this.trouble = this.next.problem;
    await Promise.resolve();
  }
  async settled(withinMs: number): Promise<RelayOutcome> {
    this.waits.push(withinMs);
    await Promise.resolve();
    return { connected: this.open, problem: this.trouble };
  }
  async hangUp(): Promise<void> {
    this.calls.push('hang up');
    this.open = false;
    this.trouble = null;
    await Promise.resolve();
  }
  connected(): boolean {
    return this.open;
  }
  problem(): string | null {
    return this.trouble;
  }
}

const RELAY: RelaySetting = { url: 'https://relay.example.com', code: 'c0de' };

function relaySwitch(initial: RelaySetting | null, fixed = false) {
  const saved = new MemorySavedRelay();
  const dialer = new FakeDialer();
  return { saved, dialer, relay: new RelaySwitch({ saved, dialer, initial, fixed }) };
}

describe('RelaySwitch', () => {
  it('dials the relay of the variables at start, as before, and lets nobody change it', async () => {
    const { saved, dialer, relay } = relaySwitch(RELAY, true);
    await relay.start();
    expect(dialer.calls).toEqual(['dial https://relay.example.com c0de']);
    expect(relay.relay()).toEqual({
      on: true,
      url: 'https://relay.example.com',
      connected: true,
      fixed: true,
    });
    expect(relay.origin()).toBe('https://relay.example.com');
    await expect(relay.changeRelay({ url: 'https://other.dev', code: 'x' })).rejects.toThrow(
      RELAY_FIXED,
    );
    await expect(relay.changeRelay({ off: true })).rejects.toThrow(RELAY_FIXED);
    expect(dialer.calls).toHaveLength(1);
    expect(saved.setting).toBeNull();
  });

  it('tells its listeners after each change, so push can follow the relay', async () => {
    const { relay } = relaySwitch(null);
    const heard: (string | null)[] = [];
    relay.onChange(() => heard.push(relay.origin()));
    await relay.changeRelay({ url: 'https://relay.example.com', code: 'c0de' });
    await relay.changeRelay({ off: true });
    await expect(relay.changeRelay({ url: 'ftp://x', code: 'c' })).rejects.toThrow();
    expect(heard).toEqual(['https://relay.example.com', null]);
  });

  it('serves the LAN only with no relay, saying so', async () => {
    const { dialer, relay } = relaySwitch(null);
    await relay.start();
    expect(dialer.calls).toEqual([]);
    expect(relay.relay()).toEqual({ on: false, url: null, connected: false, fixed: false });
    expect(relay.origin()).toBeNull();
  });

  it('saves a new relay, dials it at once and answers without the code', async () => {
    const { saved, dialer, relay } = relaySwitch(null);
    await relay.start();
    const info = await relay.changeRelay({
      url: ' https://relay.example.com/path ',
      code: ' c0de ',
    });
    expect(info).toEqual({
      on: true,
      url: 'https://relay.example.com',
      connected: true,
      fixed: false,
    });
    expect(JSON.stringify(info)).not.toContain('c0de');
    expect(saved.setting).toEqual(RELAY);
    expect(dialer.calls).toEqual(['dial https://relay.example.com c0de']);
    expect(relay.origin()).toBe('https://relay.example.com');
  });

  it('answers a change only once the dial has an outcome, waiting about 5 seconds at most', async () => {
    const { dialer, relay } = relaySwitch(null);
    const set = { url: 'https://relay.example.com', code: 'c0de' };
    expect(await relay.changeRelay(set)).toMatchObject({ connected: true });
    expect(dialer.waits).toEqual([RELAY_DIAL_WAIT_MS]);
    expect(RELAY_DIAL_WAIT_MS).toBe(5000);

    dialer.next = { connected: false, problem: 'The relay refused the access code.' };
    const refused = await relay.changeRelay(set);
    expect(refused).toEqual({
      on: true,
      url: 'https://relay.example.com',
      connected: false,
      fixed: false,
      problem: 'The relay refused the access code.',
    });
    // Saved all the same: the person fixes the code, or the relay owner does.
    expect(relay.origin()).toBe('https://relay.example.com');

    dialer.next = { connected: false, problem: null };
    expect(await relay.changeRelay(set)).toEqual({
      on: true,
      url: 'https://relay.example.com',
      connected: false,
      fixed: false,
    });
  });

  it('turns the relay off: hangs up, forgets it, and the QR code loses its link', async () => {
    const { saved, dialer, relay } = relaySwitch(RELAY);
    await relay.start();
    await saved.save(RELAY);
    expect(await relay.changeRelay({ off: true })).toEqual({
      on: false,
      url: null,
      connected: false,
      fixed: false,
    });
    expect(saved.setting).toBeNull();
    expect(dialer.calls).toEqual(['dial https://relay.example.com c0de', 'hang up']);
    expect(relay.origin()).toBeNull();
  });

  it('refuses a URL that is not https or a bad code, changing nothing', async () => {
    const { saved, dialer, relay } = relaySwitch(null);
    await expect(relay.changeRelay({ url: 'http://relay.example.com', code: 'c' })).rejects.toThrow(
      RELAY_URL_PROBLEM,
    );
    await expect(
      relay.changeRelay({ url: 'https://relay.example.com', code: ' ' }),
    ).rejects.toThrow(RELAY_CODE_PROBLEM);
    expect(saved.setting).toBeNull();
    expect(dialer.calls).toEqual([]);
  });

  it('applies changes one after the other, so the last one asked is the one in use', async () => {
    const { saved, dialer, relay } = relaySwitch(null);
    await Promise.all([
      relay.changeRelay({ url: 'https://a.dev', code: 'a' }),
      relay.changeRelay({ off: true }),
      relay.changeRelay({ url: 'https://b.dev', code: 'b' }),
    ]);
    expect(dialer.calls).toEqual(['dial https://a.dev a', 'hang up', 'dial https://b.dev b']);
    expect(saved.setting).toEqual({ url: 'https://b.dev', code: 'b' });
    expect(relay.origin()).toBe('https://b.dev');
  });
});
