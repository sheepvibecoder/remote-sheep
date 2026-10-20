import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import pkg from '../../../package.json' with { type: 'json' };
import {
  type AgentProcesses,
  BackgroundAgent,
  nodeAgentProcesses,
} from '../../../src/L3_periphery/background/background-agent';

const LISTENING = 'remote-sheep 1.0.0 is listening on port 3996 over http\n';

/** Processes that live in a set; a launch writes what the real agent prints, or dies. */
class FakeProcesses implements AgentProcesses {
  readonly alive = new Set<number>();
  readonly launched: number[] = [];
  readonly stopped: number[] = [];
  nextPid = 100;
  output = LISTENING;
  diesAtStart = false;

  isAgent(pid: number) {
    return Promise.resolve(this.alive.has(pid));
  }

  launch(logFile: string) {
    const pid = this.nextPid++;
    this.launched.push(pid);
    writeFileSync(logFile, this.output);
    if (!this.diesAtStart) this.alive.add(pid);
    return Promise.resolve(pid);
  }

  stop(pid: number) {
    this.stopped.push(pid);
    this.alive.delete(pid);
    return Promise.resolve();
  }
}

function setup() {
  const dir = join(mkdtempSync(join(tmpdir(), 'sheep-background-')), 'state');
  const processes = new FakeProcesses();
  const agent = new BackgroundAgent({ dir, processes, readyTimeoutMs: 500, pollMs: 5 });
  const recordFile = join(dir, 'agent-process.json');
  const record = () => JSON.parse(readFileSync(recordFile, 'utf8')) as { pid: number };
  return { dir, processes, agent, recordFile, record };
}

