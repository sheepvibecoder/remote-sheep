// Everything that talks to the Herdr CLI.

import { execFile } from 'node:child_process';
import { basename } from 'node:path';
import type {
  AgentKind,
  AgentStatus,
  Session,
  SessionKind,
  Workspace,
} from '@remote-sheep/protocol';
import type { Multiplexer } from '../../L1_domain/ports/multiplexer';

/** Runs herdr with these arguments and resolves with its stdout. */
export type HerdrRunner = (args: string[]) => Promise<string>;

/**
 * The herdr to run: HERDR when the user names one, else the binary Herdr hands its plugins
 * (HERDR_BIN_PATH, which reaches the Herdr that started the agent even when another one is
 * first on PATH), else herdr on PATH.
 */
export function herdrExecutable(
  env: Readonly<Record<string, string | undefined>>,
  platform: string,
): string {
  return env['HERDR'] || env['HERDR_BIN_PATH'] || (platform === 'win32' ? 'herdr.exe' : 'herdr');
}

// Arguments go straight to the executable, so prompt text never reaches a shell.
export function herdrRunner(executable: string): HerdrRunner {
  return (args) =>
    new Promise((resolve, reject) => {
      execFile(executable, args, { maxBuffer: 4 * 1024 * 1024 }, (err, stdout, stderr) => {
        if (err) {
          reject(new Error(stderr.trim() || err.message));
          return;
        }
        resolve(stdout);
      });
    });
}

const STATUSES: ReadonlySet<string> = new Set(['idle', 'working', 'blocked', 'done', 'unknown']);

interface HerdrPane {
  pane_id?: string;
  terminal_title_stripped?: string;
  agent_status?: string;
  cwd?: string;
  workspace_id?: string;
  /** The coding agent Herdr detected in the pane; absent for a plain shell. */
  agent?: string;
}

const ABSOLUTE_PATH = /^([a-zA-Z]:[\\/]|\/)/;

const lastSegment = (path: string) => basename(path.replace(/[\\/]+$/, '').replace(/\\/g, '/'));

function toSession(pane: HerdrPane, kind: SessionKind): Session {
  const target = pane.pane_id ?? '';
  const cwd = pane.cwd ?? '';
  const status = STATUSES.has(String(pane.agent_status))
    ? (pane.agent_status as AgentStatus)
    : 'unknown';
  // An idle shell is titled with the path of its executable; its last segment names it.
  const raw = pane.terminal_title_stripped || '';
  const title = kind === 'shell' && ABSOLUTE_PATH.test(raw) ? lastSegment(raw) : raw;
  return {
    target,
    kind,
    title: title || target,
    status,
    cwd,
    project: lastSegment(cwd),
    space: pane.workspace_id ?? '',
    ...(pane.agent ? { agent: pane.agent } : {}),
  };
}

export function parseAgentList(raw: string): Session[] {
  const parsed = JSON.parse(raw) as { result?: { agents?: HerdrPane[] } };
  return (parsed.result?.agents ?? []).map((a) => toSession(a, 'agent'));
}

/** Every pane Herdr knows, minus those running a coding agent: those are listed as agents. */
export function parseShellList(raw: string): Session[] {
  const parsed = JSON.parse(raw) as { result?: { panes?: HerdrPane[] } };
  return (parsed.result?.panes ?? []).flatMap((p) =>
    p.pane_id && !p.agent ? [toSession(p, 'shell')] : [],
  );
}

interface HerdrWorkspace {
  workspace_id?: string;
  label?: string;
}

export function parseWorkspaceList(raw: string): Workspace[] {
  const parsed = JSON.parse(raw) as { result?: { workspaces?: HerdrWorkspace[] } };
  return (parsed.result?.workspaces ?? []).flatMap((w) =>
    w.workspace_id ? [{ id: w.workspace_id, label: w.label || w.workspace_id }] : [],
  );
}

// A rule drawn across a wide terminal becomes several rows of dashes once the
// phone reflows it, so long runs of one ruler character are shortened.
const RULER = /([─-╿=_-])\1{19,}/g;

