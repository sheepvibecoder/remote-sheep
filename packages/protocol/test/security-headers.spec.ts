import { describe, expect, it } from 'vitest';
import { SECURITY_HEADERS } from '../src/index';

describe('SECURITY_HEADERS', () => {
  it('forbids framing, plugins and foreign scripts', () => {
    const csp = SECURITY_HEADERS['content-security-policy'] ?? '';
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).not.toMatch(/script-src[^;]*unsafe-inline/);
    expect(SECURITY_HEADERS['x-frame-options']).toBe('DENY');
  });

  it('keeps the microphone and camera the app uses', () => {
    const policy = SECURITY_HEADERS['permissions-policy'] ?? '';
    expect(policy).toContain('microphone=(self)');
    expect(policy).toContain('camera=(self)');
  });
});
