// Questions typed in a terminal, for `remote-sheep relay change`. In a terminal the keys are read
// one by one, so a secret answer (the relay access code) is never echoed; from a pipe (a script,
// a test) each question takes the next line.

import { createInterface, type Interface } from 'node:readline';
import type { Readable } from 'node:stream';
import type { Questions } from './relay-prompt';

/** The keyboard as `process.stdin` offers it in a terminal. */
export interface RawKeys {
  readonly isTTY: true;
  setRawMode(raw: boolean): unknown;
  setEncoding(encoding: 'utf8'): unknown;
  on(event: 'data', listener: (chunk: string) => void): unknown;
  off(event: 'data', listener: (chunk: string) => void): unknown;
  resume(): unknown;
  pause(): unknown;
}

const ENTER = new Set(['\r', '\n']);
const BACKSPACE = new Set(['\x7f', '\b']);
const CANCEL = new Set(['\x1b', '\x03']);

// process.stdin is typed as one stream whether or not it is a terminal; isTTY tells them apart.
const isRawKeys = (input: RawKeys | Readable): input is RawKeys =>
  (input as { isTTY?: unknown }).isTTY === true;

export class TerminalQuestions implements Questions {
  private lines: Interface | null = null;
  private readonly pending: string[] = [];
  private ended = false;
  private waiting: ((line: string | null) => void) | null = null;

  constructor(
    private readonly input: RawKeys | Readable,
    private readonly write: (text: string) => void,
  ) {}

  ask(question: string, hidden: boolean): Promise<string | null> {
    this.write(question);
    const input = this.input;
    if (isRawKeys(input)) return this.readKeys(input, hidden);
    return this.readLine().then((line) => {
      this.write('\n');
      return line;
    });
  }

  private readKeys(keys: RawKeys, hidden: boolean): Promise<string | null> {
    keys.setRawMode(true);
    keys.setEncoding('utf8');
    keys.resume();
    return new Promise((resolve) => {
      let typed = '';
      const finish = (answer: string | null) => {
        keys.off('data', onKeys);
        keys.setRawMode(false);
        keys.pause();
        this.write('\n');
        resolve(answer);
      };
      const onKeys = (chunk: string) => {
        // A paste arrives as one chunk; each character counts as one key.
        for (const key of chunk) {
          if (ENTER.has(key)) {
            finish(typed);
            return;
          }
          if (CANCEL.has(key)) {
            finish(null);
            return;
          }
          if (BACKSPACE.has(key)) {
            if (typed && !hidden) this.write('\b \b');
            typed = typed.slice(0, -1);
          } else if (key >= ' ') {
            typed += key;
            if (!hidden) this.write(key);
          }
        }
      };
      keys.on('data', onKeys);
    });
  }

  private readLine(): Promise<string | null> {
    if (!this.lines) {
      const lines = createInterface({ input: this.input as Readable, terminal: false });
      lines.on('line', (line) => {
        this.deliver(line);
      });
      lines.on('close', () => {
        this.ended = true;
        this.deliver(null);
      });
      this.lines = lines;
    }
    const next = this.pending.shift();
    if (next !== undefined) return Promise.resolve(next);
    if (this.ended) return Promise.resolve(null);
    return new Promise((resolve) => {
      this.waiting = resolve;
    });
  }

  private deliver(line: string | null): void {
    const waiting = this.waiting;
    this.waiting = null;
    if (waiting) waiting(line);
    else if (line !== null) this.pending.push(line);
  }
}
