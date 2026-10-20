import { describe, expect, it } from 'vitest';
import {
  RELAY_CODE_PROBLEM,
  RELAY_URL_PROBLEM,
  type RelayChange,
  type RelayInfo,
} from '@remote-sheep/protocol';
import { showRelayPrompt } from '../../../src/L3_periphery/cli/relay-prompt';

const OFF: RelayInfo = { on: false, url: null, connected: false, fixed: false };
const ON: RelayInfo = { on: true, url: 'https://relay.example.com', connected: true, fixed: false };

/** Answers the questions in order; null stands for Esc or Ctrl+C. */
function setup(
  state: RelayInfo,
  answers: (string | null)[],
  refuse?: string,
  outcome: Partial<RelayInfo> = { connected: true },
) {
  const asked: { question: string; hidden: boolean }[] = [];
  const changes: RelayChange[] = [];
  const printed: string[] = [];
  let closed = 0;
  const run = showRelayPrompt({
    request: (change) => {
      if (!change) return Promise.resolve(state);
      if (refuse) return Promise.reject(new Error(refuse));
      changes.push(change);
      return Promise.resolve('off' in change ? OFF : { ...ON, url: change.url, ...outcome });
    },
    questions: {
      ask: (question, hidden) => {
        asked.push({ question, hidden });
        return Promise.resolve(answers.shift() ?? null);
      },
    },
    print: (text) => printed.push(text),
    waitToClose: () => {
      closed++;
      return Promise.resolve();
    },
  });
  return { run, asked, changes, printed, closed: () => closed };
}

describe('showRelayPrompt', () => {
  it('asks for the URL, then the code without showing it, and hands both to the agent', async () => {
    const { run, asked, changes, printed, closed } = setup(OFF, [
      'https://relay.example.com',
      'c0de',
    ]);
    await run;
    expect(asked.map((a) => a.hidden)).toEqual([false, true]);
    expect(changes).toEqual([{ url: 'https://relay.example.com', code: 'c0de' }]);
    expect(printed.join('\n')).toContain('The relay is off');
    expect(printed.join('\n')).toContain('Relay set and connected: https://relay.example.com');
    expect(printed.join('\n')).not.toContain('c0de');
    expect(closed()).toBe(1);
  });

  it('says why the relay did not connect, keeping the setting', async () => {
    const problem = 'The relay refused the access code: it is wrong.';
    const { run, printed } = setup(OFF, ['https://relay.example.com', 'bad'], undefined, {
      connected: false,
      problem,
    });
    await run;
    expect(printed.at(-1)).toBe(
      'Relay saved: https://relay.example.com, but not connected. ' + problem,
    );
  });

  it('says it is still connecting when the relay did not answer in time', async () => {
    const { run, printed } = setup(OFF, ['https://relay.example.com', 'c0de'], undefined, {
      connected: false,
    });
    await run;
    expect(printed.at(-1)).toContain(
      'Relay saved: https://relay.example.com. Still connecting; the agent keeps trying.',
    );
  });

  it('shows the reason in the current state too', async () => {
    const { run, printed } = setup({ ...ON, connected: false, problem: 'Cannot reach it.' }, [
      null,
    ]);
    await run;
    expect(printed[0]).toBe('Relay: https://relay.example.com (not connected: Cannot reach it.)');
  });

  it('turns the relay off and forgets it on an empty URL', async () => {
    const { run, changes, printed } = setup(ON, ['']);
    await run;
    expect(changes).toEqual([{ off: true }]);
    expect(printed.join('\n')).toContain('Relay: https://relay.example.com (connected)');
    expect(printed.join('\n')).toContain('Relay turned off and forgotten');
  });

  it('sends the turn-off even while the relay is already off, leaving that to the agent', async () => {
    const { run, changes, printed } = setup(OFF, ['']);
    await run;
    expect(changes).toEqual([{ off: true }]);
    expect(printed.join('\n')).toContain('Relay turned off and forgotten');
  });

  it('asks again after a URL or a code it cannot use, saying why', async () => {
    const { run, changes, printed } = setup(OFF, [
      'http://relay.example.com',
      'https://relay.example.com',
      'two words',
      'c0de',
    ]);
    await run;
    expect(printed).toContain(RELAY_URL_PROBLEM);
    expect(printed).toContain(RELAY_CODE_PROBLEM);
    expect(changes).toEqual([{ url: 'https://relay.example.com', code: 'c0de' }]);
  });

  it('changes nothing when closed with Esc', async () => {
    for (const answers of [[null], ['https://relay.example.com', null]]) {
      const { run, changes, printed } = setup(OFF, answers);
      await run;
      expect(changes).toEqual([]);
      expect(printed.at(-1)).toBe('Nothing changed.');
    }
  });

  it('only explains a relay the variables set, asking nothing', async () => {
    const { run, asked, printed } = setup({ ...ON, fixed: true }, []);
    await run;
    expect(asked).toEqual([]);
    expect(printed.join('\n')).toContain('REMOTE_SHEEP_RELAY');
  });

  it('shows why the agent refused a change', async () => {
    const { run, printed } = setup(OFF, ['https://relay.example.com', 'c0de'], 'No way.');
    await run;
    expect(printed).toContain('No way.');
  });

  it('fails like qr when the agent is not running', async () => {
    await expect(
      showRelayPrompt({
        request: () => Promise.reject(new Error('remote-sheep is not running.')),
        questions: { ask: () => Promise.resolve(null) },
        print: () => undefined,
        waitToClose: () => Promise.resolve(),
      }),
    ).rejects.toThrow('remote-sheep is not running.');
  });
});
