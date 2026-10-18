import { describe, expect, it } from 'vitest';
import { acceptHandshake, generateKeyPair, startHandshake } from '../../src/index';

const text = (value: string) => new TextEncoder().encode(value);

function connect() {
  const started = startHandshake(generateKeyPair(), false);
  const agent = generateKeyPair();
  const accepted = acceptHandshake(agent, started.hello);
  return {
    phone: started.finish(accepted.welcome, agent.publicKey),
    agent: accepted.session,
  };
}

describe('sealed frames', () => {
  it('hides the plaintext and adds a 16-byte tag', () => {
    const { phone } = connect();
    const sealed = phone.seal(text('secret order'));
    expect(sealed).toHaveLength(text('secret order').length + 16);
    expect(new TextDecoder().decode(sealed)).not.toContain('secret');
  });

  it('seals the same plaintext differently each time, because the counter moves', () => {
    const { phone } = connect();
    expect(phone.seal(text('x'))).not.toEqual(phone.seal(text('x')));
  });

  it('carries an empty frame', () => {
    const { phone, agent } = connect();
    expect(agent.open(phone.seal(new Uint8Array(0)))).toEqual(new Uint8Array(0));
  });

  it('rejects a replayed frame', () => {
    const { phone, agent } = connect();
    const sealed = phone.seal(text('prompt'));
    agent.open(sealed);
    expect(() => agent.open(sealed)).toThrow();
  });

  it('rejects reordered frames', () => {
    const { phone, agent } = connect();
    const first = phone.seal(text('one'));
    const second = phone.seal(text('two'));
    expect(() => agent.open(second)).toThrow();
    expect(() => agent.open(first)).toThrow();
  });

  it('rejects an altered ciphertext byte and an altered tag byte', () => {
    for (const index of [0, -1]) {
      const { phone, agent } = connect();
      const sealed = phone.seal(text('rm -rf'));
      const at = index < 0 ? sealed.length + index : index;
      sealed[at] = (sealed[at] ?? 0) ^ 1;
      expect(() => agent.open(sealed)).toThrow();
    }
  });

  it('rejects a truncated frame, including one shorter than a tag', () => {
    const { phone, agent } = connect();
    expect(() => agent.open(phone.seal(text('hello')).subarray(0, -1))).toThrow();
    const other = connect();
    expect(() => other.agent.open(new Uint8Array(15))).toThrow();
  });

  it('rejects a frame sealed for the other direction', () => {
    const { phone, agent } = connect();
    expect(() => phone.open(phone.seal(text('loop')))).toThrow();
    expect(() => agent.open(agent.seal(text('loop')))).toThrow();
  });

  it('stays closed after a failure, so the connection cannot be resumed', () => {
    const { phone, agent } = connect();
    const good = phone.seal(text('a'));
    expect(() => agent.open(new Uint8Array(20))).toThrow();
    expect(() => agent.open(good)).toThrow();
  });
});
