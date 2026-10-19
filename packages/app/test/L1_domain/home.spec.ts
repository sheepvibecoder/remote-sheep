import { describe, expect, it } from 'vitest';
import type { Session } from '@remote-sheep/protocol';
import {
  agentLabel,
  byAttention,
  groupSpaces,
  initials,
  matches,
  nextToAnswer,
  pageTitle,
  ringOf,
  rowTime,
  sessionBadge,
  sessionRow,
  spaceRow,
} from '../../src/L1_domain/home';

function session(
  title: string,
  project: string,
  status: Session['status'] = 'idle',
  space = 'w1',
): Session {
  return {
    target: title,
    kind: 'agent',
    title,
    status,
    cwd: 'C:\\work\\' + project,
    project,
    space,
  };
}

describe('initials', () => {
  it('takes the first letter of the first two words, upper-cased', () => {
    expect(initials('odyssey-docker context')).toBe('OC');
    expect(initials('Perfil desktop mockup')).toBe('PD');
  });

  it('takes two letters from a single word and a placeholder from nothing', () => {
    expect(initials('odyssey')).toBe('OD');
    expect(initials('  ')).toBe('?');
  });
});

describe('matches', () => {
  it('finds a text that contains the query, ignoring case and accents', () => {
    expect(matches('Continuación del proyecto', 'continuacion')).toBe(true);
    expect(matches('remote-sheep', 'REMOTE')).toBe(true);
    expect(matches('remote-sheep', 'acme')).toBe(false);
  });

  it('lets everything through an empty query', () => {
    expect(matches('anything', '  ')).toBe(true);
  });
});

describe('groupSpaces', () => {
  it('lists every workspace with its sessions and the most urgent status', () => {
    const spaces = groupSpaces(
      [
        session('a', 'remote-sheep', 'idle', 'wF'),
        session('b', 'acme', 'done', 'w5'),
        session('c', 'remote-sheep', 'blocked', 'wF'),
        session('d', 'remote-sheep', 'working', 'wF'),
      ],
      [
        { id: 'w5', label: 'acme' },
        { id: 'w8', label: 'OdysseyRepo' },
        { id: 'wF', label: 'remote-sheep' },
      ],
    );
    expect(spaces).toEqual([
      { id: 'w5', label: 'acme', count: 1, status: 'done' },
      { id: 'w8', label: 'OdysseyRepo', count: 0, status: 'idle' },
      { id: 'wF', label: 'remote-sheep', count: 3, status: 'blocked' },
    ]);
  });

  it('names a workspace the list does not know yet after its first session', () => {
    expect(groupSpaces([session('a', 'remote-sheep', 'idle', 'wF')], [])).toEqual([
      { id: 'wF', label: 'remote-sheep', count: 1, status: 'idle' },
    ]);
  });
});

describe('ringOf', () => {
  it('rings a session by what it asks of the person', () => {
    expect(ringOf('blocked')).toBe('needs');
    expect(ringOf('working')).toBe('work');
    expect(ringOf('done')).toBe('done');
    expect(ringOf('idle')).toBe('idle');
  });

  it('rings a status Herdr cannot tell as idle, never as one that asks for a look', () => {
    expect(ringOf('unknown')).toBe('idle');
  });
});

describe('agentLabel', () => {
  it('names the agents people know by their product name', () => {
    expect(agentLabel('claude')).toBe('Claude Code');
    expect(agentLabel('codex')).toBe('Codex');
  });

  it('shows any other agent Herdr names as it names it, capitalised', () => {
    expect(agentLabel('gemini')).toBe('Gemini');
  });

  it('shows no tag when Herdr does not say', () => {
    expect(agentLabel(undefined)).toBeNull();
    expect(agentLabel('')).toBeNull();
  });
});

describe('byAttention', () => {
  it('puts the sessions waiting for an answer first, then the latest change first', () => {
    const at: Record<string, number> = { a: 10, b: 30, c: 20, d: 5 };
    const sorted = byAttention(
      [
        session('a', 'p', 'working'),
        session('b', 'p', 'done'),
        session('c', 'p', 'idle'),
        session('d', 'p', 'blocked'),
      ],
      (target) => at[target] ?? null,
    );
    expect(sorted.map((s) => s.target)).toEqual(['d', 'b', 'c', 'a']);
  });

  it('keeps the order Herdr gave for sessions with no change seen yet or at the same time', () => {
    const sorted = byAttention(
      [session('a', 'p'), session('b', 'p'), session('c', 'p')],
      (target) => (target === 'c' ? 1 : null),
    );
    expect(sorted.map((s) => s.target)).toEqual(['c', 'a', 'b']);
  });
});

