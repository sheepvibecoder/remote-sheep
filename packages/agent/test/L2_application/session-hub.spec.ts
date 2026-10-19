import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  pairingProof,
  type ChatMessage,
  type ServerMessage,
  type Session,
  type Workspace,
} from '@remote-sheep/protocol';
import { SessionHub } from '../../src/L2_application/session-hub';
import type { Multiplexer } from '../../src/L1_domain/ports/multiplexer';
import type { Located, TranscriptSource } from '../../src/L1_domain/ports/transcript';
import type { Connection } from '../../src/L1_domain/ports/connection';
import type { UploadStore } from '../../src/L1_domain/ports/upload-store';
import { PairingService } from '../../src/L2_application/pairing-service';
import { MemoryDeviceRegistry } from '../fakes/memory-device-registry';

const LIST_MS = 2000;
const TERMINAL_MS = 1500;
const T0 = 1_700_000_000_000;
const DAY = 24 * 60 * 60 * 1000;

function session(target: string, status: Session['status'] = 'idle'): Session {
  return {
    target,
    kind: 'agent',
    title: target,
    status,
    cwd: 'C:\\work\\' + target,
    project: target,
    space: 'w1',
  };
}

function text(id: string, value: string): ChatMessage {
  return { id, role: 'assistant', kind: 'text', text: value };
}

class FakeMultiplexer implements Multiplexer {
  sessions: Session[] = [session('p1')];
  shells: Session[] = [
    { ...session('w1:s1'), kind: 'shell', title: 'pwsh.exe', status: 'unknown' },
  ];
  failure: Error | null = null;
  terminal = 'prompt> ';
  listCalls = 0;
  prompts: [string, string][] = [];
  keys: [string, string[]][] = [];
  spaces: Workspace[] = [{ id: 'w1', label: 'remote-sheep' }];
  started: string[] = [];
  startedAgents: string[] = [];
  shellsStarted: string[] = [];
  /** Which kind of pane each terminal read reached. */
  reads: string[] = [];
  async listSessions() {
    this.listCalls++;
    if (this.failure) throw this.failure;
    return this.sessions.map((s) => ({ ...s }));
  }
  async processId() {
    return 42;
  }
  async listShells() {
    return this.shells.map((s) => ({ ...s }));
  }
  async readTerminal(read: Session) {
    this.reads.push(read.kind + ' ' + read.target);
    return this.terminal;
  }
  async sendPrompt(to: Session, value: string) {
    this.prompts.push([to.kind === 'shell' ? '$ ' + to.target : to.target, value]);
  }
  async sendKeys(to: Session, keys: string[]) {
    this.keys.push([to.kind === 'shell' ? '$ ' + to.target : to.target, keys]);
  }
  async listSpaces() {
    return this.spaces;
  }
  async startSession(space: string, agent: string) {
    this.started.push(space);
    this.startedAgents.push(agent);
    return space + ':p9';
  }
  async startShell(space: string) {
    this.shellsStarted.push(space);
    return space + ':s9';
  }
}

class FakeTranscripts implements TranscriptSource {
  located: Located = { file: '/t/p1.jsonl' };
  messages: ChatMessage[] = [text('a:0', 'hola')];
  model: string | null = null;
  onChange: (() => void) | null = null;
  stopped = 0;
  async locate() {
    return this.located;
  }
  read() {
    return { messages: this.messages.map((m) => ({ ...m })), model: this.model };
  }
  image(_file: string, id: string) {
    return id === 'a:1' ? { media: 'image/png', data: new Uint8Array([1, 2]) } : null;
  }
  watch(_file: string, onChange: () => void) {
    this.onChange = onChange;
    return () => {
      this.stopped++;
      this.onChange = null;
    };
  }
}

class FakeUploads implements UploadStore {
  saved: [string, Uint8Array][] = [];
  async save(media: string, bytes: Uint8Array) {
    this.saved.push([media, bytes]);
    return { path: 'C:\\up\\x.jpg', name: 'x.jpg', bytes: bytes.length };
  }
}

