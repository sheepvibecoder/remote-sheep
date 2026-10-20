import { EventEmitter } from 'node:events';
import { describe, expect, it } from 'vitest';
import type { Pairing } from '../../../src/L1_domain/pairing';
import { showPairingPrompt } from '../../../src/L3_periphery/cli/pairing-prompt';

/** A keyboard: `press` sends a key the way a raw-mode terminal does. */
class FakeKeys extends EventEmitter {
  raw: boolean[] = [];
  paused = false;
  constructor(readonly isTTY: boolean) {
    super();
  }
  setRawMode(raw: boolean) {
    this.raw.push(raw);
    return this;
  }
  setEncoding() {
    return this;
  }
  pause() {
    this.paused = true;
    return this;
  }
  press(key: string) {
    this.emit('data', key);
  }
}

class FakeScreen {
  readonly printed: string[] = [];
  clears = 0;
  clear() {
    this.clears++;
  }
  print(text: string) {
    this.printed.push(text);
  }
}

const pairing = (n: number): Pairing => ({
  links: [{ where: 'this-pc', url: 'http://127.0.0.1:3999/#pair=' + String(n) }],
  expiresAt: 0,
});

/** Lets the prompt's pending promises settle. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 20));

function setup(isTTY = true, fails: number[] = []) {
  const keys = new FakeKeys(isTTY);
  const screen = new FakeScreen();
  let asked = 0;
  const request = () => {
    asked++;
    return fails.includes(asked)
      ? Promise.reject(new Error('remote-sheep is not running'))
      : Promise.resolve(pairing(asked));
  };
  const done = showPairingPrompt({ request, input: keys, output: screen });
  return { keys, screen, done, asked: () => asked };
}

describe('showPairingPrompt', () => {
  it('shows one pairing and returns when there is no terminal to read keys from', async () => {
    const { keys, screen, done } = setup(false);
    await done;
    expect(screen.printed.join('\n')).toContain('#pair=1');
    expect(keys.raw).toEqual([]);
  });

  it('shows a new pairing on Enter, and closes on q, Esc or Ctrl+C', async () => {
    for (const close of ['q', '\u001b', '\u0003']) {
      const { keys, screen, done, asked } = setup();
      await settle();
      keys.press('\r');
      await settle();
      expect(asked()).toBe(2);
      expect(screen.printed.join('\n')).toContain('#pair=2');
      expect(screen.clears).toBe(2);
      keys.press('x');
      await settle();
      expect(asked()).toBe(2);
      keys.press(close);
      await done;
      expect(keys.raw).toEqual([true, false]);
      expect(keys.paused).toBe(true);
      expect(keys.listenerCount('data')).toBe(0);
    }
  });

  it('restores the terminal and reports the error when a new pairing fails', async () => {
    const { keys, done } = setup(true, [2]);
    await settle();
    keys.press('\r');
    await expect(done).rejects.toThrow('remote-sheep is not running');
    expect(keys.raw).toEqual([true, false]);
    expect(keys.listenerCount('data')).toBe(0);
  });

  it('never touches the terminal when the first pairing fails', async () => {
    const { keys, done } = setup(true, [1]);
    await expect(done).rejects.toThrow('remote-sheep is not running');
    expect(keys.raw).toEqual([]);
  });
});