export function tidyTerminal(raw: string): string {
  return raw
    .split('\n')
    .map((line) => line.replace(/\s+$/, '').replace(RULER, (_run, char: string) => char.repeat(20)))
    .join('\n')
    .replace(/\n+$/, '');
}

const PID_TTL_MS = 15000;
// Below the phone's 30 s request timeout, so a slow start is reported, not lost.
const START_TIMEOUT_MS = 20000;
const TAIL_LINES = 80;

export class HerdrMultiplexer implements Multiplexer {
  private readonly pids = new Map<string, { at: number; pid: number | null }>();

  constructor(private readonly run: HerdrRunner) {}

  async listSessions(): Promise<Session[]> {
    return parseAgentList(await this.run(['agent', 'list']));
  }

  async listShells(): Promise<Session[]> {
    return parseShellList(await this.run(['pane', 'list']));
  }

  // The pid is how a pane is tied to the Claude session running inside it.
  async processId(target: string): Promise<number | null> {
    const cached = this.pids.get(target);
    if (cached && Date.now() - cached.at < PID_TTL_MS) return cached.pid;
    let pid: number | null;
    try {
      const parsed = JSON.parse(await this.run(['pane', 'process-info', '--pane', target])) as {
        result?: {
          process_info?: { foreground_processes?: { name?: string; pid?: number }[] };
        };
      };
      const running = parsed.result?.process_info?.foreground_processes ?? [];
      const claude = running.find((p) => /claude/i.test(p.name ?? '')) ?? running[0];
      pid = claude?.pid ?? null;
    } catch {
      pid = null;
    }
    this.pids.set(target, { at: Date.now(), pid });
    return pid;
  }

  // A shell is no Herdr agent, so the `agent` verbs refuse it; `pane` reaches any pane.
  async readTerminal(session: Session): Promise<string> {
    const raw = await this.run([
      session.kind === 'shell' ? 'pane' : 'agent',
      'read',
      session.target,
      '--source',
      'recent',
      '--lines',
      String(TAIL_LINES),
      '--format',
      'text',
    ]);
    return tidyTerminal(raw);
  }

  async sendPrompt(session: Session, text: string): Promise<void> {
    // `pane run` types the command and presses Enter, as `agent prompt` does for an agent.
    if (session.kind === 'shell') await this.run(['pane', 'run', session.target, text]);
    else await this.run(['agent', 'prompt', session.target, text]);
  }

  async sendKeys(session: Session, keys: string[]): Promise<void> {
    await this.run([
      session.kind === 'shell' ? 'pane' : 'agent',
      'send-keys',
      session.target,
      ...keys,
    ]);
  }

  async listSpaces(): Promise<Workspace[]> {
    return parseWorkspaceList(await this.run(['workspace', 'list']));
  }

  // A new tab rather than a split: on a phone-sized view of the layout, a split
  // would shrink a pane someone is already working in.
  async startSession(space: string, agent: AgentKind): Promise<string> {
    const pane = await this.newTab(space);
    // Herdr names every agent; the name only has to be unique.
    const name = 'sheep-' + Date.now().toString(36);
    try {
      await this.run([
        'agent',
        'start',
        name,
        '--kind',
        agent,
        '--pane',
        pane,
        '--timeout',
        String(START_TIMEOUT_MS),
      ]);
    } catch (error) {
      // The agent may start on a question, such as trusting the folder. The
      // session exists and the phone can answer it, so that is not a failure.
      if (!(error instanceof Error) || !error.message.includes('agent_not_ready')) throw error;
    }
    return pane;
  }

  // A new tab already runs the user's shell, so it only has to be created.
  startShell(space: string): Promise<string> {
    return this.newTab(space);
  }

  private async newTab(space: string): Promise<string> {
    const created = JSON.parse(
      await this.run(['tab', 'create', '--workspace', space, '--no-focus']),
    ) as { result?: { root_pane?: { pane_id?: string } } };
    const pane = created.result?.root_pane?.pane_id;
    if (!pane) throw new Error('Herdr created no pane in ' + space);
    return pane;
  }
}