describe('BackgroundAgent', () => {
  it('starts the agent and records its pid and log', async () => {
    const { dir, processes, agent, record } = setup();
    const result = await agent.start();
    expect(result.kind).toBe('started');
    expect(processes.launched).toEqual([100]);
    expect(record()).toEqual({ pid: 100, log: join(dir, 'agent.log') });
    expect(result.message).toContain('PID 100');
    expect(result.message).toContain('port 3996');
  });

  it('reports the port the agent says it listens on, whichever it picked', async () => {
    const { processes, agent } = setup();
    processes.output = 'remote-sheep 1.0.0 is listening on port 4007 over http\n';
    const started = await agent.start();
    expect(started.message).toContain('port 4007');
    expect(started.port).toBe(4007);
    expect((await agent.status()).message).toContain('port 4007');
    expect((await agent.status()).port).toBe(4007);
    expect((await agent.start()).port).toBe(4007);
  });

  it('gives no port for a start that failed or does not listen yet', async () => {
    const { processes, agent } = setup();
    processes.output = 'loading\n';
    expect(await agent.start()).toMatchObject({ kind: 'not-ready', port: null });
    const dead = setup();
    dead.processes.diesAtStart = true;
    dead.processes.output = 'boom\n';
    expect(await dead.agent.start()).toMatchObject({ kind: 'failed', port: null });
  });

  it('says the port is not known yet while the agent does not listen', async () => {
    const { processes, agent } = setup();
    processes.output = 'loading\n';
    await agent.start();
    expect((await agent.status()).message).toContain('port not known yet');
  });

  it('leaves a running agent alone, so a second start launches nothing', async () => {
    const { processes, agent, record } = setup();
    await agent.start();
    const again = await agent.start();
    expect(again.kind).toBe('already-running');
    expect(processes.launched).toEqual([100]);
    expect(record().pid).toBe(100);
  });

  it('replaces a stale pid file with the new agent', async () => {
    const { processes, agent, recordFile, record } = setup();
    await agent.start();
    processes.alive.clear(); // the PC rebooted, or the pid now names another program
    expect(existsSync(recordFile)).toBe(true);
    const result = await agent.start();
    expect(result.kind).toBe('started');
    expect(processes.launched).toEqual([100, 101]);
    expect(record().pid).toBe(101);
  });

  it('reports an agent that dies at start with the end of its log', async () => {
    const { processes, agent, recordFile } = setup();
    processes.diesAtStart = true;
    processes.output = 'listen EADDRINUSE: address already in use :::3996\n';
    const result = await agent.start();
    expect(result.kind).toBe('failed');
    expect(result.message).toContain('EADDRINUSE');
    expect(existsSync(recordFile)).toBe(false);
  });

  it('takes a damaged pid file for none and starts the agent', async () => {
    const { dir, processes, agent, recordFile, record } = setup();
    mkdirSync(dir, { recursive: true });
    for (const garbage of ['{not json', '[]', '{"pid":"x","log":"l"}']) {
      writeFileSync(recordFile, garbage);
      processes.alive.clear();
      expect((await agent.start()).kind).toBe('started');
      expect(record().pid).toBe(processes.launched.at(-1));
    }
    expect(processes.launched).toHaveLength(3);
  });

  it('says so when the agent is alive but not listening yet', async () => {
    const { processes, agent, record } = setup();
    processes.output = 'loading\n';
    const result = await agent.start();
    expect(result.kind).toBe('not-ready');
    expect(record().pid).toBe(100);
  });

  it('stops the agent and removes the pid file', async () => {
    const { processes, agent, recordFile } = setup();
    await agent.start();
    const result = await agent.stop();
    expect(result.kind).toBe('stopped');
    expect(processes.stopped).toEqual([100]);
    expect(existsSync(recordFile)).toBe(false);
  });

  it('restarts: stops the running agent, then starts a new one with a new pid', async () => {
    const { processes, agent, record } = setup();
    await agent.start();
    const result = await agent.restart();
    expect(processes.stopped).toEqual([100]);
    expect(processes.launched).toEqual([100, 101]);
    expect(result.kind).toBe('started');
    expect(record().pid).toBe(101);
  });

  it('announces each start, restart and stop once, with the outcome', async () => {
    const dir = join(mkdtempSync(join(tmpdir(), 'sheep-background-')), 'state');
    const said: string[] = [];
    const agent = new BackgroundAgent({
      dir,
      processes: new FakeProcesses(),
      readyTimeoutMs: 500,
      pollMs: 5,
      announce: {
        started: (result) => {
          said.push(result.kind + ' ' + String(result.port));
          return Promise.resolve();
        },
        stopped: () => {
          said.push('stopped');
          return Promise.resolve();
        },
      },
    });
    await agent.start();
    await agent.start();
    await agent.restart();
    await agent.stop();
    expect(said).toEqual(['started 3996', 'already-running 3996', 'started 3996', 'stopped']);
  });

  it('restarts an agent that was not running by starting it', async () => {
    const { processes, agent } = setup();
    const result = await agent.restart();
    expect(processes.stopped).toEqual([]);
    expect(result.kind).toBe('started');
  });

  it('never stops a program that took over a stale pid', async () => {
    const { processes, agent, recordFile } = setup();
    await agent.start();
    processes.alive.clear();
    const result = await agent.stop();
    expect(result.kind).toBe('not-running');
    expect(processes.stopped).toEqual([]);
    expect(existsSync(recordFile)).toBe(false);
  });

  it('reports running with pid, port and log, or stopped', async () => {
    const { dir, agent } = setup();
    expect((await agent.status()).kind).toBe('stopped');
    await agent.start();
    const status = await agent.status();
    expect(status.kind).toBe('running');
    expect(status.message).toContain('PID 100');
    expect(status.message).toContain('port 3996');
    expect(status.message).toContain(join(dir, 'agent.log'));
    await agent.stop();
    expect((await agent.status()).kind).toBe('stopped');
  });
});

