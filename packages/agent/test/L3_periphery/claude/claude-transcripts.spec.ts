import { appendFileSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  ClaudeTranscripts,
  projectDirName,
  stripEnvelopes,
} from '../../../src/L3_periphery/claude/claude-transcripts';

const line = (entry: unknown) => JSON.stringify(entry) + '\n';

function user(uuid: string, content: unknown, extra: object = {}) {
  return line({ type: 'user', uuid, message: { role: 'user', content }, ...extra });
}

function assistant(uuid: string, content: unknown, extra: object = {}) {
  return line({ type: 'assistant', uuid, message: { role: 'assistant', content }, ...extra });
}

describe('stripEnvelopes', () => {
  it('removes what the CLI injects and keeps what a person typed', () => {
    expect(stripEnvelopes('<system-reminder>x</system-reminder>hola')).toBe('hola');
    expect(stripEnvelopes('<command-name>/clear</command-name>')).toBe('');
    expect(stripEnvelopes('This session is being continued from a previous conversation...')).toBe(
      '',
    );
    expect(stripEnvelopes('<unknown-tag>machinery</unknown-tag>')).toBe('');
  });
});

describe('projectDirName', () => {
  it('flattens a cwd the way Claude Code names its project folders', () => {
    expect(projectDirName('C:\\Users\\me\\remote-sheep\\')).toBe('C--Users-me-remote-sheep');
  });
});

