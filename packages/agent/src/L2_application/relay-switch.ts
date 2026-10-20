// The relay while the agent runs: dials the one it started with, and lets the owner set another
// or turn it off from the Herdr pane or a paired device, with no restart.
//
// A relay set by the REMOTE_SHEEP_RELAY variables stays exactly as it was before this switch
// existed: dialled at start and changed only where it is set, since the variables would win
// again at the next start anyway. A change is saved before it is dialled, so the next start
// matches what runs; changes run one at a time, so the last one asked is the one in use.

import {
  checkRelaySetting,
  type RelayChange,
  type RelayInfo,
  type RelaySetting,
} from '@remote-sheep/protocol';
import type { RelayDialer, RelayOrigin, RelayRequests, SavedRelay } from '../L1_domain/ports/relay';

export const RELAY_FIXED =
  'The relay is set by the REMOTE_SHEEP_RELAY variables on the computer; change it there.';

export interface RelaySwitchOptions {
  saved: SavedRelay;
  dialer: RelayDialer;
  /** The relay to dial at start: the variables', or the saved one; null for none. */
  initial: RelaySetting | null;
  /** True when `initial` comes from the variables. */
  fixed: boolean;
}

export class RelaySwitch implements RelayRequests, RelayOrigin {
  private current: RelaySetting | null;
  private queue: Promise<unknown> = Promise.resolve();
  private readonly listeners: (() => void)[] = [];

  constructor(private readonly options: RelaySwitchOptions) {
    this.current = options.initial;
  }

  async start(): Promise<void> {
    if (this.current) await this.options.dialer.dial(this.current);
  }

  /** Called after every change that took effect, for whatever follows the relay (push). */
  onChange(listener: () => void): void {
    this.listeners.push(listener);
  }

  /** The origin the QR code offers first; null while off. */
  origin(): string | null {
    return this.current?.url ?? null;
  }

  relay(): RelayInfo {
    return {
      on: this.current !== null,
      url: this.current?.url ?? null,
      connected: this.current !== null && this.options.dialer.connected(),
      fixed: this.options.fixed,
    };
  }

  changeRelay(change: RelayChange): Promise<RelayInfo> {
    const next = this.queue.then(() => this.apply(change));
    this.queue = next.catch(() => undefined);
    return next;
  }

  private async apply(change: RelayChange): Promise<RelayInfo> {
    const info = await this.applyOne(change);
    for (const listener of this.listeners) listener();
    return info;
  }

  private async applyOne(change: RelayChange): Promise<RelayInfo> {
    if (this.options.fixed) throw new Error(RELAY_FIXED);
    if ('off' in change) {
      await this.options.dialer.hangUp();
      this.current = null;
      await this.options.saved.forget();
      return this.relay();
    }
    const checked = checkRelaySetting(change.url, change.code);
    if (!checked.ok) throw new Error(checked.error);
    await this.options.saved.save(checked.setting);
    this.current = checked.setting;
    await this.options.dialer.dial(checked.setting);
    return this.relay();
  }
}
