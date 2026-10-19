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

// Herdr names agents by their command; people know some of them by their product name.
// Any other agent is shown as Herdr names it: the list never assumes one agent.
const AGENT_NAMES: Readonly<Record<string, string>> = { claude: 'Claude Code', codex: 'Codex' };

/** The tag naming the coding agent of a row, or null when Herdr does not say. */
export function agentLabel(agent: string | undefined): string | null {
  if (!agent) return null;
  return AGENT_NAMES[agent] ?? agent.charAt(0).toUpperCase() + agent.slice(1);
}

/**
 * The order of the list: a session waiting for an answer first, like an unread chat, then
 * the latest change first. `changedAt` is when the phone saw the status change, null when it
 * has seen none; ties keep the order Herdr gave, so rows do not jump between polls.
 */
export function byAttention(
  sessions: readonly Session[],
  changedAt: (target: string) => number | null,
): Session[] {
  const needs = (session: Session) => (session.status === 'blocked' ? 0 : 1);
  return sessions
    .map((session, index) => ({ session, index, at: changedAt(session.target) ?? -1 }))
    .sort((a, b) => needs(a.session) - needs(b.session) || b.at - a.at || a.index - b.index)
    .map(({ session }) => session);
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const twoDigits = (n: number) => String(n).padStart(2, '0');

/** The time on a row, as a messaging app shows it: the hour today, the date before. */
export function rowTime(at: number | null, now: number): string {
  if (at === null) return '';
  const then = new Date(at);
  if (then.toDateString() === new Date(now).toDateString()) {
    return twoDigits(then.getHours()) + ':' + twoDigits(then.getMinutes());
  }
  return String(then.getDate()) + ' ' + (MONTHS[then.getMonth()] ?? '');
}

/** What one row of the list shows: a session, a console or a workspace. */
export interface ListRow {
  key: string;
  avatar: string;
  ring: Ring;
  /** A console, drawn as a terminal rather than as an agent. */
  shell: boolean;
  title: string;
  /** The time of the last change seen, or empty. */
  time: string;
  line: string;
  /** The line asks the person for an answer, so it stands out. */
  asks: boolean;
  /** The folder of a session; empty for a workspace. */
  place: string;
  /** The coding agent's name, or null when Herdr does not say. */
  agent: string | null;
  /** Settles not looked at yet; 0 shows no count. */
  unread: number;
}

const STATUS_LINES: Record<AgentStatus, string> = {
  blocked: 'Needs your answer',
  working: 'Working…',
  done: 'Done',
  idle: 'Idle',
  unknown: 'Status unknown',
};

/** What the phone knows about a session beyond what Herdr says. */
export interface Seen {
  changedAt: number | null;
  unread: number;
  now: number;
}

export function sessionRow(session: Session, seen: Seen): ListRow {
  // A console has no agent to answer through: its prompts are typed in its terminal.
  const shell = session.kind === 'shell';
  const ring = ringOf(session.status);
  return {
    key: session.target,
    avatar: shell ? '$' : initials(session.title),
    ring,
    shell,
    title: session.title,
    time: rowTime(seen.changedAt, seen.now),
    line: shell ? 'Console' : STATUS_LINES[session.status],
    asks: !shell && ring === 'needs',
    place: session.project,
    agent: agentLabel(session.agent),
    unread: seen.unread,
  };
}

export function spaceRow(space: Space): ListRow {
  return {
    key: space.id,
    avatar: initials(space.label),
    ring: ringOf(space.status),
    shell: false,
    title: space.label,
    time: '',
    line: String(space.count) + (space.count === 1 ? ' session' : ' sessions'),
    asks: false,
    place: '',
    agent: null,
    unread: 0,
  };
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