describe('rowTime', () => {
  const now = new Date(2026, 9, 18, 15, 0).getTime();

  it('shows the hour of a change made today', () => {
    expect(rowTime(new Date(2026, 9, 18, 9, 5).getTime(), now)).toBe('09:05');
  });

  it('shows the day and month of an older change', () => {
    expect(rowTime(new Date(2026, 9, 12, 23, 0).getTime(), now)).toBe('12 Oct');
  });

  it('shows nothing when no change was seen', () => {
    expect(rowTime(null, now)).toBe('');
  });
});

describe('sessionBadge', () => {
  it('gives a chat header the avatar, ring and line its row shows', () => {
    expect(sessionBadge(session('Fix login', 'acme', 'blocked'))).toEqual({
      avatar: 'FL',
      ring: 'needs',
      shell: false,
      line: 'Needs your answer',
      asks: true,
    });
    const shell: Session = { ...session('zsh', 'acme', 'unknown'), kind: 'shell' };
    expect(sessionBadge(shell)).toEqual({
      avatar: '$',
      ring: 'idle',
      shell: true,
      line: 'Console',
      asks: false,
    });
  });
});

describe('sessionRow', () => {
  const now = new Date(2026, 9, 18, 15, 0).getTime();
  const seen = { changedAt: new Date(2026, 9, 18, 9, 5).getTime(), unread: 2, now };

  it('shows a session waiting for an answer as asking for one', () => {
    const row = sessionRow({ ...session('Fix login', 'acme', 'blocked'), agent: 'claude' }, seen);
    expect(row).toEqual({
      key: 'Fix login',
      avatar: 'FL',
      ring: 'needs',
      shell: false,
      title: 'Fix login',
      time: '09:05',
      line: 'Needs your answer',
      asks: true,
      place: 'acme',
      agent: 'Claude Code',
      unread: 2,
    });
  });

  it('says what a session that asks nothing is doing', () => {
    expect(sessionRow(session('a', 'p', 'working'), seen).line).toBe('Working…');
    expect(sessionRow(session('a', 'p', 'done'), seen).line).toBe('Done');
    expect(sessionRow(session('a', 'p', 'idle'), seen).line).toBe('Idle');
    expect(sessionRow(session('a', 'p', 'unknown'), seen).line).toBe('Status unknown');
    expect(sessionRow(session('a', 'p', 'working'), seen).asks).toBe(false);
  });

  it('draws a console as a terminal that never asks, whatever its status', () => {
    const row = sessionRow({ ...session('pwsh', 'acme', 'blocked'), kind: 'shell' }, seen);
    expect(row).toMatchObject({ avatar: '$', shell: true, line: 'Console', asks: false });
  });
});

describe('spaceRow', () => {
  it('shows a workspace with its session count, its most urgent ring and no time', () => {
    expect(spaceRow({ id: 'w5', label: 'acme', count: 1, status: 'working' })).toEqual({
      key: 'w5',
      avatar: 'AC',
      ring: 'work',
      shell: false,
      title: 'acme',
      time: '',
      line: '1 session',
      asks: false,
      place: '',
      agent: null,
      unread: 0,
    });
    expect(spaceRow({ id: 'w6', label: 'b', count: 3, status: 'idle' }).line).toBe('3 sessions');
  });
});

describe('pageTitle', () => {
  it('puts the count of unread sessions in front of the name, and nothing when there are none', () => {
    expect(pageTitle(0)).toBe('RemoteSheep');
    expect(pageTitle(3)).toBe('(3) RemoteSheep');
  });
});

describe('nextToAnswer', () => {
  const row = (key: string, asks: boolean) => ({ key, asks });
  const rows = [row('a', false), row('b', true), row('c', false), row('d', true)];

  it('picks the next session that needs an answer after the open one', () => {
    expect(nextToAnswer(rows, 'a')).toBe('b');
    expect(nextToAnswer(rows, 'b')).toBe('d');
  });

  it('wraps around to the first one, and skips the open one', () => {
    expect(nextToAnswer(rows, 'd')).toBe('b');
    expect(nextToAnswer([row('a', true), row('b', false)], 'a')).toBeNull();
  });

  it('starts from the top when nothing is open or the open one is not listed', () => {
    expect(nextToAnswer(rows, null)).toBe('b');
    expect(nextToAnswer(rows, 'gone')).toBe('b');
  });

  it('is null when nothing needs an answer', () => {
    expect(nextToAnswer([row('a', false)], 'a')).toBeNull();
    expect(nextToAnswer([], null)).toBeNull();
  });
});
