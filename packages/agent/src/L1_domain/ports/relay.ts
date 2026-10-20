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

/** How a dial went: connected, refused or failed with a reason, or neither yet. */
export interface RelayOutcome {
  readonly connected: boolean;
  /** A reason for the person, never the access code; null while connected or still trying. */
  readonly problem: string | null;
}

/** The agent's one socket to a relay. Dialling replaces any earlier one and retries by itself. */
export interface RelayDialer {
  dial(setting: RelaySetting): Promise<void>;
  /** Waits for the first outcome of the last dial, or `withinMs`, whichever comes first. */
  settled(withinMs: number): Promise<RelayOutcome>;
  hangUp(): Promise<void>;
  connected(): boolean;
  /** The reason of the last failure, until the socket opens; null when none. */
  problem(): string | null;
}

/** What a paired device (through the hub) and this PC (through the control channel) may do. */
export interface RelayRequests {
  relay(): RelayInfo;
  /** Rejects with a message for the person when the change is refused. */
  changeRelay(change: RelayChange): Promise<RelayInfo>;
}
