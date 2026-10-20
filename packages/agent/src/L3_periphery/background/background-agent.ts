// The agent as a background process: `remote-sheep start`, `stop` and `status`.
//
// Herdr's startup hook is one-shot, not a supervisor, so the agent owns its own lifecycle: start
// launches it detached with no window and records its PID and log in its data folder;
// a second start finds that PID still running and leaves it alone, which makes start safe as
// both the startup hook and a hand-run action. A PID is trusted only while it still names a
// remote-sheep process, so a stale file never stops, or stands in for, another program. The
// port is read from what the agent prints once it listens: the agent picks it itself.

import { execFile, spawn } from 'node:child_process';
import {
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { basename, join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

/** The processes the background agent needs from the operating system. */
export interface AgentProcesses {
  /** Whether this PID is alive and is a remote-sheep agent, not a program that reused it. */
  isAgent(pid: number): Promise<boolean>;
  /** Starts the agent detached, its output going to the log file; resolves with its PID. */
  launch(logFile: string): Promise<number>;
  /** Asks the agent to stop, forces it if it does not, and resolves once it is gone. */
  stop(pid: number): Promise<void>;
}

export interface AgentProcessRecord {
  readonly pid: number;
  readonly log: string;
}

export interface StartResult {
  kind: 'started' | 'already-running' | 'not-ready' | 'failed';
  message: string;
}
export interface StopResult {
  kind: 'stopped' | 'not-running';
  message: string;
}
export interface StatusResult {
  kind: 'running' | 'stopped';
  message: string;
}

export interface BackgroundAgentOptions {
  /** The agent's data folder: the PID file and the log live next to its keys. */
  dir: string;
  processes: AgentProcesses;
  /** How long a start waits for the agent to say it listens. */
  readyTimeoutMs?: number;
  pollMs?: number;
}

/** What the agent prints once it listens (main.ts); the sign that a start worked. */
const LISTENING = ' is listening on port ';
const LISTENING_PORT = / is listening on port (\d+)/;
const LOG_TAIL_LINES = 15;

export class BackgroundAgent {
  private readonly recordFile: string;
  private readonly logFile: string;
  private readonly readyTimeoutMs: number;
  private readonly pollMs: number;

  constructor(private readonly options: BackgroundAgentOptions) {
    this.recordFile = join(options.dir, 'agent-process.json');
    this.logFile = join(options.dir, 'agent.log');
    this.readyTimeoutMs = options.readyTimeoutMs ?? 20_000;
    this.pollMs = options.pollMs ?? 250;
  }

  async start(): Promise<StartResult> {
    const running = await this.running();
    if (running) {
      return {
        kind: 'already-running',
        message: 'remote-sheep already runs: ' + this.describe(running),
      };
    }
    mkdirSync(this.options.dir, { recursive: true });
    rmSync(this.recordFile, { force: true });
    const pid = await this.options.processes.launch(this.logFile);
    const record = { pid, log: this.logFile };
    writeFileSync(this.recordFile, JSON.stringify(record));

    const deadline = Date.now() + this.readyTimeoutMs;
    for (;;) {
      if (this.log().includes(LISTENING)) {
        return { kind: 'started', message: 'remote-sheep started: ' + this.describe(record) };
      }
      if (!(await this.options.processes.isAgent(pid))) {
        rmSync(this.recordFile, { force: true });
        return {
          kind: 'failed',
          message: 'remote-sheep could not start. ' + this.logFile + ' ends with:\n' + this.tail(),
        };
      }
      if (Date.now() >= deadline) {
        return {
          kind: 'not-ready',
          message: 'remote-sheep runs but does not listen yet: ' + this.describe(record),
        };
      }
      await sleep(this.pollMs);
    }
  }

  async stop(): Promise<StopResult> {
    const running = await this.running();
    // A stale file goes either way; its PID may name another program now, which stays.
    rmSync(this.recordFile, { force: true });
    if (!running) return { kind: 'not-running', message: 'remote-sheep was not running.' };
    await this.options.processes.stop(running.pid);
    return { kind: 'stopped', message: 'remote-sheep stopped (PID ' + String(running.pid) + ').' };
  }

  async status(): Promise<StatusResult> {
    const running = await this.running();
    return running
      ? { kind: 'running', message: 'remote-sheep is running: ' + this.describe(running) }
      : { kind: 'stopped', message: 'remote-sheep is stopped. Log: ' + this.logFile };
  }

  /** The recorded agent while it still runs; null when there is none or the file is stale. */
  private async running(): Promise<AgentProcessRecord | null> {
    const record = this.record();
    return record && (await this.options.processes.isAgent(record.pid)) ? record : null;
  }

  private record(): AgentProcessRecord | null {
    if (!existsSync(this.recordFile)) return null;
    try {
      const value: unknown = JSON.parse(readFileSync(this.recordFile, 'utf8'));
      if (typeof value !== 'object' || value === null) return null;
      const { pid, log } = value as Record<string, unknown>;
      return Number.isInteger(pid) && typeof log === 'string' ? { pid: pid as number, log } : null;
    } catch {
      // A damaged file is as good as none: the next start writes a new one.
      return null;
    }
  }

  private describe(record: AgentProcessRecord): string {
    const port = LISTENING_PORT.exec(this.log())?.[1];
    return (
      'PID ' +
      String(record.pid) +
      ', ' +
      (port ? 'port ' + port : 'port not known yet') +
      ', log ' +
      record.log +
      '.'
    );
  }

  private log(): string {
    return existsSync(this.logFile) ? readFileSync(this.logFile, 'utf8') : '';
  }

  private tail(): string {
    return this.log().trimEnd().split('\n').slice(-LOG_TAIL_LINES).join('\n') || '(empty log)';
  }
}

/** Whether a PID is alive; EPERM means it is, under another user. */
function alive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    return (err as NodeJS.ErrnoException).code === 'EPERM';
  }
}