class FakeConnection implements Connection {
  constructor(readonly device = 'test') {}
  sent: ServerMessage[] = [];
  closed: number | null = null;
  send(message: ServerMessage) {
    this.sent.push(message);
  }
  close(code: number) {
    this.closed = code;
  }
  of<T extends ServerMessage['type']>(type: T) {
    return this.sent.filter((m) => m.type === type) as Extract<ServerMessage, { type: T }>[];
  }
}

// Lets the promises the hub started on a timer settle.
const settle = () => vi.advanceTimersByTimeAsync(0);

describe('SessionHub', () => {
  let mux: FakeMultiplexer;
  let transcripts: FakeTranscripts;
  let uploads: FakeUploads;
  let registry: MemoryDeviceRegistry;
  let pairing: PairingService;
  let hub: SessionHub;

  beforeEach(() => {
    vi.useFakeTimers();
    mux = new FakeMultiplexer();
    transcripts = new FakeTranscripts();
    uploads = new FakeUploads();
    registry = new MemoryDeviceRegistry();
    pairing = new PairingService({
      registry,
      clock: { now: () => T0 },
      random: { bytes: (n: number) => new Uint8Array(n).fill(7) },
    });
    hub = new SessionHub({
      multiplexer: mux,
      transcripts,
      uploads,
      devices: pairing,
      listIntervalMs: LIST_MS,
      terminalIntervalMs: TERMINAL_MS,
      debounceMs: 0,
      shells: false,
    });
  });

  afterEach(() => {
    hub.stop();
    vi.useRealTimers();
  });

  it('sends the session list to a phone as soon as it connects', async () => {
    const phone = new FakeConnection();
    hub.open(phone);
    await settle();
    expect(phone.of('sessions')).toEqual([{ type: 'sessions', sessions: [session('p1')] }]);
  });

  it('pushes the list again only when it changes', async () => {
    const phone = new FakeConnection();
    hub.open(phone);
    await settle();
    await vi.advanceTimersByTimeAsync(LIST_MS);
    expect(phone.of('sessions')).toHaveLength(1);

    mux.sessions = [session('p1', 'working')];
    await vi.advanceTimersByTimeAsync(LIST_MS);
    expect(phone.of('sessions')).toHaveLength(2);
    expect(phone.of('sessions')[1]?.sessions[0]?.status).toBe('working');
  });

  it('stops asking the multiplexer once the last phone leaves', async () => {
    const phone = new FakeConnection();
    hub.open(phone);
    await settle();
    hub.close(phone);
    const calls = mux.listCalls;
    await vi.advanceTimersByTimeAsync(LIST_MS * 5);
    expect(mux.listCalls).toBe(calls);
  });

  it('tells every phone when Herdr stops answering and when it is back', async () => {
    const phone = new FakeConnection();
    hub.open(phone);
    await settle();
    mux.failure = new Error('herdr is not running');
    await vi.advanceTimersByTimeAsync(LIST_MS);
    expect(phone.of('status')).toEqual([{ type: 'status', herdrError: 'herdr is not running' }]);

    mux.failure = null;
    await vi.advanceTimersByTimeAsync(LIST_MS);
    expect(phone.of('status')).toEqual([
      { type: 'status', herdrError: 'herdr is not running' },
      { type: 'status', herdrError: null },
    ]);
  });

  it('tells a phone that connects while Herdr is failing at once', async () => {
    const first = new FakeConnection();
    hub.open(first);
    await settle();
    mux.failure = new Error('herdr is not running');
    await vi.advanceTimersByTimeAsync(LIST_MS);

    const second = new FakeConnection();
    hub.open(second);
    expect(second.of('status')).toEqual([{ type: 'status', herdrError: 'herdr is not running' }]);
  });

  it('keeps watching the sessions with no phone when a notifier listens', async () => {
    hub.stop();
    const heard: string[] = [];
    mux.sessions = [session('p1', 'working')];
    hub = new SessionHub({
      multiplexer: mux,
      transcripts,
      uploads,
      devices: pairing,
      listIntervalMs: LIST_MS,
      terminalIntervalMs: TERMINAL_MS,
      debounceMs: 0,
      shells: false,
      notifier: { notify: (change) => heard.push(change.session.target + ' ' + change.to) },
    });
    await settle();
    mux.sessions = [session('p1', 'done')];
    await vi.advanceTimersByTimeAsync(LIST_MS);
    expect(heard).toEqual(['p1 done']);

    const phone = new FakeConnection();
    hub.open(phone);
    hub.close(phone);
    const calls = mux.listCalls;
    await vi.advanceTimersByTimeAsync(LIST_MS * 2);
    expect(mux.listCalls).toBeGreaterThan(calls);
  });

  it('streams the chat of the watched session and again whenever the transcript changes', async () => {
    const phone = new FakeConnection();
    hub.open(phone);
    await settle();
    await hub.request(phone, { kind: 'watch', target: 'p1', terminal: false });
    expect(phone.of('chat')).toEqual([
      { type: 'chat', target: 'p1', messages: [text('a:0', 'hola')], note: null },
    ]);

    transcripts.messages.push(text('b:0', 'listo'));
    transcripts.onChange?.();
    await settle();
    expect(phone.of('chat')).toHaveLength(2);
    expect(phone.of('chat')[1]?.messages).toHaveLength(2);
  });

  it('names the model of the chat, and sends again when only the model changed', async () => {
    transcripts.model = 'claude-sonnet-5-5';
    const phone = new FakeConnection();
    hub.open(phone);
    await settle();
    await hub.request(phone, { kind: 'watch', target: 'p1', terminal: false });
    expect(phone.of('chat')).toEqual([
      {
        type: 'chat',
        target: 'p1',
        messages: [text('a:0', 'hola')],
        note: null,
        model: 'claude-sonnet-5-5',
      },
    ]);

    transcripts.model = 'claude-opus-5-5';
    transcripts.onChange?.();
    await settle();
    expect(phone.of('chat').at(-1)?.model).toBe('claude-opus-5-5');

    // A phone that starts watching later gets the same chat from the cache.
    const late = new FakeConnection();
    hub.open(late);
    await settle();
    await hub.request(late, { kind: 'watch', target: 'p1', terminal: false });
    expect(late.of('chat').at(-1)?.model).toBe('claude-opus-5-5');
  });

  it('follows the session to a new transcript after /clear', async () => {
    const phone = new FakeConnection();
    hub.open(phone);
    await settle();
    await hub.request(phone, { kind: 'watch', target: 'p1', terminal: false });

    transcripts.located = { file: '/t/p1-after-clear.jsonl' };
    transcripts.messages = [text('c:0', 'nueva conversacion')];
    await vi.advanceTimersByTimeAsync(LIST_MS);

    expect(transcripts.stopped).toBe(1);
    expect(phone.of('chat').at(-1)?.messages).toEqual([text('c:0', 'nueva conversacion')]);

    transcripts.messages.push(text('d:0', 'listo'));
    transcripts.onChange?.();
    await settle();
    expect(phone.of('chat').at(-1)?.messages).toHaveLength(2);
  });

  it('refuses to watch the terminal of a session that does not exist', async () => {
    const phone = new FakeConnection();
    hub.open(phone);
    await settle();
    await expect(
      hub.request(phone, { kind: 'watch', target: '--help', terminal: true }),
    ).rejects.toThrow('unknown session');
    expect(phone.of('terminal')).toEqual([]);
  });

  it('survives a transcript that cannot be watched', async () => {
    transcripts.watch = () => {
      throw new Error('ENOENT');
    };
    const phone = new FakeConnection();
    hub.open(phone);
    await settle();
    await hub.request(phone, { kind: 'watch', target: 'p1', terminal: false });
    await vi.advanceTimersByTimeAsync(LIST_MS);
    expect(phone.of('sessions')).toHaveLength(1);
  });

  it('does not resend a chat that did not change', async () => {
    const phone = new FakeConnection();
    hub.open(phone);
    await settle();
    await hub.request(phone, { kind: 'watch', target: 'p1', terminal: false });
    transcripts.onChange?.();
    await settle();
    expect(phone.of('chat')).toHaveLength(1);
  });

  it('gives a second phone the current chat when it starts watching', async () => {
    const first = new FakeConnection();
    const second = new FakeConnection();
    hub.open(first);
    hub.open(second);
    await settle();
    await hub.request(first, { kind: 'watch', target: 'p1', terminal: false });
    await hub.request(second, { kind: 'watch', target: 'p1', terminal: false });
    expect(second.of('chat')).toHaveLength(1);
  });

  it('stops watching the transcript when nobody looks at it', async () => {
    const phone = new FakeConnection();
    hub.open(phone);
    await settle();
    await hub.request(phone, { kind: 'watch', target: 'p1', terminal: false });
    await hub.request(phone, { kind: 'watch', target: null, terminal: false });
    expect(transcripts.stopped).toBe(1);
  });

  it('explains why there is no chat when the transcript cannot be found', async () => {
    transcripts.located = { file: null, note: 'transcript not written yet' };
    const phone = new FakeConnection();
    hub.open(phone);
    await settle();
    await hub.request(phone, { kind: 'watch', target: 'p1', terminal: false });
    expect(phone.of('chat')).toEqual([
      { type: 'chat', target: 'p1', messages: [], note: 'transcript not written yet' },
    ]);
  });

  it('sends the raw terminal while a phone asks for it, and only when it changes', async () => {
    const phone = new FakeConnection();
    hub.open(phone);
    await settle();
    await hub.request(phone, { kind: 'watch', target: 'p1', terminal: true });
    expect(phone.of('terminal')).toEqual([{ type: 'terminal', target: 'p1', output: 'prompt> ' }]);

    await vi.advanceTimersByTimeAsync(TERMINAL_MS);
    expect(phone.of('terminal')).toHaveLength(1);

    mux.terminal = 'prompt> done';
    await vi.advanceTimersByTimeAsync(TERMINAL_MS);
    expect(phone.of('terminal')).toHaveLength(2);
  });

  it('sends prompts and keys to a known session', async () => {
    const phone = new FakeConnection();
    hub.open(phone);
    await settle();
    await hub.request(phone, { kind: 'prompt', target: 'p1', text: 'corre los tests' });
    await hub.request(phone, { kind: 'keys', target: 'p1', keys: ['enter'] });
    expect(mux.prompts).toEqual([['p1', 'corre los tests']]);
    expect(mux.keys).toEqual([['p1', ['enter']]]);
  });

  it('lists the workspaces and starts a session in one of them', async () => {
    const phone = new FakeConnection();
    hub.open(phone);
    await settle();
    expect(await hub.request(phone, { kind: 'spaces' })).toEqual([
      { id: 'w1', label: 'remote-sheep' },
    ]);
    expect(await hub.request(phone, { kind: 'new-session', space: 'w1', shell: false })).toEqual({
      target: 'w1:p9',
    });
    expect(mux.started).toEqual(['w1']);
  });

  it('starts the agent the phone asks for, and Claude Code when it asks for none', async () => {
    const phone = new FakeConnection();
    hub.open(phone);
    await settle();
    await hub.request(phone, { kind: 'new-session', space: 'w1', shell: false, agent: 'codex' });
    await hub.request(phone, { kind: 'new-session', space: 'w1', shell: false });
    expect(mux.startedAgents).toEqual(['codex', 'claude']);
  });

  it('refuses to start a session in a workspace that does not exist', async () => {
    const phone = new FakeConnection();
    hub.open(phone);
    await settle();
    await expect(
      hub.request(phone, { kind: 'new-session', space: 'w404', shell: false }),
    ).rejects.toThrow('unknown workspace: w404');
    expect(mux.started).toEqual([]);
  });

  it('lists no shells and refuses to start one while consoles are off', async () => {
    const phone = new FakeConnection();
    hub.open(phone);
    await settle();
    expect(phone.of('sessions').at(-1)).toEqual({ type: 'sessions', sessions: [session('p1')] });
    await expect(
      hub.request(phone, { kind: 'new-session', space: 'w1', shell: true }),
    ).rejects.toThrow(
      'consoles are off on this computer: start the agent with REMOTE_SHEEP_SHELLS=1',
    );
    await expect(
      hub.request(phone, { kind: 'prompt', target: 'w1:s1', text: 'dir' }),
    ).rejects.toThrow('unknown session');
    expect(mux.shellsStarted).toEqual([]);
    expect(mux.prompts).toEqual([]);
  });

  describe('with consoles on', () => {
    beforeEach(() => {
      hub.stop();
      hub = new SessionHub({
        multiplexer: mux,
        transcripts,
        uploads,
        devices: pairing,
        listIntervalMs: LIST_MS,
        terminalIntervalMs: TERMINAL_MS,
        debounceMs: 0,
        shells: true,
      });
    });

    it('lists the shells after the agents', async () => {
      const phone = new FakeConnection();
      hub.open(phone);
      await settle();
      expect(phone.of('sessions').at(-1)).toEqual({
        type: 'sessions',
        sessions: [session('p1'), ...mux.shells],
      });
    });

    it('starts a shell in a known workspace and answers its pane', async () => {
      const phone = new FakeConnection();
      hub.open(phone);
      await settle();
      expect(await hub.request(phone, { kind: 'new-session', space: 'w1', shell: true })).toEqual({
        target: 'w1:s9',
      });
      await expect(
        hub.request(phone, { kind: 'new-session', space: 'w404', shell: true }),
      ).rejects.toThrow('unknown workspace: w404');
      expect(mux.shellsStarted).toEqual(['w1']);
      expect(mux.started).toEqual([]);
    });

    it('sends commands and keys to a shell and streams its terminal', async () => {
      const phone = new FakeConnection();
      hub.open(phone);
      await settle();
      await hub.request(phone, { kind: 'prompt', target: 'w1:s1', text: 'git status' });
      await hub.request(phone, { kind: 'keys', target: 'w1:s1', keys: ['ctrl+c'] });
      await hub.request(phone, { kind: 'watch', target: 'w1:s1', terminal: true });
      mux.terminal = 'PS> git status';
      await vi.advanceTimersByTimeAsync(TERMINAL_MS);
      expect(mux.prompts).toEqual([['$ w1:s1', 'git status']]);
      expect(mux.keys).toEqual([['$ w1:s1', ['ctrl+c']]]);
      expect(mux.reads).toEqual(['shell w1:s1', 'shell w1:s1']);
      expect(phone.of('terminal').at(-1)).toEqual({
        type: 'terminal',
        target: 'w1:s1',
        output: 'PS> git status',
      });
    });
  });

  it('refuses prompts and keys for a session that does not exist', async () => {
    const phone = new FakeConnection();
    hub.open(phone);
    await settle();
    await expect(hub.request(phone, { kind: 'prompt', target: 'nope', text: 'x' })).rejects.toThrow(
      'unknown session',
    );
    await expect(
      hub.request(phone, { kind: 'keys', target: 'nope', keys: ['esc'] }),
    ).rejects.toThrow('unknown session');
    expect(mux.prompts).toEqual([]);
    expect(mux.keys).toEqual([]);
  });

  it('returns image bytes from the transcript and fails for an unknown id', async () => {
    const phone = new FakeConnection();
    hub.open(phone);
    await settle();
    await expect(hub.request(phone, { kind: 'image', target: 'p1', id: 'a:1' })).resolves.toEqual({
      media: 'image/png',
      data: new Uint8Array([1, 2]),
    });
    await expect(hub.request(phone, { kind: 'image', target: 'p1', id: 'zz:9' })).rejects.toThrow(
      'image not found',
    );
  });

  it('stores an uploaded photo as the raw bytes it arrived with', async () => {
    const phone = new FakeConnection();
    hub.open(phone);
    const result = await hub.request(phone, {
      kind: 'upload',
      media: 'image/jpeg',
      data: new TextEncoder().encode('jpeg-bytes'),
    });
    expect(uploads.saved[0]?.[0]).toBe('image/jpeg');
    expect(new TextDecoder().decode(uploads.saved[0]?.[1])).toBe('jpeg-bytes');
    expect(result).toEqual({ path: 'C:\\up\\x.jpg', name: 'x.jpg', bytes: 10 });
  });

  describe('linked devices', () => {
    const saveDevice = (id: string, pairedAt: number) =>
      registry.save({ id, publicKey: new Uint8Array(32), pairedAt, lastSeen: pairedAt });

    const linked = (id: string, pairedAt: number, current: boolean) => ({
      id,
      pairedAt,
      lastSeen: pairedAt,
      expiresAt: pairedAt + DAY,
      current,
    });

    it('lists the paired phones, marking the one that asks', async () => {
      await saveDevice('aaaa', T0);
      await saveDevice('bbbb', T0 + 1);
      const phone = new FakeConnection('bbbb');
      hub.open(phone);
      await expect(hub.request(phone, { kind: 'devices' })).resolves.toEqual([
        linked('aaaa', T0, false),
        linked('bbbb', T0 + 1, true),
      ]);
    });

    it('unlinks a device and pushes the new list to every open phone', async () => {
      await saveDevice('aaaa', T0);
      await saveDevice('bbbb', T0 + 1);
      const a = new FakeConnection('aaaa');
      const b = new FakeConnection('bbbb');
      hub.open(a);
      hub.open(b);

      await expect(hub.request(a, { kind: 'unlink', id: 'bbbb' })).resolves.toBeUndefined();
      await settle();
      expect(await registry.isRevoked('bbbb')).toBe(true);
      expect(a.of('devices')).toEqual([{ type: 'devices', devices: [linked('aaaa', T0, true)] }]);
      expect(b.of('devices')).toEqual([{ type: 'devices', devices: [linked('aaaa', T0, false)] }]);
    });

    it('refuses an unknown id and pushes nothing', async () => {
      await saveDevice('aaaa', T0);
      const phone = new FakeConnection('aaaa');
      hub.open(phone);
      await expect(hub.request(phone, { kind: 'unlink', id: 'zzzz' })).rejects.toThrow(
        'no paired device has the id zzzz',
      );
      await settle();
      expect(phone.of('devices')).toEqual([]);
      expect(await registry.list()).toHaveLength(1);
    });

    it('pushes the new list to the open phones when another phone pairs', async () => {
      await saveDevice('aaaa', T0);
      const open = new FakeConnection('aaaa');
      const gone = new FakeConnection('cccc');
      hub.open(open);
      hub.open(gone);
      hub.close(gone);

      const phone = new Uint8Array(32).fill(3);
      const invite = pairing.createInvite();
      const transcript = new Uint8Array(32);
      const proof = pairingProof(invite.secret, transcript);
      const device = await pairing.completePairing(invite, phone, transcript, proof);
      await settle();

      expect(open.of('devices')).toEqual([
        {
          type: 'devices',
          devices: [linked('aaaa', T0, true), linked(device!.id, T0, false)],
        },
      ]);
      expect(gone.of('devices')).toEqual([]);
    });

    it('logs a list that cannot be read instead of pushing it', async () => {
      hub.stop();
      const logged: string[] = [];
      hub = new SessionHub({
        multiplexer: mux,
        transcripts,
        uploads,
        devices: pairing,
        listIntervalMs: LIST_MS,
        terminalIntervalMs: TERMINAL_MS,
        debounceMs: 0,
        shells: false,
        log: (message) => logged.push(message),
      });
      await saveDevice('aaaa', T0);
      const phone = new FakeConnection('aaaa');
      hub.open(phone);
      registry.list = () => Promise.reject(new Error('disk gone'));
      await pairing.unlink('aaaa');
      await settle();
      expect(phone.of('devices')).toEqual([]);
      expect(logged).toContain('pushing the device list failed: disk gone');
    });
  });

  describe('push notifications', () => {
    const subscription = {
      endpoint: 'https://push.example/a',
      p256dh: 'p',
      auth: 'a',
    };

    function withNotifier() {
      hub.stop();
      const heard: string[] = [];
      const stored: [string, unknown][] = [];
      mux.sessions = [session('p1', 'working')];
      hub = new SessionHub({
        multiplexer: mux,
        transcripts,
        uploads,
        devices: pairing,
        listIntervalMs: LIST_MS,
        terminalIntervalMs: TERMINAL_MS,
        debounceMs: 0,
        shells: false,
        notifier: { notify: (change) => heard.push(change.session.target + ' ' + change.to) },
        push: {
          publicKey: 'VAPID-KEY',
          subscribe: async (device, push) => void stored.push([device, push]),
          unsubscribe: async (device) => void stored.push([device, null]),
        },
      });
      return { heard, stored };
    }

    async function settleSession(to: Session['status']) {
      await settle();
      mux.sessions = [session('p1', to)];
      await vi.advanceTimersByTimeAsync(LIST_MS);
    }

    it('does not notify while a phone has that session chat open', async () => {
      const { heard } = withNotifier();
      const phone = new FakeConnection();
      hub.open(phone);
      await settle();
      await hub.request(phone, { kind: 'watch', target: 'p1', terminal: false });
      await settleSession('done');
      expect(heard).toEqual([]);
    });

    it('notifies when phones are connected but none watches that chat', async () => {
      const { heard } = withNotifier();
      const looking = new FakeConnection();
      hub.open(looking);
      await settle();
      await hub
        .request(looking, { kind: 'watch', target: 'other', terminal: false })
        .catch(() => {});
      await settleSession('blocked');
      expect(heard).toEqual(['p1 blocked']);
    });

    it('notifies when the phone has only the raw terminal open', async () => {
      const { heard } = withNotifier();
      const phone = new FakeConnection();
      hub.open(phone);
      await settle();
      await hub.request(phone, { kind: 'watch', target: 'p1', terminal: true });
      await settleSession('done');
      expect(heard).toEqual(['p1 done']);
    });

    it('notifies again once the phone looks away', async () => {
      const { heard } = withNotifier();
      const phone = new FakeConnection();
      hub.open(phone);
      await settle();
      await hub.request(phone, { kind: 'watch', target: 'p1', terminal: false });
      await hub.request(phone, { kind: 'watch', target: null, terminal: false });
      await settleSession('done');
      expect(heard).toEqual(['p1 done']);
    });

    it('answers push-key with the public key, and stores what the asking device subscribes', async () => {
      const { stored } = withNotifier();
      const phone = new FakeConnection('dev1');
      expect(await hub.request(phone, { kind: 'push-key' })).toEqual({ key: 'VAPID-KEY' });
      await hub.request(phone, { kind: 'push-subscribe', ...subscription });
      await hub.request(phone, { kind: 'push-unsubscribe' });
      expect(stored).toEqual([
        ['dev1', subscription],
        ['dev1', null],
      ]);
    });

    it('tells a phone that notifications need a relay when this agent has none', async () => {
      const phone = new FakeConnection();
      const message = 'notifications need a relay: start the agent with REMOTE_SHEEP_RELAY';
      await expect(hub.request(phone, { kind: 'push-key' })).rejects.toThrow(message);
      await expect(hub.request(phone, { kind: 'push-subscribe', ...subscription })).rejects.toThrow(
        message,
      );
    });
  });
});
