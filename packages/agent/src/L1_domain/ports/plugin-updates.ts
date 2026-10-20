import type { UpdateState } from '@remote-sheep/protocol';

/** What an update of the plugin did: installed a new build, or found nothing new. */
export type PluginUpdate = 'updated' | 'current';

/** The plugin this agent was installed as, which can fetch and build a newer version of itself. */
export interface PluginUpdates {
  /** Fetches and builds the newest version; rejects with a message for the person on failure. */
  update(): Promise<PluginUpdate>;
  /** Starts the newest build in place of this agent, with the same data; this process then ends. */
  restart(): Promise<void>;
}

/** What a paired device (through the hub) may ask about the agent's own update. */
export interface UpdateRequests {
  updateState(): UpdateState;
  /** Rejects with a message for the person when the update is refused or fails. */
  runUpdate(): Promise<UpdateState>;
}
