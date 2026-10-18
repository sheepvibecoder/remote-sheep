import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Session } from '@remote-sheep/protocol';
import { SessionMonitor } from '../../src/L2_application/session-monitor';
import type { SessionChange } from '../../src/L1_domain/ports/notifier';

const LIST_MS = 2000;

function session(target: string, status: Session['status'] = 'idle'): Session {
  return {
    target,
    kind: 'agent',
    title: target,
    status,
    cwd: 'C:\\work\\' + target,
    project: target,
    space: 'w1',
  };
}

class FakeList {
  sessions: Session[] = [session('p1')];
  failure: Error | null = null;
  calls = 0;
  delayMs = 0;
  async listSessions() {
    this.calls++;
    if (this.delayMs) await new Promise((r) => setTimeout(r, this.delayMs));
    if (this.failure) throw this.failure;
    return this.sessions.map((s) => ({ ...s }));
  }
}

describe('SessionMonitor', () => {
  let list: FakeList;
  let lists: Session[][];
  let statuses: (string | null)[];
  let changes: SessionChange[];
  let monitor: SessionMonitor;

  beforeEach(() => {
    vi.useFakeTimers();
    list = new FakeList();
    lists = [];
    statuses = [];
    changes = [];
    monitor = new SessionMonitor({
      multiplexer: list,
      intervalMs: LIST_MS,
      events: {
        sessions: (next) => lists.push(next),
        status: (herdrError) => statuses.push(herdrError),
        refreshed: () => {},
      },
      notifier: { notify: (change) => changes.push(change) },
    });
  });

  afterEach(() => {
    monitor.stop();
    vi.useRealTimers();
  });

  it('reports the list at once and then only when it changes', async () => {
    monitor.start();
    await vi.advanceTimersByTimeAsync(LIST_MS * 2);
    expect(lists).toHaveLength(1);
    list.sessions = [session('p1'), session('p2')];
    await vi.advanceTimersByTimeAsync(LIST_MS);
    expect(lists).toHaveLength(2);
    expect(monitor.current().map((s) => s.target)).toEqual(['p1', 'p2']);
  });

  it('reports when Herdr starts failing and when it comes back, once each', async () => {
    monitor.start();
    await vi.advanceTimersByTimeAsync(0);
    list.failure = new Error('spawn herdr.exe ENOENT\nmore detail');
    await vi.advanceTimersByTimeAsync(LIST_MS * 3);
    expect(statuses).toEqual(['spawn herdr.exe ENOENT']);
    expect(monitor.error()).toBe('spawn herdr.exe ENOENT');

    list.failure = null;
    await vi.advanceTimersByTimeAsync(LIST_MS * 2);
    expect(statuses).toEqual(['spawn herdr.exe ENOENT', null]);
    expect(monitor.error()).toBeNull();
  });

  it('tells the notifier when a session finishes or needs an answer', async () => {
    list.sessions = [session('p1', 'working'), session('p2', 'working'), session('p3', 'idle')];
    monitor.start();
    await vi.advanceTimersByTimeAsync(0);
    expect(changes).toEqual([]);

    list.sessions = [session('p1', 'done'), session('p2', 'blocked'), session('p3', 'done')];
    await vi.advanceTimersByTimeAsync(LIST_MS);
    expect(changes).toEqual([
      { session: session('p1', 'done'), from: 'working', to: 'done' },
      { session: session('p2', 'blocked'), from: 'working', to: 'blocked' },
    ]);
  });

  it('still reports the list when the notifier throws', async () => {
    const failing = new SessionMonitor({
      multiplexer: list,
      intervalMs: LIST_MS,
      events: { sessions: (next) => lists.push(next), status: () => {}, refreshed: () => {} },
      notifier: {
        notify: () => {
          throw new Error('push service down');
        },
      },
    });
    list.sessions = [session('p1', 'working')];
    failing.start();
    await vi.advanceTimersByTimeAsync(0);
    list.sessions = [session('p1', 'done')];
    await vi.advanceTimersByTimeAsync(LIST_MS);
    failing.stop();
    expect(lists.at(-1)?.[0]?.status).toBe('done');
  });

  it('does not stack list calls behind a slow multiplexer', async () => {
    list.delayMs = LIST_MS * 3;
    monitor.start();
    await vi.advanceTimersByTimeAsync(LIST_MS * 2);
    expect(list.calls).toBe(1);
  });

  it('stops asking once stopped', async () => {
    monitor.start();
    await vi.advanceTimersByTimeAsync(0);
    monitor.stop();
    const calls = list.calls;
    await vi.advanceTimersByTimeAsync(LIST_MS * 5);
    expect(list.calls).toBe(calls);
  });
});
