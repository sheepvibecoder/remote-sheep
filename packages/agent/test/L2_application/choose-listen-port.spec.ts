import { describe, expect, it } from 'vitest';
import { chooseListenPort } from '../../src/L2_application/choose-listen-port';
import type { PortProbe } from '../../src/L1_domain/ports/port-probe';
import type { SavedPort } from '../../src/L1_domain/ports/saved-port';

class FakeSavedPort implements SavedPort {
  readonly saves: number[] = [];
  constructor(public port: number | null = null) {}

  load() {
    return Promise.resolve(this.port);
  }

  save(port: number) {
    this.saves.push(port);
    this.port = port;
    return Promise.resolve();
  }
}

class FakeProbe implements PortProbe {
  readonly asked: number[] = [];
  constructor(private readonly busy: ReadonlySet<number> = new Set()) {}

  isFree(port: number) {
    this.asked.push(port);
    return Promise.resolve(!this.busy.has(port));
  }
}

describe('chooseListenPort', () => {
  it('lets the PORT variable win over a saved port, probing and saving nothing', async () => {
    const saved = new FakeSavedPort(4005);
    const probe = new FakeProbe();
    const chosen = await chooseListenPort({ variable: 4100, saved, probe });
    expect(chosen).toEqual({ port: 4100, source: 'variable' });
    expect(probe.asked).toEqual([]);
    expect(saved.saves).toEqual([]);
  });

  it('uses the saved port without probing, so the address stays the same', async () => {
    const saved = new FakeSavedPort(4005);
    const probe = new FakeProbe(new Set([4005]));
    const chosen = await chooseListenPort({ variable: null, saved, probe });
    expect(chosen).toEqual({ port: 4005, source: 'saved' });
    expect(probe.asked).toEqual([]);
  });

  it('picks 3999 on a first start and saves it', async () => {
    const saved = new FakeSavedPort();
    const chosen = await chooseListenPort({ variable: null, saved, probe: new FakeProbe() });
    expect(chosen).toEqual({ port: 3999, source: 'picked' });
    expect(saved.saves).toEqual([3999]);
  });

  it('skips busy ports and saves the first free one', async () => {
    const saved = new FakeSavedPort();
    const probe = new FakeProbe(new Set([3999, 4000]));
    const chosen = await chooseListenPort({ variable: null, saved, probe });
    expect(chosen).toEqual({ port: 4001, source: 'picked' });
    expect(probe.asked).toEqual([3999, 4000, 4001]);
    expect(saved.saves).toEqual([4001]);
  });

  it('says how to choose one when every candidate is busy', async () => {
    const saved = new FakeSavedPort();
    const probe = new FakeProbe(new Set([5000, 5001]));
    await expect(
      chooseListenPort({ variable: null, saved, probe, candidates: [5000, 5001] }),
    ).rejects.toThrow('no free port from 5000 to 5001; choose one with `remote-sheep port <n>`');
    expect(saved.saves).toEqual([]);
  });
});
