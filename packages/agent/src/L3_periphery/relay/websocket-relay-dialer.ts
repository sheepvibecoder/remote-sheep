// The agent's socket to whichever relay is set now: one RelayTransport at a time, replaced when
// the owner sets another relay and stopped when they turn it off, while the LAN keeps serving.
// It also turns what went wrong into a short reason for the person. Only the URL is ever logged;
// the access code would be a credential in agent.log, and no reason ever repeats it.

import type { RelaySetting } from '@remote-sheep/protocol';
import type { Link } from '../../L1_domain/ports/link';
import type { RelayDialer, RelayOutcome } from '../../L1_domain/ports/relay';
import { type RelayProblem, RelayTransport } from './relay-transport';

export interface WebSocketRelayDialerOptions {
  /** The agent's room: the id of its public key. */
  room: string;
  /** Where each phone that arrives through the relay goes: the secure channel. */
  accept: (link: Link) => void;
  log?: (message: string) => void;
}

export function describeRelayProblem(problem: RelayProblem): string {
  switch (problem.kind) {
    case 'refused':
      return (
        "The relay refused the access code: it is wrong, withdrawn, or this computer's room " +
        'belongs to another code. Set the relay again with the right code.'
      );
    case 'status':
      return (
        'The relay answered HTTP ' +
        String(problem.status) +
        ' instead of connecting. The agent keeps trying.'
      );
    case 'unreachable':
      return 'Cannot reach the relay (' + problem.message + '). The agent keeps trying.';
  }
}

export class WebSocketRelayDialer implements RelayDialer {
  private transport: RelayTransport | null = null;
  private open = false;
  private trouble: string | null = null;
  /** Whoever waits for the first outcome of the current dial. */
  private waiters: (() => void)[] = [];

  constructor(private readonly options: WebSocketRelayDialerOptions) {}

  async dial(setting: RelaySetting): Promise<void> {
    await this.hangUp();
    const log = this.options.log;
    const transport: RelayTransport = new RelayTransport({
      url: setting.url,
      code: setting.code,
      room: this.options.room,
      ...(log ? { log } : {}),
      onState: (state) => {
        // A transport that was replaced may still report; only the current one counts.
        if (this.transport !== transport) return;
        this.open = state === 'connected';
        if (this.open) this.trouble = null;
        log?.('relay ' + state + ' (' + setting.url + ')');
        if (this.open) this.wake();
      },
      onProblem: (problem) => {
        if (this.transport !== transport) return;
        this.trouble = describeRelayProblem(problem);
        this.wake();
      },
    });
    this.transport = transport;
    await transport.start(this.options.accept);
  }

  settled(withinMs: number): Promise<RelayOutcome> {
    const outcome = (): RelayOutcome => ({ connected: this.open, problem: this.trouble });
    if (!this.transport || this.open || this.trouble !== null) return Promise.resolve(outcome());
    return new Promise((resolve) => {
      const done = () => {
        clearTimeout(timer);
        this.waiters = this.waiters.filter((waiter) => waiter !== done);
        resolve(outcome());
      };
      const timer = setTimeout(done, withinMs);
      this.waiters.push(done);
    });
  }

  async hangUp(): Promise<void> {
    const transport = this.transport;
    this.transport = null;
    this.open = false;
    this.trouble = null;
    this.wake();
    await transport?.stop();
  }

  connected(): boolean {
    return this.open;
  }

  problem(): string | null {
    return this.trouble;
  }

  private wake(): void {
    for (const waiter of [...this.waiters]) waiter();
  }
}
