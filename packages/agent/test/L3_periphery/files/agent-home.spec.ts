import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { agentHome } from '../../../src/L3_periphery/files/agent-home';

const user = join('home', 'ana');

describe('agentHome', () => {
  it('keeps the data in ~/.remote-sheep when started by hand', () => {
    expect(agentHome({}, user)).toBe(join(user, '.remote-sheep'));
    expect(agentHome({ REMOTE_SHEEP_HOME: '', HERDR_PLUGIN_STATE_DIR: '' }, user)).toBe(
      join(user, '.remote-sheep'),
    );
  });

  it('keeps the data in the state folder Herdr gives the plugin', () => {
    expect(agentHome({ HERDR_PLUGIN_STATE_DIR: join('state', 'sheep') }, user)).toBe(
      join('state', 'sheep'),
    );
  });

  it('lets REMOTE_SHEEP_HOME win over the plugin state folder', () => {
    expect(
      agentHome(
        { REMOTE_SHEEP_HOME: 'scratch', HERDR_PLUGIN_STATE_DIR: join('state', 'sheep') },
        user,
      ),
    ).toBe('scratch');
  });
});