describe('nodeAgentProcesses', () => {
  it('launches a script detached, recognises it by name and stops it', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'sheep-launch-'));
    const script = join(dir, 'remote-sheep.js');
    writeFileSync(script, 'console.log("ready"); setInterval(() => {}, 1000);');
    const processes = nodeAgentProcesses(script, dir);
    const pid = await processes.launch(join(dir, 'agent.log'));
    try {
      expect(await processes.isAgent(pid)).toBe(true);
    } finally {
      await processes.stop(pid);
    }
    expect(await processes.isAgent(pid)).toBe(false);
  }, 30_000);

  it('launches the agent in background mode, which keeps pairing links out of its log', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'sheep-launch-'));
    const script = join(dir, 'remote-sheep.js');
    writeFileSync(
      script,
      'console.log(JSON.stringify(process.argv.slice(2))); setInterval(() => {}, 1000);',
    );
    const processes = nodeAgentProcesses(script, dir);
    const log = join(dir, 'agent.log');
    const pid = await processes.launch(log);
    try {
      const deadline = Date.now() + 10_000;
      while (!readFileSync(log, 'utf8').includes(']') && Date.now() < deadline) {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      expect(readFileSync(log, 'utf8').trim()).toBe('["serve","--background"]');
    } finally {
      await processes.stop(pid);
    }
  }, 30_000);

  it('forces an agent that ignores SIGTERM, and says when even SIGKILL fails', async () => {
    const sent: string[] = [];
    let diesOnKill = true;
    const signals = {
      alive: () => !(diesOnKill && sent.includes('SIGKILL')),
      kill: (_pid: number, signal: NodeJS.Signals) => {
        sent.push(signal);
      },
    };
    const waits = { termMs: 20, killMs: 20 };
    const processes = nodeAgentProcesses(
      join(tmpdir(), 'remote-sheep.js'),
      tmpdir(),
      signals,
      waits,
    );
    await processes.stop(4242);
    expect(sent).toEqual(['SIGTERM', 'SIGKILL']);

    sent.length = 0;
    diesOnKill = false;
    await expect(processes.stop(4242)).rejects.toThrow('remote-sheep (PID 4242) did not stop');
    expect(sent).toEqual(['SIGTERM', 'SIGKILL']);
  });

  it('does not take another program for the agent', async () => {
    const processes = nodeAgentProcesses(join(tmpdir(), 'remote-sheep.js'), tmpdir());
    expect(await processes.isAgent(process.pid)).toBe(false);
  }, 30_000);
});

describe('herdr-plugin.toml', () => {
  const manifest = readFileSync(join(__dirname, '../../../../../herdr-plugin.toml'), 'utf8');

  it('carries the agent version', () => {
    expect(manifest).toContain('\nversion = "' + pkg.version + '"\n');
  });

  it('starts the agent at Herdr start and offers start, stop and status', () => {
    expect(manifest).toMatch(/\[\[startup\]\]\ncommand = \[.*"start"\]/);
    for (const action of ['start', 'stop', 'status']) {
      expect(manifest).toMatch(
        new RegExp('id = "' + action + '"\\n(?:.*\\n)*?command = \\[.*"' + action + '"\\]'),
      );
    }
  });

  it('offers a qr action that opens the qr pane, which runs `remote-sheep qr`', () => {
    expect(manifest).toMatch(
      /\[\[actions\]\]\nid = "qr"\ntitle = "Show pairing QR"\n(?:.*\n)*?command = \[.*"open-qr"\]/,
    );
    expect(manifest).toMatch(/\[\[panes\]\]\nid = "qr"\n(?:.*\n)*?command = \[.*"qr"\]/);
  });

  it('offers a relay action that opens the relay pane, which runs `remote-sheep relay change`', () => {
    expect(manifest).toMatch(
      /\[\[actions\]\]\nid = "relay"\ntitle = "Set the relay"\n(?:.*\n)*?command = \[.*"open-relay"\]/,
    );
    expect(manifest).toMatch(/\[\[panes\]\]\nid = "relay"\n(?:.*\n)*?command = \[.*"relay"\]/);
    const plugin = readFileSync(join(__dirname, '../../../../../herdr-plugin/plugin.mjs'), 'utf8');
    expect(plugin).toContain("['relay', ['relay', 'change']]");
    expect(plugin).toContain("['open-relay', 'relay']");
  });
});
