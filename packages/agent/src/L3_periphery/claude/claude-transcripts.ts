// Pane -> Claude session -> transcript.
//
// The multiplexer knows which process runs in a pane; Claude Code writes one
// index file per live process under ~/.claude/sessions that carries its
// session id. That id names the transcript, which is the only place the
// conversation exists as plain prose. The terminal cannot stand in for it:
// Herdr pads every line to the terminal width and draws rules hundreds of
// characters wide.

import {
  closeSync,
  existsSync,
  fstatSync,
  openSync,
  readdirSync,
  readFileSync,
  readSync,
  watch,
} from 'node:fs';
import { join } from 'node:path';
import type { ChatMessage, ImageResult, Role } from '@remote-sheep/protocol';
import type { Chat, Located, TranscriptSource } from '../../L1_domain/ports/transcript';

export interface ClaudeOptions {
  sessionsDir: string;
  projectsDir: string;
  /** How far back to read. One turn can carry huge tool results. */
  tailBytes: number;
  maxMessages: number;
}

// Wrappers the CLI injects into the transcript. Nobody typed them, so none of
// them belong in a chat bubble.
const ENVELOPES = [
  /<system-reminder>[\s\S]*?<\/system-reminder>/g,
  /<local-command-[a-z-]+>[\s\S]*?<\/local-command-[a-z-]+>/g,
  /<command-[a-z-]+>[\s\S]*?<\/command-[a-z-]+>/g,
  /<user-prompt-submit-hook>[\s\S]*?<\/user-prompt-submit-hook>/g,
  /<pasted_content[\s\S]*?<\/pasted_content>/g,
];

// When a session runs out of context the CLI replays a summary of it as a user
// turn. Nobody said it out loud, and it is thousands of words long.
const HANDOFF = 'This session is being continued from a previous conversation';

export function stripEnvelopes(raw: string): string {
  let text = raw;
  for (const pattern of ENVELOPES) text = text.replace(pattern, '');
  text = text.trim();
  if (text.startsWith(HANDOFF)) return '';
  // Anything still opening with a tag is machinery we did not recognise.
  return text.startsWith('<') ? '' : text;
}

/** Claude Code names a project folder after its cwd, every non-alphanumeric turned into a dash. */
export function projectDirName(cwd: string): string {
  return withoutTrailingSeparators(cwd).replace(/[^a-zA-Z0-9]/g, '-');
}

// A loop, not /[\\/]+$/: that regex rescans a run of separators from each of its positions.
function withoutTrailingSeparators(path: string): string {
  let end = path.length;
  while (end > 0 && (path[end - 1] === '/' || path[end - 1] === '\\')) end--;
  return path.slice(0, end);
}

interface Block {
  type?: string;
  text?: unknown;
  source?: { data?: string; media_type?: string };
}

interface Entry {
  type?: string;
  uuid?: string;
  messageId?: string;
  isSidechain?: boolean;
  isMeta?: boolean;
  isCompactSummary?: boolean;
  toolUseResult?: unknown;
  /** ISO time the line was written. */
  timestamp?: string;
  message?: { content?: unknown; model?: string; usage?: Usage };
}

/** The token counts the API returned for one reply. */
interface Usage {
  input_tokens?: number;
  cache_read_input_tokens?: number;
  cache_creation_input_tokens?: number;
}

// The context a reply was given is its fresh input plus what it read from and wrote to the
// prompt cache; output tokens only join the context with the next request.
function contextOf(usage: Usage): number {
  const part = (n: number | undefined) => (typeof n === 'number' && Number.isFinite(n) ? n : 0);
  return (
    part(usage.input_tokens) +
    part(usage.cache_read_input_tokens) +
    part(usage.cache_creation_input_tokens)
  );
}

// What Claude Code writes as the model of a reply it made up itself, such as an API error.
const SYNTHETIC = '<synthetic>';

function parse(line: string): Entry | null {
  if (!line.trim()) return null;
  try {
    return JSON.parse(line) as Entry;
  } catch {
    return null;
  }
}

function blocksOf(entry: Entry): (Block | null)[] {
  const content = entry.message?.content;
  if (typeof content === 'string') return [{ type: 'text', text: content }];
  // Parsed JSON: nothing stops an array from holding a null.
  return Array.isArray(content) ? (content as (Block | null)[]) : [];
}

export class ClaudeTranscripts implements TranscriptSource {
  constructor(private readonly options: ClaudeOptions) {}

  // The port is async for adapters that need I/O; this one reads synchronously.
  locate(pid: number | null, cwd: string): Promise<Located> {
    return Promise.resolve(this.locateNow(pid, cwd));
  }

