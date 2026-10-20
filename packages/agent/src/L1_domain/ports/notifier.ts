import type { AgentStatus, Session } from '@remote-sheep/protocol';

/** A session that stopped working: it finished, or it waits for an answer. */
export interface SessionChange {
  session: Session;
  from: AgentStatus;
  to: AgentStatus;
}

/** Whoever must hear about it with no phone open: the bell of stage 4. */
export interface Notifier {
  notify(change: SessionChange): void;
  /** False while it cannot deliver anything; the hub then stops watching with no phone open. */
  listening(): boolean;
}
