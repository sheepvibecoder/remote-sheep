// `remote-sheep relay change`, which the Herdr plugin's relay pane runs: shows the running agent's
// relay, asks for a new URL and access code (or an empty URL to turn it off), hands them to the
// agent, which connects at once and keeps them, and closes. The code is never printed.

import {
  checkRelaySetting,
  RELAY_URL_PROBLEM,
  relayIsOn,
  type RelayChange,
  type RelayInfo,
} from '@remote-sheep/protocol';

export interface Questions {
  /** The answer as typed; null when the person closed the prompt (Esc, Ctrl+C, end of input). */
  ask(question: string, hidden: boolean): Promise<string | null>;
}

export interface RelayPromptOptions {
  /** Reads the running agent's relay, or changes it; rejects with a message for the person. */
  request: (change?: RelayChange) => Promise<RelayInfo>;
  questions: Questions;
  print: (text: string) => void;
  /** Keeps the last message on screen until the person is done with it. */
  waitToClose: () => Promise<void>;
}

const URL_QUESTION = 'Relay URL (https://...), or leave it empty to turn the relay off: ';
const CODE_QUESTION = 'Access code (not shown as you type): ';
const UNCHANGED = 'Nothing changed.';

export function describeRelay(info: RelayInfo): string {
  if (!relayIsOn(info)) {
    return 'The relay is off: phones reach this computer on the local network only.';
  }
  const state = info.connected
    ? 'connected'
    : info.problem
      ? 'not connected: ' + info.problem
      : 'still connecting';
  return 'Relay: ' + info.url + ' (' + state + ')';
}

/** What a change came to: connected, refused or failed with the reason, or still trying. */
export function describeChange(info: RelayInfo): string {
  if (!relayIsOn(info)) {
    return 'Relay turned off and forgotten. Phones reach this computer on the local network only.';
  }
  if (info.connected) {
    return (
      'Relay set and connected: ' +
      info.url +
      '. It is kept after a restart. Show the pairing QR again: the relay link comes first.'
    );
  }
  if (info.problem) return 'Relay saved: ' + info.url + ', but not connected. ' + info.problem;
  return (
    'Relay saved: ' +
    info.url +
    '. Still connecting; the agent keeps trying. Show the pairing QR again: the relay link ' +
    'comes first.'
  );
}

/** Resolves once the person is done; rejects, like `qr`, when the agent cannot be asked. */
export async function showRelayPrompt(options: RelayPromptOptions): Promise<void> {
  const { request, questions, print } = options;
  const current = await request();
  print(describeRelay(current));
  if (current.fixed) {
    print('It is set by the REMOTE_SHEEP_RELAY variables on this computer; change it there.');
    await options.waitToClose();
    return;
  }
  const change = await askChange(questions, print);
  // Esc closes at once, as the person asked; every other ending leaves its message to read.
  if (change === 'unchanged') {
    print(UNCHANGED);
    return;
  }
  await apply(options, change);
  await options.waitToClose();
}

async function apply(options: RelayPromptOptions, change: RelayChange): Promise<void> {
  const { request, print } = options;
  try {
    print(describeChange(await request(change)));
  } catch (error) {
    print(error instanceof Error ? error.message : String(error));
  }
}

async function askChange(
  questions: Questions,
  print: (text: string) => void,
): Promise<RelayChange | 'unchanged'> {
  for (;;) {
    const url = await questions.ask(URL_QUESTION, false);
    if (url === null) return 'unchanged';
    // Turning off a relay that is already off is the agent's call (it changes nothing).
    if (!url.trim()) return { off: true };
    // The code is checked on its own below; a placeholder lets the URL be judged first.
    const checked = checkRelaySetting(url, 'x');
    if (!checked.ok) {
      print(RELAY_URL_PROBLEM);
      continue;
    }
    for (;;) {
      const code = await questions.ask(CODE_QUESTION, true);
      if (code === null) return 'unchanged';
      const both = checkRelaySetting(url, code);
      if (both.ok) return { url: both.setting.url, code: both.setting.code };
      print(both.error);
    }
  }
}
