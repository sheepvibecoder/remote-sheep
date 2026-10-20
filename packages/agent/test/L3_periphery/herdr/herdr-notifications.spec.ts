import { describe, expect, it } from 'vitest';
import type { HerdrCommand } from '../../../src/L3_periphery/herdr/herdr-plugin-updates';
import {
  herdrAnnouncer,
  showNotice,
  startNotice,
  STOP_NOTICE,
} from '../../../src/L3_periphery/herdr/herdr-notifications';

describe('Herdr notifications', () => {
  it('says start OK with the address to open, with the real port', () => {
    expect(startNotice({ kind: 'started', message: 'm', port: 4001 })).toEqual({
      title: 'remote-sheep ✓',
      body: 'open http://localhost:4001',
    });
    expect(startNotice({ kind: 'already-running', message: 'm', port: 3998 })).toEqual({
      title: 'remote-sheep ✓',
      body: 'open http://localhost:3998',
    });
  });

  it('gives a failed start a short reason: the last line of the log, cut to fit', () => {
    const failed = startNotice({
      kind: 'failed',
      port: null,
      message:
        'remote-sheep could not start. /x/agent.log ends with:\nlistening...\n' +
        'port 3998 is already in use; is remote-sheep already running?\n\n',
    });
    expect(failed).toEqual({
      title: 'remote-sheep could not start',
      body: 'port 3998 is already in use; is remote-sheep already running?',
    });
    const long = startNotice({ kind: 'failed', port: null, message: 'x\n' + 'y'.repeat(300) });
    expect(long.body.length).toBeLessThanOrEqual(120);
    expect(long.body.endsWith('…')).toBe(true);
    expect(startNotice({ kind: 'not-ready', port: null, message: 'm' })).toEqual({
      title: 'remote-sheep could not start',
      body: 'it runs but does not listen yet; see remote-sheep status',
    });
  });

  it('shows the notice through Herdr with an argument array', async () => {
    const calls: string[][] = [];
    const run: HerdrCommand = (args) => {
      calls.push(args);
      return Promise.resolve({ code: 0, stdout: '', stderr: '', error: null });
    };
    await showNotice(run, { title: 'remote-sheep ✓', body: 'open http://localhost:3998' });
    await showNotice(run, STOP_NOTICE);
    expect(calls).toEqual([
      ['notification', 'show', 'remote-sheep ✓', '--body', 'open http://localhost:3998'],
      ['notification', 'show', 'remote-sheep stopped', '--body', 'start it again from Herdr'],
    ]);
  });

  it('announces the lifecycle through Herdr, waiting at most 3 s for each notification', async () => {
    const calls: { args: string[]; timeoutMs: number }[] = [];
    const run: HerdrCommand = (args, timeoutMs) => {
      calls.push({ args, timeoutMs });
      return Promise.resolve({ code: 0, stdout: '', stderr: '', error: null });
    };
    const announce = herdrAnnouncer(run);
    await announce.started({ kind: 'started', message: 'm', port: 3990 });
    await announce.stopped();
    expect(calls.map((call) => call.args.slice(0, 3))).toEqual([
      ['notification', 'show', 'remote-sheep ✓'],
      ['notification', 'show', 'remote-sheep stopped'],
    ]);
    for (const call of calls) expect(call.timeoutMs).toBeLessThanOrEqual(3000);
  });

  it('never fails when Herdr cannot show it', async () => {
    const failing: HerdrCommand = () =>
      Promise.resolve({ code: null, stdout: '', stderr: '', error: 'spawn herdr ENOENT' });
    const throwing: HerdrCommand = () => Promise.reject(new Error('boom'));
    await expect(showNotice(failing, STOP_NOTICE)).resolves.toBeUndefined();
    await expect(showNotice(throwing, STOP_NOTICE)).resolves.toBeUndefined();
  });
});
