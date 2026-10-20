import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import { describe, expect, it } from 'vitest';
import { TerminalQuestions } from '../../../src/L3_periphery/cli/terminal-questions';

/** A raw-mode terminal: `type` sends what the keys would. */
class FakeTerminal extends EventEmitter {
  readonly isTTY = true;
  raw: boolean[] = [];
  setRawMode(raw: boolean) {
    this.raw.push(raw);
    return this;
  }
  setEncoding() {
    return this;
  }
  resume() {
    return this;
  }
  pause() {
    return this;
  }
  type(keys: string) {
    this.emit('data', keys);
  }
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 10));

describe('TerminalQuestions', () => {
  it('echoes a visible answer, hides a secret one, and honours Backspace', async () => {
    const terminal = new FakeTerminal();
    let shown = '';
    const questions = new TerminalQuestions(terminal, (text) => (shown += text));
    const url = questions.ask('URL: ', false);
    await settle();
    terminal.type('https://x');
    terminal.type('\r');
    expect(await url).toBe('https://x');
    const code = questions.ask('Code: ', true);
    await settle();
    terminal.type('c0dX');
    terminal.type('\x7f');
    terminal.type('e\r');
    expect(await code).toBe('c0de');
    expect(shown).toContain('URL: https://x');
    expect(shown).not.toContain('c0d');
    expect(terminal.raw.at(-1)).toBe(false);
  });

  it('answers null on Esc or Ctrl+C', async () => {
    for (const key of ['\x1b', '\x03']) {
      const terminal = new FakeTerminal();
      const answer = new TerminalQuestions(terminal, () => undefined).ask('URL: ', false);
      await settle();
      terminal.type('abc');
      terminal.type(key);
      expect(await answer).toBeNull();
    }
  });

  it('reads one line per question from a pipe, and null once it ends', async () => {
    const pipe = new PassThrough();
    let shown = '';
    const questions = new TerminalQuestions(pipe, (text) => (shown += text));
    pipe.end('https://x\r\nc0de\n');
    expect(await questions.ask('URL: ', false)).toBe('https://x');
    expect(await questions.ask('Code: ', true)).toBe('c0de');
    expect(await questions.ask('More: ', false)).toBeNull();
    expect(shown).not.toContain('c0de');
  });
});
