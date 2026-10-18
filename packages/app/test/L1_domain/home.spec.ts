import { describe, expect, it } from 'vitest';
import type { Session } from '@remote-sheep/protocol';
import { groupSpaces, initials, matches } from '../../src/L1_domain/home';

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
