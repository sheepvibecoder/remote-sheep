import type { AgentStatus } from '@remote-sheep/protocol';

// A session that leaves `working` for one of these is worth ringing about.
const SETTLED: ReadonlySet<AgentStatus> = new Set(['done', 'blocked']);

/** True when a session stopped working: it finished, or it waits for an answer. */
export function hasSettled(from: AgentStatus | undefined, to: AgentStatus): boolean {
  return from === 'working' && SETTLED.has(to);
}