  private locateNow(pid: number | null, cwd: string): Located {
    if (!pid) return { file: null, note: 'no agent process in this pane' };
    const session = this.sessionByPid(pid);
    if (!session?.sessionId) return { file: null, note: 'no session index for pid ' + pid };
    const file = this.transcriptFor(session.sessionId, session.cwd || cwd);
    if (!file) return { file: null, note: 'transcript not written yet' };
    return { file };
  }

  read(file: string): Chat {
    const messages: ChatMessage[] = [];
    let model: string | null = null;
    let usedTokens: number | null = null;
    for (const line of this.tail(file)) {
      const entry = parse(line);
      if (!entry || (entry.type !== 'user' && entry.type !== 'assistant')) continue;
      // Subagent traffic, CLI bookkeeping and tool results are not the conversation.
      if (entry.isSidechain || entry.isMeta || entry.toolUseResult || entry.isCompactSummary) {
        continue;
      }
      const role: Role = entry.type;
      const named = entry.message?.model;
      if (role === 'assistant' && named && named !== SYNTHETIC) model = named;
      // A stand-in reply never reached the API, so its zero usage says nothing about the context.
      const usage = entry.message?.usage;
      if (role === 'assistant' && named !== SYNTHETIC && usage && typeof usage === 'object') {
        usedTokens = contextOf(usage);
      }
      const time = entry.timestamp ? Date.parse(entry.timestamp) : Number.NaN;
      const at = Number.isFinite(time) ? { at: time } : {};
      // The id is uuid:index, so it points straight back at its block when the
      // image bytes are asked for later.
      const uuid = entry.uuid || entry.messageId || '';
      blocksOf(entry).forEach((block, i) => {
        const id = uuid + ':' + i;
        if (block?.type === 'image' && block.source?.data) {
          const media = block.source.media_type || 'image/png';
          messages.push({ id, role, kind: 'image', media, ...at });
          return;
        }
        // Skips thinking, tool_use and tool_result in one condition.
        if (block?.type !== 'text' || typeof block.text !== 'string') return;
        const text = stripEnvelopes(block.text);
        if (text) messages.push({ id, role, kind: 'text', text, ...at });
      });
    }
    return { messages: messages.slice(-this.options.maxMessages), model, usedTokens };
  }

  image(file: string, id: string): ImageResult | null {
    const cut = id.lastIndexOf(':');
    if (cut < 1) return null;
    const uuid = id.slice(0, cut);
    const index = Number(id.slice(cut + 1));
    if (!Number.isInteger(index)) return null;

    for (const line of this.tail(file)) {
      if (!line.includes(uuid)) continue;
      const entry = parse(line);
      if (!entry || (entry.uuid || entry.messageId) !== uuid) continue;
      const block = blocksOf(entry)[index];
      if (block?.type !== 'image' || !block.source?.data) return null;
      return {
        media: block.source.media_type || 'image/png',
        data: Buffer.from(block.source.data, 'base64'),
      };
    }
    return null;
  }

  watch(file: string, onChange: () => void): () => void {
    const watcher = watch(file, { persistent: false }, () => onChange());
    // A transcript can be deleted under us; the hub looks for it again later.
    watcher.on('error', () => watcher.close());
    return () => watcher.close();
  }

  private sessionByPid(pid: number): { sessionId?: string; cwd?: string } | null {
    try {
      return JSON.parse(readFileSync(join(this.options.sessionsDir, pid + '.json'), 'utf8')) as {
        sessionId?: string;
        cwd?: string;
      };
    } catch {
      return null;
    }
  }

  private transcriptFor(sessionId: string, cwd: string): string | null {
    const direct = join(this.options.projectsDir, projectDirName(cwd), sessionId + '.jsonl');
    if (existsSync(direct)) return direct;
    // Scanning keeps the view working if that naming ever changes.
    try {
      for (const dir of readdirSync(this.options.projectsDir)) {
        const candidate = join(this.options.projectsDir, dir, sessionId + '.jsonl');
        if (existsSync(candidate)) return candidate;
      }
    } catch {
      /* no projects directory */
    }
    return null;
  }

  private tail(file: string): string[] {
    const fd = openSync(file, 'r');
    try {
      const size = fstatSync(fd).size;
      const start = Math.max(0, size - this.options.tailBytes);
      const buffer = Buffer.alloc(size - start);
      readSync(fd, buffer, 0, buffer.length, start);
      const lines = buffer.toString('utf8').split('\n');
      // A partial first line is expected whenever the read started mid-file.
      if (start > 0) lines.shift();
      return lines;
    } finally {
      closeSync(fd);
    }
  }
}
