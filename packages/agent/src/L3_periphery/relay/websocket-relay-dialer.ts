// The agent's socket to whichever relay is set now: one RelayTransport at a time, replaced when
// the owner sets another relay and stopped when they turn it off, while the LAN keeps serving.
// Only the URL is ever logged; the access code would be a credential in agent.log.

import type { RelaySetting } from '@remote-sheep/protocol';
import type { Link } from '../../L1_domain/ports/link';
import type { RelayDialer } from '../../L1_domain/ports/relay';
import { RelayTransport } from './relay-transport';

export interface WebSocketRelayDialerOptions {
  /** The agent's room: the id of its public key. */
  room: string;
  /** Where each phone that arrives through the relay goes: the secure channel. */
  accept: (link: Link) => void;
  log?: (message: string) => void;
}

export class WebSocketRelayDialer implements RelayDialer {
  private transport: RelayTransport | null = null;
  private open = false;

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
        log?.('relay ' + state + ' (' + setting.url + ')');
      },
    });
    this.transport = transport;
    await transport.start(this.options.accept);
  }

  async hangUp(): Promise<void> {
    const transport = this.transport;
    this.transport = null;
    this.open = false;
    await transport?.stop();
  }

  connected(): boolean {
    return this.open;
  }
}
