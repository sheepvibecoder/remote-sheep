import { describe, expect, it } from 'vitest';
import { addressOnPort, isThisPcHost } from '../../src/L1_domain/this-pc';

describe('this PC', () => {
  it('knows a page served from loopback by name or address, and nothing else', () => {
    expect(isThisPcHost('localhost')).toBe(true);
    expect(isThisPcHost('127.0.0.1')).toBe(true);
    for (const host of ['192.168.1.20', 'my-relay.workers.dev', 'localhost.evil.example', '']) {
      expect(isThisPcHost(host)).toBe(false);
    }
  });

  it('names the same page on another port', () => {
    expect(addressOnPort({ protocol: 'http:', hostname: 'localhost' }, 4100)).toBe(
      'http://localhost:4100/',
    );
  });
});