function commandLine(pid: number): Promise<string> {
  const [file, args] =
    process.platform === 'win32'
      ? [
          'powershell',
          [
            '-NoProfile',
            '-NonInteractive',
            '-Command',
            '(Get-CimInstance Win32_Process -Filter "ProcessId=' + String(pid) + '").CommandLine',
          ],
        ]
      : ['ps', ['-p', String(pid), '-o', 'args=']];
  return new Promise((resolve) => {
    execFile(file, args, { windowsHide: true, timeout: 10_000 }, (err, stdout) => {
      resolve(err ? '' : stdout);
    });
  });
}

/** How a process is checked and signalled; the real one is `process.kill`. */
export interface ProcessSignals {
  alive(pid: number): boolean;
  kill(pid: number, signal: NodeJS.Signals): void;
}

/** How long stop waits after SIGTERM, then after SIGKILL. */
export interface StopWaits {
  termMs: number;
  killMs: number;
}

const SYSTEM_SIGNALS: ProcessSignals = {
  alive,
  kill: (pid, signal) => process.kill(pid, signal),
};

async function waitUntilGone(signals: ProcessSignals, pid: number, ms: number): Promise<boolean> {
  const deadline = Date.now() + ms;
  while (signals.alive(pid)) {
    if (Date.now() >= deadline) return false;
    await sleep(100);
  }
  return true;
}

/**
 * Real processes: the agent is this Node running `script` (the built remote-sheep.js), started
 * in `cwd` and recognised by the script's file name on its command line.
 */
export function nodeAgentProcesses(
  script: string,
  cwd: string,
  signals: ProcessSignals = SYSTEM_SIGNALS,
  waits: StopWaits = { termMs: 5000, killMs: 2000 },
): AgentProcesses {
  const name = basename(script);
  return {
    async isAgent(pid) {
      return signals.alive(pid) && (await commandLine(pid)).includes(name);
    },

    launch(logFile) {
      const out = openSync(logFile, 'w');
      try {
        // detached: its own process group (Unix) or no console (Windows), so it outlives the
        // command that started it; no stdin, so it never waits for Enter.
        const child = spawn(process.execPath, [script], {
          cwd,
          detached: true,
          windowsHide: true,
          stdio: ['ignore', out, out],
          env: process.env,
        });
        child.unref();
        return new Promise((resolve, reject) => {
          child.once('error', reject);
          child.once('spawn', () => {
            if (child.pid === undefined) reject(new Error('the agent started with no PID'));
            else resolve(child.pid);
          });
        });
      } finally {
        closeSync(out);
      }
    },

    async stop(pid) {
      // On Windows SIGTERM already ends the process; on Unix the agent closes its sockets first.
      if (!signals.alive(pid)) return;
      signals.kill(pid, 'SIGTERM');
      if (await waitUntilGone(signals, pid, waits.termMs)) return;
      signals.kill(pid, 'SIGKILL');
      if (!(await waitUntilGone(signals, pid, waits.killMs))) {
        throw new Error('remote-sheep (PID ' + String(pid) + ') did not stop');
      }
    },
  };
}
