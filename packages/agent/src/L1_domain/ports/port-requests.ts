import type { PortState } from '@remote-sheep/protocol';

/** What a paired device (through the hub) may ask about the port the agent listens on. */
export interface PortRequests {
  portState(): Promise<PortState>;
  /**
   * Saves a port, or `auto` to pick a free one at the next start, and restarts the agent on it.
   * Rejects with a message for the person when the change is refused.
   */
  changePort(set: number | 'auto'): Promise<PortState>;
}