describe('ClaudeTranscripts', () => {
  let home: string;
  let transcripts: ClaudeTranscripts;

  beforeEach(() => {
    home = mkdtempSync(join(tmpdir(), 'sheep-claude-'));
    mkdirSync(join(home, 'sessions'));
    mkdirSync(join(home, 'projects', 'C--work-app'), { recursive: true });
    transcripts = new ClaudeTranscripts({
      sessionsDir: join(home, 'sessions'),
      projectsDir: join(home, 'projects'),
      tailBytes: 1024 * 1024,
      maxMessages: 40,
    });
  });

  function writeSession(pid: number, sessionId: string) {
    writeFileSync(
      join(home, 'sessions', pid + '.json'),
      JSON.stringify({ sessionId, cwd: 'C:\\work\\app' }),
    );
  }

  function transcriptPath(sessionId: string) {
    return join(home, 'projects', 'C--work-app', sessionId + '.jsonl');
  }

  it('finds the transcript from the pid of the agent process', async () => {
    writeSession(42, 's1');
    writeFileSync(transcriptPath('s1'), '');
    expect(await transcripts.locate(42, 'C:\\work\\app')).toEqual({ file: transcriptPath('s1') });
  });

  it('explains each way the transcript can be missing', async () => {
    expect(await transcripts.locate(null, 'C:\\work\\app')).toEqual({
      file: null,
      note: 'no agent process in this pane',
    });
    expect(await transcripts.locate(7, 'C:\\work\\app')).toEqual({
      file: null,
      note: 'no session index for pid 7',
    });
    writeSession(8, 'never-written');
    expect(await transcripts.locate(8, 'C:\\work\\app')).toEqual({
      file: null,
      note: 'transcript not written yet',
    });
  });

  it('keeps only the conversation', () => {
    const file = transcriptPath('s1');
    const image = {
      type: 'image',
      source: { type: 'base64', media_type: 'image/jpeg', data: 'AAAA' },
    };
    writeFileSync(
      file,
      user('u1', 'hola') +
        assistant('a1', [
          { type: 'thinking', thinking: 'hmm' },
          { type: 'text', text: 'hola, que hago?' },
          { type: 'tool_use', id: 't', name: 'Bash', input: {} },
        ]) +
        user('u2', [{ type: 'tool_result', content: 'x' }], { toolUseResult: {} }) +
        assistant('a2', [{ type: 'text', text: 'sidechain' }], { isSidechain: true }) +
        user('u3', 'meta', { isMeta: true }) +
        user('u4', 'summary', { isCompactSummary: true }) +
        user('u5', '<system-reminder>only machinery</system-reminder>') +
        line({ type: 'summary', summary: 'x' }) +
        'not json\n' +
        user('u6', [image]),
    );
    expect(transcripts.read(file).messages).toEqual([
      { id: 'u1:0', role: 'user', kind: 'text', text: 'hola' },
      { id: 'a1:1', role: 'assistant', kind: 'text', text: 'hola, que hago?' },
      { id: 'u6:0', role: 'user', kind: 'image', media: 'image/jpeg' },
    ]);
  });

  it('dates each message and names the model of the latest reply', () => {
    const file = transcriptPath('s1');
    const reply = (uuid: string, model: string, extra: object = {}) =>
      line({
        type: 'assistant',
        uuid,
        timestamp: '2026-10-18T14:33:00.000Z',
        message: { role: 'assistant', model, content: [{ type: 'text', text: uuid }] },
        ...extra,
      });
    writeFileSync(
      file,
      user('u1', 'hola', { timestamp: '2026-10-18T14:32:00.000Z' }) +
        reply('a1', 'claude-sonnet-5-5') +
        reply('a2', 'claude-opus-5-5') +
        // Neither a subagent's model nor the CLI's own stand-in reply is the session's.
        reply('a3', 'claude-haiku-4-5', { isSidechain: true }) +
        reply('a4', '<synthetic>') +
        user('u2', 'sin hora', { timestamp: 'not a date' }),
    );
    const chat = transcripts.read(file);
    expect(chat.model).toBe('claude-opus-5-5');
    expect(chat.messages).toEqual([
      { id: 'u1:0', role: 'user', kind: 'text', text: 'hola', at: Date.UTC(2026, 9, 18, 14, 32) },
      {
        id: 'a1:0',
        role: 'assistant',
        kind: 'text',
        text: 'a1',
        at: Date.UTC(2026, 9, 18, 14, 33),
      },
      {
        id: 'a2:0',
        role: 'assistant',
        kind: 'text',
        text: 'a2',
        at: Date.UTC(2026, 9, 18, 14, 33),
      },
      {
        id: 'a4:0',
        role: 'assistant',
        kind: 'text',
        text: 'a4',
        at: Date.UTC(2026, 9, 18, 14, 33),
      },
      { id: 'u2:0', role: 'user', kind: 'text', text: 'sin hora' },
    ]);
  });

  it('names no model when no reply says which', () => {
    const file = transcriptPath('s1');
    writeFileSync(file, user('u1', 'hola') + assistant('a1', 'hi'));
    expect(transcripts.read(file).model).toBeNull();
  });

  it('returns only the most recent messages', () => {
    const file = transcriptPath('s1');
    let body = '';
    for (let i = 0; i < 50; i++) body += user('u' + i, 'm' + i);
    writeFileSync(file, body);
    const { messages } = transcripts.read(file);
    expect(messages).toHaveLength(40);
    expect(messages[39]).toMatchObject({ id: 'u49:0' });
  });

  it('returns the bytes of an image block by id', () => {
    const file = transcriptPath('s1');
    writeFileSync(
      file,
      user('u1', [
        { type: 'image', source: { type: 'base64', media_type: 'image/png', data: 'iVBO' } },
      ]),
    );
    expect(transcripts.image(file, 'u1:0')).toEqual({
      media: 'image/png',
      data: Buffer.from('iVBO', 'base64'),
    });
    expect(transcripts.image(file, 'u1:5')).toBeNull();
    expect(transcripts.image(file, 'zz:0')).toBeNull();
    expect(transcripts.image(file, 'garbage')).toBeNull();
  });

  it('notices when the transcript grows', async () => {
    const file = transcriptPath('s1');
    writeFileSync(file, user('u1', 'hola'));
    const changed = new Promise<void>((resolve) => {
      const stop = transcripts.watch(file, () => {
        stop();
        resolve();
      });
    });
    appendFileSync(file, assistant('a1', 'listo'));
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('no change seen')), 3000),
    );
    await expect(Promise.race([changed, timeout])).resolves.toBeUndefined();
  });
});
