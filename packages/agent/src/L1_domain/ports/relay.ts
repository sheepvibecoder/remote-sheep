import type { RelayChange, RelayInfo, RelaySetting } from '@remote-sheep/protocol';

/** The relay in use now, read each time: it can be set or turned off while the agent runs. */
export interface RelayOrigin {
  /** Its https origin; null while there is none. */
  origin(): string | null;
}

/** Where the relay setting is kept, so the next start uses it. */
export interface SavedRelay {
  save(setting: RelaySetting): Promise<void>;
  forget(): Promise<void>;
}

/** The agent's one socket to a relay. Dialling replaces any earlier one and retries by itself. */
export interface RelayDialer {
  dial(setting: RelaySetting): Promise<void>;
  hangUp(): Promise<void>;
  connected(): boolean;
}

/** What a paired device (through the hub) and this PC (through the control channel) may do. */
export interface RelayRequests {
  relay(): RelayInfo;
  /** Rejects with a message for the person when the change is refused. */
  changeRelay(change: RelayChange): Promise<RelayInfo>;
}
