// Watches the session list on one timer, for everyone who cares: the phones
// that are open, and a notifier that must hear about a finished session when
// none is. It knows nothing about phones.

import type { AgentStatus, Session } from '@remote-sheep/protocol';
import type { Multiplexer } from '../L1_domain/ports/multiplexer';
import type { Notifier } from '../L1_domain/ports/notifier';
import { hasSettled } from '../L1_domain/session-status';

export interface MonitorEvents {
  /** The list changed. */
  sessions(next: Session[]): void;
  /** Why Herdr cannot be listed, or null once it can again; only on change. */
  status(herdrError: string | null): void;
  /** A list arrived, changed or not. */
  refreshed(): void;
}

export interface MonitorOptions {
  multiplexer: Pick<Multiplexer, 'listSessions'>;
  intervalMs: number;
  events: MonitorEvents;
  notifier?: Pick<Notifier, 'notify'>;
  log?: (message: string) => void;
}

/** Process errors carry the whole stderr; a phone only needs the first line. */
function summary(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  return (message.split('\n')[0] ?? '').trim().slice(0, 200) || 'unknown error';
}

export class SessionMonitor {
  private sessions: Session[] = [];
  private json = '';
  private herdrError: string | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  /** A slow multiplexer must not pile up overlapping list calls. */
  private refreshing = false;

  constructor(private readonly options: MonitorOptions) {}

  /** Idempotent; the first list is asked for at once. */
  start(): void {
    if (this.timer) return;
    this.timer = setInterval(() => void this.refresh(), this.options.intervalMs);
    void this.refresh();
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  get running(): boolean {
    return this.timer !== null;
  }

  current(): Session[] {
    return this.sessions;
  }

  /** False until the first list arrived. */
  known(): boolean {
    return this.json !== '';
  }

  error(): string | null {
    return this.herdrError;
  }

  private async refresh(): Promise<void> {
    if (this.refreshing) return;
    this.refreshing = true;
    try {
      await this.list();
    } catch (err) {
      // Runs on a timer with nobody awaiting it, so a throw would end the process.
      this.options.log?.('refresh failed: ' + (err as Error).message);
    } finally {
      this.refreshing = false;
    }
  }

  private async list(): Promise<void> {
    let next: Session[];
    try {
      next = await this.options.multiplexer.listSessions();
    } catch (err) {
      this.options.log?.('listing sessions failed: ' + (err as Error).message);
      if (this.timer) this.setError(summary(err));
      return;
    }
    // Stopped while the multiplexer was answering.
    if (!this.timer) return;
    this.setError(null);

    const json = JSON.stringify(next);
    if (json !== this.json) {
      const before = new Map(this.sessions.map((s) => [s.target, s.status]));
      const first = this.json === '';
      this.sessions = next;
      this.json = json;
      if (!first) this.announce(before, next);
      this.options.events.sessions(next);
    }
    this.options.events.refreshed();
  }

  private announce(before: Map<string, AgentStatus>, next: Session[]): void {
    const notifier = this.options.notifier;
    if (!notifier) return;
    for (const session of next) {
      const from = before.get(session.target);
      if (!from || !hasSettled(from, session.status)) continue;
      // A bell that fails must not cost the open phones their list update.
      try {
        notifier.notify({ session, from, to: session.status });
      } catch (err) {
        this.options.log?.('notifying failed: ' + (err as Error).message);
      }
    }
  }

  private setError(herdrError: string | null): void {
    if (herdrError === this.herdrError) return;
    this.herdrError = herdrError;
    this.options.events.status(herdrError);
  }
}
