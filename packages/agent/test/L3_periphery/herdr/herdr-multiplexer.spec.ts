import { describe, expect, it } from 'vitest';
import type { Session } from '@remote-sheep/protocol';
import {
  HerdrMultiplexer,
  parseAgentList,
  parseShellList,
  parseWorkspaceList,
  tidyTerminal,
} from '../../../src/L3_periphery/herdr/herdr-multiplexer';

describe('parseAgentList', () => {
  it('maps Herdr agents to sessions', () => {
    const raw = JSON.stringify({
      result: {
        agents: [
          {
            pane_id: 'w1:p2',
            terminal_title_stripped: 'fix login',
            agent_status: 'blocked',
            workspace_id: 'w5',
            cwd: 'C:\\work\\app\\',
            agent: 'codex',
          },
          { pane_id: 'w1:p3', agent_status: 'mystery', cwd: '' },
        ],
      },
    });
    expect(parseAgentList(raw)).toEqual([
      {
        target: 'w1:p2',
        kind: 'agent',
        title: 'fix login',
        status: 'blocked',
        cwd: 'C:\\work\\app\\',
        project: 'app',
        space: 'w5',
        agent: 'codex',
      },
      {
        target: 'w1:p3',
        kind: 'agent',
        title: 'w1:p3',
        status: 'unknown',
        cwd: '',
        project: '',
        space: '',
      },
    ]);
  });

  it('returns no sessions when Herdr reports none', () => {
    expect(parseAgentList('{"result":{}}')).toEqual([]);
  });
});

describe('parseShellList', () => {
  // Trimmed from a real `herdr pane list`: agent panes carry `agent`, shells do not.
  it('keeps only the panes with no coding agent, named after their shell', () => {
    const raw = JSON.stringify({
      result: {
        panes: [
          {
            agent_status: 'unknown',
            cwd: 'C:\\work\\acme',
            pane_id: 'w5:pC',
            terminal_title_stripped:
              'C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\powershell.exe',
            workspace_id: 'w5',
          },
          { agent: 'claude', agent_status: 'idle', pane_id: 'w5:p2F', workspace_id: 'w5' },
          { pane_id: 'w5:pG', terminal_title_stripped: 'npm run dev', workspace_id: 'w5' },
          { cwd: '/home/me', pane_id: 'w6:p1' },
          { terminal_title_stripped: 'no pane id' },
        ],
      },
    });
    expect(parseShellList(raw)).toEqual([
      {
        target: 'w5:pC',
        kind: 'shell',
        title: 'powershell.exe',
        status: 'unknown',
        cwd: 'C:\\work\\acme',
        project: 'acme',
        space: 'w5',
      },
      {
        target: 'w5:pG',
        kind: 'shell',
        title: 'npm run dev',
        status: 'unknown',
        cwd: '',
        project: '',
        space: 'w5',
      },
      {
        target: 'w6:p1',
        kind: 'shell',
        title: 'w6:p1',
        status: 'unknown',
        cwd: '/home/me',
        project: 'me',
        space: '',
      },
    ]);
  });

  it('returns no shells when Herdr reports no panes', () => {
    expect(parseShellList('{"result":{}}')).toEqual([]);
  });
});

describe('parseWorkspaceList', () => {
  // Trimmed from a real `herdr workspace list`.
  it('maps Herdr workspaces to their id and label', () => {
    const raw =
      '{"id":"cli:workspace:list","result":{"type":"workspace_list","workspaces":[' +
      '{"active_tab_id":"w5:t2C","agent_status":"idle","focused":false,"label":"acme",' +
      '"number":1,"pane_count":5,"tab_count":3,"workspace_id":"w5"},' +
      '{"label":"","workspace_id":"wA"},{"label":"lost"}]}}';
    expect(parseWorkspaceList(raw)).toEqual([
      { id: 'w5', label: 'acme' },
      { id: 'wA', label: 'wA' },
    ]);
  });
});

describe('tidyTerminal', () => {
  it('trims padding and shortens rules drawn across a wide terminal', () => {
    expect(tidyTerminal('abc   \n' + '─'.repeat(200) + '\n\n')).toBe('abc\n' + '─'.repeat(20));
  });
});

const pane = (target: string, kind: Session['kind']): Session => ({
  target,
  kind,
  title: target,
  status: 'idle',
  cwd: '',
  project: '',
  space: 'w1',
});

