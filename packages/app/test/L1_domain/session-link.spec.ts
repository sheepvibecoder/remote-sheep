import { describe, expect, it } from 'vitest';
import { agentFromSearch, sessionFromSearch } from '../../src/L1_domain/session-link';

describe('sessionFromSearch', () => {
  it('reads the session a notification points at', () => {
    expect(sessionFromSearch('?session=w1-2')).toBe('w1-2');
  });

  it('decodes the target', () => {
    expect(sessionFromSearch('?session=a%3Ab')).toBe('a:b');
  });

  it('is null without a session', () => {
    expect(sessionFromSearch('')).toBeNull();
    expect(sessionFromSearch('?session=')).toBeNull();
    expect(sessionFromSearch('?other=1')).toBeNull();
  });
});

describe('agentFromSearch', () => {
  it('reads the computer a notification came from', () => {
    expect(agentFromSearch('?session=w1-2&agent=abc123')).toBe('abc123');
  });

  it('is null for a notification from an agent older than profiles', () => {
    expect(agentFromSearch('?session=w1-2')).toBeNull();
    expect(agentFromSearch('?agent=')).toBeNull();
  });
});
