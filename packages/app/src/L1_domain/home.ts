// The rules of the home screen: what a row shows, what a search finds, how
// sessions gather into the Herdr workspaces they run in.

import type { AgentStatus, Session, Workspace } from '@remote-sheep/protocol';

/** A workspace and the sessions running in it, as the Spaces tab lists it. */
export interface Space {
  id: string;
  label: string;
  count: number;
  /** The status most worth a look among its sessions. */
  status: AgentStatus;
}

/** The ring around an avatar: what the session asks of the person, readable at a glance. */
export type Ring = 'needs' | 'work' | 'done' | 'idle';

const RINGS: Record<AgentStatus, Ring> = {
  blocked: 'needs',
  working: 'work',
  done: 'done',
  idle: 'idle',
  // A status Herdr cannot tell must not call for attention it may not need.
  unknown: 'idle',
};

export function ringOf(status: AgentStatus): Ring {
  return RINGS[status];
}

/** The letters on a row's avatar. */
export function initials(title: string): string {
  const words = title.split(/\s+/).filter(Boolean);
  const [first, second] = words;
  if (!first) return '?';
  const letters = second ? first.charAt(0) + second.charAt(0) : first.slice(0, 2);
  return letters.toUpperCase();
}

// Searches are typed on a phone keyboard, where accents are easy to skip.
const fold = (text: string) => text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

export function matches(text: string, query: string): boolean {
  const wanted = fold(query.trim());
  return !wanted || fold(text).includes(wanted);
}

// A session waiting for an answer matters more than one at work, and so on.
const URGENCY: readonly AgentStatus[] = ['blocked', 'working', 'done', 'idle', 'unknown'];

/**
 * Every workspace, empty ones included, since a new session can start there.
 * A session whose workspace the list does not hold yet (it was created after
 * the list was read) still gets a row, named after its project.
 */
export function groupSpaces(
  sessions: readonly Session[],
  workspaces: readonly Workspace[],
): Space[] {
  const spaces = new Map<string, Space>();
  for (const { id, label } of workspaces) {
    spaces.set(id, { id, label, count: 0, status: 'idle' });
  }
  for (const session of sessions) {
    const space = spaces.get(session.space);
    if (!space) {
      spaces.set(session.space, {
        id: session.space,
        label: session.project || session.space,
        count: 1,
        status: session.status,
      });
      continue;
    }
    const first = space.count === 0;
    space.count++;
    if (first || URGENCY.indexOf(session.status) < URGENCY.indexOf(space.status)) {
      space.status = session.status;
    }
  }
  return [...spaces.values()];
}
