// `remote-sheep qr` in a terminal: shows a new pairing and waits for a key. Enter asks the agent
// for another, q, Esc or Ctrl+C close. Closing ends only this command; the agent keeps serving.

import type { Pairing } from '../../L1_domain/pairing';
import { describePairing, QR_KEYS_HINT, qrKey } from './pairing-messages';

/** The keyboard, as `process.stdin` offers it. */
export interface KeyInput {
  readonly isTTY?: boolean;
  setRawMode(raw: boolean): unknown;
  setEncoding(encoding: 'utf8'): unknown;
  on(event: 'data', listener: (chunk: string) => void): unknown;
  off(event: 'data', listener: (chunk: string) => void): unknown;
  pause(): unknown;
}

export interface Screen {
  clear(): void;
  print(text: string): void;
}

export interface PairingPromptOptions {
  /** Asks the running agent for a new pairing; rejects with a message for the person. */
  request: () => Promise<Pairing>;
  input: KeyInput;
  output: Screen;
}

/** Resolves when the person closes it; rejects, terminal restored, when a request fails. */
export async function showPairingPrompt(options: PairingPromptOptions): Promise<void> {
  const { request, input, output } = options;
  const show = async () => {
    const pairing = await request();
    output.clear();
    output.print(await describePairing(pairing));
  };
  await show();
  // Without a terminal (a script, a pipe) there are no keys to wait for: one QR code is enough.
  if (!input.isTTY) return;
  output.print(QR_KEYS_HINT);
  input.setRawMode(true);
  input.setEncoding('utf8');
  await new Promise<void>((resolve, reject) => {
    const restore = () => {
      input.off('data', onKey);
      input.setRawMode(false);
      input.pause();
    };
    const onKey = (chunk: string) => {
      const key = qrKey(chunk);
      if (key === 'close') {
        restore();
        resolve();
      } else if (key === 'again') {
        show().then(
          () => {
            output.print(QR_KEYS_HINT);
          },
          (err: unknown) => {
            restore();
            reject(err instanceof Error ? err : new Error(String(err)));
          },
        );
      }
    };
    input.on('data', onKey);
  });
}