describe('HerdrMultiplexer', () => {
  it('passes prompt text as one argument, never through a shell', async () => {
    const calls: string[][] = [];
    const herdr = new HerdrMultiplexer(async (args) => {
      calls.push(args);
      return '';
    });
    await herdr.sendPrompt(pane('w1:p2', 'agent'), 'echo "hi" && rm -rf /');
    await herdr.sendKeys(pane('w1:p2', 'agent'), ['esc', 'enter']);
    await herdr.readTerminal(pane('w1:p2', 'agent'));
    expect(calls).toEqual([
      ['agent', 'prompt', 'w1:p2', 'echo "hi" && rm -rf /'],
      ['agent', 'send-keys', 'w1:p2', 'esc', 'enter'],
      ['agent', 'read', 'w1:p2', '--source', 'recent', '--lines', '80', '--format', 'text'],
    ]);
  });

  it('drives a shell with the pane verbs, the command still one argument', async () => {
    const calls: string[][] = [];
    const herdr = new HerdrMultiplexer(async (args) => {
      calls.push(args);
      return args[0] === 'pane' && args[1] === 'list' ? '{"result":{"panes":[]}}' : 'PS>   \n';
    });
    await herdr.sendPrompt(pane('w1:s1', 'shell'), 'git log; rm -rf /');
    await herdr.sendKeys(pane('w1:s1', 'shell'), ['ctrl+c']);
    expect(await herdr.readTerminal(pane('w1:s1', 'shell'))).toBe('PS>');
    expect(await herdr.listShells()).toEqual([]);
    expect(calls).toEqual([
      ['pane', 'run', 'w1:s1', 'git log; rm -rf /'],
      ['pane', 'send-keys', 'w1:s1', 'ctrl+c'],
      ['pane', 'read', 'w1:s1', '--source', 'recent', '--lines', '80', '--format', 'text'],
      ['pane', 'list'],
    ]);
  });

  it('opens a shell as a new tab of the workspace, with nothing started in it', async () => {
    const calls: string[][] = [];
    const herdr = new HerdrMultiplexer(async (args) => {
      calls.push(args);
      return '{"result":{"root_pane":{"pane_id":"w5:p9"}}}';
    });
    expect(await herdr.startShell('w5')).toBe('w5:p9');
    expect(calls).toEqual([['tab', 'create', '--workspace', 'w5', '--no-focus']]);
    const noPane = new HerdrMultiplexer(async () => '{"result":{}}');
    await expect(noPane.startShell('w5')).rejects.toThrow('Herdr created no pane in w5');
  });

  it('prefers the claude process when finding the pane pid', async () => {
    const herdr = new HerdrMultiplexer(async () =>
      JSON.stringify({
        result: {
          process_info: {
            foreground_processes: [
              { name: 'node.exe', pid: 1 },
              { name: 'claude.exe', pid: 2 },
            ],
          },
        },
      }),
    );
    expect(await herdr.processId('w1:p2')).toBe(2);
  });

  it('reports no pid when Herdr fails', async () => {
    const herdr = new HerdrMultiplexer(async () => {
      throw new Error('no such pane');
    });
    expect(await herdr.processId('w1:p9')).toBeNull();
  });

  it('starts Claude Code in a new tab of the workspace and answers its pane', async () => {
    const calls: string[][] = [];
    const herdr = new HerdrMultiplexer(async (args) => {
      calls.push(args);
      if (args[0] === 'tab') {
        return '{"result":{"tab":{"tab_id":"w5:t9"},"root_pane":{"pane_id":"w5:p9"}}}';
      }
      return '{"result":{}}';
    });
    expect(await herdr.startSession('w5')).toBe('w5:p9');
    expect(calls[0]).toEqual(['tab', 'create', '--workspace', 'w5', '--no-focus']);
    const [command, verb, name, ...rest] = calls[1] ?? [];
    expect([command, verb]).toEqual(['agent', 'start']);
    expect(name).toMatch(/^sheep-[a-z0-9]+$/);
    expect(rest).toEqual(['--kind', 'claude', '--pane', 'w5:p9', '--timeout', '20000']);
  });

  it('answers the pane of an agent that started blocked, so the phone can answer it', async () => {
    const herdr = new HerdrMultiplexer(async (args) => {
      if (args[0] === 'tab') return '{"result":{"root_pane":{"pane_id":"w5:p9"}}}';
      throw new Error('agent_not_ready: agent is blocked');
    });
    expect(await herdr.startSession('w5')).toBe('w5:p9');
  });

  it('fails when Herdr creates no pane or the agent does not start', async () => {
    const noPane = new HerdrMultiplexer(async () => '{"result":{}}');
    await expect(noPane.startSession('w5')).rejects.toThrow('Herdr created no pane');
    const broken = new HerdrMultiplexer(async (args) => {
      if (args[0] === 'tab') return '{"result":{"root_pane":{"pane_id":"w5:p9"}}}';
      throw new Error('claude: command not found');
    });
    await expect(broken.startSession('w5')).rejects.toThrow('claude: command not found');
  });
});
