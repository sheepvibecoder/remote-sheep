import { describe, expect, it } from 'vitest';
import type {
  ChatMessage,
  LinkedDevice,
  PushSubscription,
  Request,
  Session,
} from '@remote-sheep/protocol';
import type { PushSubscriptions, PushSupport } from '../../src/L1_domain/ports/push-subscriptions';
import { Store, type Agent, type Change } from '../../src/L2_application/app.store';

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

const said = (id: string, role: ChatMessage['role'], text: string): ChatMessage => ({
  id,
  role,
  kind: 'text',
  text,
});

class MemoryStorage {
  values = new Map<string, string>();
  getItem(key: string) {
    return this.values.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

const device = (id: string, current = false): LinkedDevice => ({
  id,
  pairedAt: 1,
  lastSeen: 2,
  expiresAt: 3,
  current,
});

/** Plays the agent: answers each request from `answer`, or fails with `failure`. */
class FakeAgent {
  asked: Request[] = [];
  failure: Error | null = null;
  constructor(private readonly answer?: unknown) {}
  request: Agent['request'] = async (request) => {
    this.asked.push(request);
    if (this.failure) throw this.failure;
    return this.answer as never;
  };
}

const SUB: PushSubscription = { endpoint: 'https://push.example/1', p256dh: 'P', auth: 'A' };

/** The browser: remembers one subscription, or refuses with `failure`. */
class FakePush implements PushSubscriptions {
  held: PushSubscription | null = null;
  failure: Error | null = null;
  keys: string[] = [];
  constructor(public level: PushSupport = 'available') {}
  support() {
    return this.level;
  }
  current() {
    return Promise.resolve(this.held);
  }
  subscribe(key: string) {
    this.keys.push(key);
    if (this.failure) return Promise.reject(this.failure);
    this.held = SUB;
    return Promise.resolve(SUB);
  }
  unsubscribe() {
    this.held = null;
    return Promise.resolve();
  }
}

/** An agent that answers `push-key` and records the rest. */
class PushAgent {
  asked: Request[] = [];
  failOn: string | null = null;
  request: Agent['request'] = async (request) => {
    this.asked.push(request);
    if (request.kind === this.failOn) throw new Error('notifications need a relay');
    return (request.kind === 'push-key' ? { key: 'VAPID' } : undefined) as never;
  };
}

function setup(push = new FakePush()) {
  const storage = new MemoryStorage();
  const store = new Store(storage, push);
  const changes: Change[] = [];
  store.subscribe((change) => changes.push(change));
  store.setLink('open');
  changes.length = 0;
  return { store, storage, changes, push };
}

describe('Store', () => {
  it('keeps the session list the agent pushes', () => {
    const { store, changes } = setup();
    store.receive({ type: 'sessions', sessions: [session('p1'), session('p2', 'working')] });
    expect(store.state.sessions.map((s) => s.target)).toEqual(['p1', 'p2']);
    expect(changes).toEqual(['sessions']);
  });

  it('opens a chat, remembers it, and asks the agent to stream it', () => {
    const { store, storage } = setup();
    store.receive({ type: 'sessions', sessions: [session('p1', 'working')] });
    store.openChat('p1');
    expect(store.state.view).toBe('chat');
    expect(storage.getItem('target')).toBe('p1');
    expect(store.currentSession()?.status).toBe('working');
    expect(store.watchRequest()).toEqual({ kind: 'watch', target: 'p1', terminal: false });
  });

  it('opens a shell straight on its terminal, which it cannot leave for a chat', () => {
    const { store } = setup();
    const shell: Session = { ...session('w1:s1'), kind: 'shell', status: 'unknown' };
    store.receive({ type: 'sessions', sessions: [session('p1'), shell] });
    store.openChat('w1:s1');
    expect(store.state.showTerm).toBe(true);
    expect(store.showsKeys()).toBe(true);
    expect(store.watchRequest()).toEqual({ kind: 'watch', target: 'w1:s1', terminal: true });
    store.toggleTerminal();
    expect(store.state.showTerm).toBe(true);
    store.back();
    store.openChat('p1');
    expect(store.state.showTerm).toBe(false);
  });

  it('turns a shell reopened before the first list to its terminal once the list arrives', () => {
    const { store } = setup();
    store.openChat('w1:s1');
    expect(store.state.showTerm).toBe(false);
    store.receive({
      type: 'sessions',
      sessions: [{ ...session('w1:s1'), kind: 'shell', status: 'unknown' }],
    });
    expect(store.state.showTerm).toBe(true);
    expect(store.watchRequest()).toEqual({ kind: 'watch', target: 'w1:s1', terminal: true });
  });

  it('types into the pane as written while the terminal is up, and orders the chat otherwise', () => {
    const { store } = setup();
    store.receive({ type: 'sessions', sessions: [session('p1', 'idle')] });
    store.openChat('p1');
    store.setReplyStyle('one-line');
    expect(store.typesIntoPane()).toBe(false);
    expect(store.orderFor('hola', 'C:\\up\\x.jpg')).toEqual({
      spoken: 'hola',
      order: 'hola (responde en una sola linea)\n\nImagen adjunta: C:\\up\\x.jpg',
      usesPhoto: true,
    });
    expect(store.orderFor('hola', null)?.usesPhoto).toBe(false);
    expect(store.orderFor('', 'C:\\up\\x.jpg')?.spoken).toBe('Mira esta imagen.');
    expect(store.orderFor('  ', null)).toBeNull();
    store.toggleTerminal();
    expect(store.typesIntoPane()).toBe(true);
    expect(store.orderFor('ls -la', 'C:\\up\\x.jpg')).toEqual({
      spoken: 'ls -la',
      order: 'ls -la',
      // The pane never takes the photo: it stays attached for the chat.
      usesPhoto: false,
    });
    // The photo belongs to the chat: on its own it types nothing into the pane.
    expect(store.orderFor('', 'C:\\up\\x.jpg')).toBeNull();
    store.back();
    expect(store.typesIntoPane()).toBe(false);
  });

  it('offers the answer keys only while the open session waits for one or the terminal is up', () => {
    const { store } = setup();
    store.receive({ type: 'sessions', sessions: [session('p1', 'working')] });
    expect(store.showsKeys()).toBe(false);
    store.openChat('p1');
    expect(store.showsKeys()).toBe(false);
    store.receive({ type: 'sessions', sessions: [session('p1', 'blocked')] });
    expect(store.showsKeys()).toBe(true);
    store.receive({ type: 'sessions', sessions: [session('p1', 'idle')] });
    store.toggleTerminal();
    expect(store.showsKeys()).toBe(true);
    store.back();
    expect(store.showsKeys()).toBe(false);
  });

  it('offers the numbered answers of a question the open terminal shows, and only there', () => {
    const { store } = setup();
    store.receive({ type: 'sessions', sessions: [session('p1', 'blocked')] });
    store.openChat('p1');
    const question = {
      type: 'terminal',
      target: 'p1',
      output: 'Proceed?\n ❯ 1. Yes\n   2. No\n',
    } as const;
    store.receive(question);
    expect(store.paneChoices()).toEqual([]);
    store.toggleTerminal();
    store.receive(question);
    expect(store.paneChoices().map((choice) => choice.key)).toEqual(['1', '2']);
    store.back();
    expect(store.paneChoices()).toEqual([]);
  });

  it('opens the settings screen from any view and leaves it for the list', () => {
    const { store } = setup();
    store.receive({ type: 'sessions', sessions: [session('p1', 'blocked')] });
    store.openChat('p1');
    store.toggleTerminal();
    store.openSettings();
    expect(store.state.view).toBe('settings');
    expect(store.state.showTerm).toBe(false);
    expect(store.showsKeys()).toBe(false);
    store.back();
    expect(store.state.view).toBe('list');
  });

  it('lets the person write, edit and remove reply styles, which survive a reload', () => {
    const { store, storage } = setup();
    expect(store.saveStyle(null, 'Three bullets', 'responde en 3 viñetas')).toBe(true);
    const added = store.state.styles.at(-1);
    expect(added?.label).toBe('Three bullets');
    expect(new Store(storage, new FakePush()).state.styles.at(-1)?.suffix).toBe(
      ' (responde en 3 viñetas)',
    );
    store.setReplyStyle(added?.id ?? '');
    expect(store.saveStyle(added?.id ?? '', 'Bullets', 'en viñetas')).toBe(true);
    expect(store.state.replyStyle.suffix).toBe(' (en viñetas)');
    const saved = storage.getItem('replyStyles');
    const seen: string[] = [];
    store.subscribe((change) => seen.push(change));
    expect(store.saveStyle(null, '', 'x')).toBe(false);
    expect(seen).toEqual([]);
    expect(storage.getItem('replyStyles')).toBe(saved);
    expect(new Store(storage, new FakePush()).state.replyStyle.suffix).toBe(' (en viñetas)');
    store.removeStyle(added?.id ?? '');
    expect(seen).toContain('styles');
    expect(store.state.styles.map((s) => s.id)).not.toContain(added?.id);
    expect(store.state.replyStyle.id).toBe('one-line');
    store.removeStyle('simple');
    store.resetStyles();
    expect(store.state.styles.map((s) => s.id)).toContain('simple');
  });

  it('lets the person write, edit and remove quick replies, which survive a reload', () => {
    const { store, storage } = setup();
    expect(store.state.quickList).toHaveLength(4);
    const seen: string[] = [];
    store.subscribe((change) => seen.push(change));
    expect(store.saveQuick(null, 'Haz push')).toBe(true);
    expect(store.saveQuick(0, 'Sigue')).toBe(true);
    expect(seen).toEqual(['quick', 'quick']);
    expect(new Store(storage, new FakePush()).state.quickList).toEqual([
      'Sigue',
      'Corre los tests',
      'Haz commit',
      'Explícame el cambio',
      'Haz push',
    ]);
    seen.length = 0;
    store.removeQuick(4);
    store.resetQuick();
    expect(seen).toEqual(['quick', 'quick']);
    expect(new Store(storage, new FakePush()).state.quickList).toEqual([
      'Continúa',
      'Corre los tests',
      'Haz commit',
      'Explícame el cambio',
    ]);
    seen.length = 0;
    expect(store.saveQuick(null, 'Continúa')).toBe(false);
    expect(seen).toEqual([]);
    store.removeQuick(0);
    expect(store.state.quickList[0]).toBe('Corre los tests');
  });

  it('offers no chips when every quick reply was removed', () => {
    const { store } = setup();
    store.receive({ type: 'sessions', sessions: [session('p1', 'idle')] });
    store.openChat('p1');
    expect(store.showsQuickReplies()).toBe(true);
    for (let i = 0; i < 4; i++) store.removeQuick(0);
    expect(store.showsQuickReplies()).toBe(false);
  });

  describe('updates', () => {
    const source = (answer: string | Error) => ({
      latestVersion: () =>
        answer instanceof Error ? Promise.reject(answer) : Promise.resolve(answer),
    });

    it('says whether the server has a newer version than the page runs', async () => {
      const { store, changes } = setup();
      await store.checkForUpdate(source('0.5.1'), '0.5.1');
      expect(store.state.update).toEqual({ status: 'latest', version: '0.5.1' });
      await store.checkForUpdate(source('0.6.0'), '0.5.1');
      expect(store.state.update).toEqual({ status: 'available', version: '0.6.0' });
      expect(changes).toEqual(['update', 'update', 'update', 'update']);
    });

    it('keeps the reason when the server cannot be asked', async () => {
      const { store } = setup();
      await store.checkForUpdate(source(new Error('HTTP 404')), '0.5.1');
      expect(store.state.update).toEqual({ status: 'failed', error: 'HTTP 404' });
    });
  });

  describe('unread', () => {
    it('counts a session that settled while its chat was not open, until the chat opens', () => {
      const { store } = setup();
      store.receive({ type: 'sessions', sessions: [session('p1', 'working')] });
      store.receive({ type: 'sessions', sessions: [session('p1', 'done')] });
      expect(store.unread('p1')).toBe(1);
      store.receive({ type: 'sessions', sessions: [session('p1', 'working')] });
      store.receive({ type: 'sessions', sessions: [session('p1', 'blocked')] });
      expect(store.unread('p1')).toBe(2);
      store.openChat('p1');
      expect(store.unread('p1')).toBe(0);
    });

    it('adds up what is unread across sessions, and finds the next one that needs an answer', () => {
      const { store } = setup();
      store.receive({
        type: 'sessions',
        sessions: [session('p1', 'working'), session('p2', 'idle')],
      });
      store.receive({
        type: 'sessions',
        sessions: [session('p1', 'done'), session('p2', 'blocked')],
      });
      expect(store.unreadTotal()).toBe(1);
      expect(store.nextToAnswer()).toBe('p2');
      store.setQuery('nothing matches this');
      store.setHome('spaces');
      expect(store.nextToAnswer()).toBe('p2');
      store.openChat('p2');
      expect(store.nextToAnswer()).toBeNull();
    });

    it('does not count a session settling in the chat on screen', () => {
      const { store } = setup();
      store.openChat('p1');
      store.receive({ type: 'sessions', sessions: [session('p1', 'working')] });
      store.receive({ type: 'sessions', sessions: [session('p1', 'done')] });
      expect(store.unread('p1')).toBe(0);
    });

    it('counts a session that settled while the page was hidden, even on its chat', () => {
      const { store } = setup();
      store.openChat('p1');
      store.receive({ type: 'sessions', sessions: [session('p1', 'working')] });
      store.setVisible(false);
      store.receive({ type: 'sessions', sessions: [session('p1', 'done')] });
      expect(store.unread('p1')).toBe(1);
    });

    it('remembers statuses and counts across visits, so a reopened app sees what settled', () => {
      const first = setup();
      first.store.receive({ type: 'sessions', sessions: [session('p1', 'working')] });
      const later = new Store(first.storage, new FakePush());
      later.receive({ type: 'sessions', sessions: [session('p1', 'done')] });
      expect(later.unread('p1')).toBe(1);
      expect(new Store(first.storage, new FakePush()).unread('p1')).toBe(1);
    });

    it('forgets the count of a session that is gone', () => {
      const { store } = setup();
      store.receive({ type: 'sessions', sessions: [session('p1', 'working')] });
      store.receive({ type: 'sessions', sessions: [session('p1', 'done')] });
      store.receive({ type: 'sessions', sessions: [] });
      expect(store.unread('p1')).toBe(0);
    });
  });

  describe('attention order', () => {
    /** A store whose clock the test moves by hand. */
    function clocked() {
      const clock = { now: 1000 };
      const storage = new MemoryStorage();
      const store = new Store(storage, new FakePush(), () => clock.now);
      store.setLink('open');
      return { store, storage, clock };
    }

    it('lists the sessions waiting for an answer first, then the latest change first', () => {
      const { store, clock } = clocked();
      store.receive({
        type: 'sessions',
        sessions: [session('p1', 'working'), session('p2', 'working'), session('p3', 'working')],
      });
      clock.now = 2000;
      store.receive({
        type: 'sessions',
        sessions: [session('p1', 'done'), session('p2', 'working'), session('p3', 'working')],
      });
      clock.now = 3000;
      store.receive({
        type: 'sessions',
        sessions: [session('p1', 'done'), session('p2', 'working'), session('p3', 'blocked')],
      });
      expect(store.listedSessions().map((s) => s.target)).toEqual(['p3', 'p1', 'p2']);
      expect(store.changedAt('p1')).toBe(2000);
      expect(store.changedAt('p2')).toBe(1000);
    });

    it('keeps the time of a status that did not change, and remembers it across visits', () => {
      const { store, storage, clock } = clocked();
      store.receive({ type: 'sessions', sessions: [session('p1', 'working')] });
      clock.now = 5000;
      store.receive({ type: 'sessions', sessions: [session('p1', 'working')] });
      expect(store.changedAt('p1')).toBe(1000);
      expect(new Store(storage, new FakePush(), () => 9000).changedAt('p1')).toBe(1000);
    });

    it('builds the rows of the open tab with its own clock and counts', () => {
      const { store, clock } = clocked();
      store.receive({ type: 'sessions', sessions: [session('p1', 'working')] });
      clock.now = 2000;
      store.receive({ type: 'sessions', sessions: [session('p1', 'done')] });
      expect(store.listedRows()).toEqual([
        expect.objectContaining({ key: 'p1', ring: 'done', unread: 1, line: 'Done' }),
      ]);
      store.setHome('spaces');
      expect(store.listedRows()).toEqual([
        expect.objectContaining({ key: 'w1', line: '1 session', time: '' }),
      ]);
    });

    it('forgets the time of a session that is gone', () => {
      const { store } = clocked();
      store.receive({ type: 'sessions', sessions: [session('p1', 'working')] });
      store.receive({ type: 'sessions', sessions: [] });
      expect(store.changedAt('p1')).toBeNull();
    });
  });

  describe('home', () => {
    function withSessions() {
      const ready = setup();
      ready.store.receive({
        type: 'sessions',
        sessions: [
          { ...session('p1'), title: 'odyssey', project: 'acme', space: 'w5' },
          { ...session('p2', 'blocked'), title: 'relay', project: 'remote-sheep', space: 'wF' },
          { ...session('p3'), title: 'docs', project: 'remote-sheep', space: 'wF' },
        ],
      });
      ready.changes.length = 0;
      return ready;
    }

    const WORKSPACES = [
      { id: 'w5', label: 'acme' },
      { id: 'w8', label: 'OdysseyRepo' },
      { id: 'wF', label: 'remote-sheep' },
    ];

    it('lists every session under Sessions until a search narrows them', () => {
      const { store, changes } = withSessions();
      expect(store.state.home).toBe('sessions');
      expect(store.listedSessions().map((s) => s.target)).toEqual(['p2', 'p1', 'p3']);
      store.setQuery('REMOTE');
      expect(store.listedSessions().map((s) => s.target)).toEqual(['p2', 'p3']);
      expect(changes).toEqual(['home']);
    });

    it('lists the Herdr workspaces under Spaces, empty ones included, narrowed by the search', async () => {
      const { store } = withSessions();
      const agent = new FakeAgent(WORKSPACES);
      await store.loadSpaces(agent);
      expect(agent.asked).toEqual([{ kind: 'spaces' }]);
      store.setHome('spaces');
      expect(store.listedSpaces().map((s) => [s.label, s.count])).toEqual([
        ['acme', 1],
        ['OdysseyRepo', 0],
        ['remote-sheep', 2],
      ]);
      store.setQuery('odyssey');
      expect(store.listedSpaces().map((s) => s.id)).toEqual(['w8']);
    });

    it('opens a space as its sessions, and leaves it for all of them again', async () => {
      const { store } = withSessions();
      await store.loadSpaces(new FakeAgent(WORKSPACES));
      store.setHome('spaces');
      store.setQuery('remote');
      store.openSpace('wF');
      expect(store.state.home).toBe('sessions');
      expect(store.state.query).toBe('');
      expect(store.spaceLabel()).toBe('remote-sheep');
      expect(store.listedSessions().map((s) => s.target)).toEqual(['p2', 'p3']);
      store.leaveSpace();
      expect(store.spaceLabel()).toBeNull();
      expect(store.listedSessions()).toHaveLength(3);
    });

    it('starts a session in a workspace and opens its chat', async () => {
      const { store } = withSessions();
      const agent = new FakeAgent({ target: 'w8:p9' });
      await store.newSession(agent, 'w8');
      expect(agent.asked).toEqual([
        { kind: 'new-session', space: 'w8', shell: false, agent: 'claude' },
      ]);
      expect(store.state.view).toBe('chat');
      expect(store.state.target).toBe('w8:p9');
      expect(store.state.homeError).toBeNull();
    });

    it('keeps Claude Code sessions and consoles in tabs of their own', () => {
      const { store } = withSessions();
      expect(store.hasShells()).toBe(false);
      const shell = (target: string, space: string): Session => ({
        ...session(target),
        kind: 'shell',
        title: 'powershell.exe',
        space,
      });
      store.receive({
        type: 'sessions',
        sessions: [...store.state.sessions, shell('w5:s1', 'w5'), shell('wF:s2', 'wF')],
      });
      expect(store.hasShells()).toBe(true);
      expect(store.listedSessions().map((s) => s.target)).toEqual(['p2', 'p1', 'p3']);
      store.setHome('consoles');
      expect(store.listedSessions().map((s) => s.target)).toEqual(['w5:s1', 'wF:s2']);
      store.openSpace('wF');
      expect(store.listedSessions().map((s) => s.target)).toEqual(['p2', 'p3']);
      store.setHome('consoles');
      expect(store.listedSessions().map((s) => s.target)).toEqual(['wF:s2']);
    });

    it('opens a console in a workspace on its terminal', async () => {
      const { store } = withSessions();
      const agent = new FakeAgent({ target: 'w8:s9' });
      store.setNewKind('shell');
      await store.newSession(agent, 'w8');
      expect(agent.asked).toEqual([{ kind: 'new-session', space: 'w8', shell: true }]);
      expect(store.state.view).toBe('chat');
      expect(store.state.target).toBe('w8:s9');
      expect(store.watchRequest()).toEqual({ kind: 'watch', target: 'w8:s9', terminal: true });
    });

    it('starts the kind picked in the sheet, Claude Code first, and remembers it', async () => {
      const { store } = withSessions();
      expect(store.state.newKind).toBe('claude');
      store.setNewKind('codex');
      const agent = new FakeAgent({ target: 'w8:p9' });
      await store.newSession(agent, 'w8');
      expect(agent.asked).toEqual([
        { kind: 'new-session', space: 'w8', shell: false, agent: 'codex' },
      ]);
      expect(store.state.showTerm).toBe(false);
    });

    it('reads and switches whether consoles are allowed, keeping the answer of the agent', async () => {
      const { store } = withSessions();
      expect(store.state.shells).toBeNull();
      const agent = new FakeAgent({ on: true });
      await store.loadShells(agent);
      expect(store.state.shells).toBe(true);
      expect(agent.asked).toEqual([{ kind: 'shells' }]);
      const off = new FakeAgent({ on: false });
      await store.setShells(off, false);
      expect(off.asked).toEqual([{ kind: 'shells', on: false }]);
      expect(store.state.shells).toBe(false);
    });

    it('leaves the switch as it was and says why when the agent cannot change it', async () => {
      const { store } = withSessions();
      await store.loadShells(new FakeAgent({ on: true }));
      const broken = new FakeAgent();
      broken.failure = new Error('could not write settings');
      await store.setShells(broken, false);
      expect(store.state.shells).toBe(true);
      expect(store.state.homeError).toBe('could not write settings');
    });

    it('keeps the reason when the workspaces cannot be read or a session cannot start', async () => {
      const { store } = withSessions();
      const agent = new FakeAgent();
      agent.failure = new Error('unknown workspace: w404');
      await store.newSession(agent, 'w404');
      expect(store.state.view).toBe('list');
      expect(store.state.homeError).toBe('unknown workspace: w404');
      agent.failure = new Error('herdr is not running');
      await store.loadSpaces(agent);
      expect(store.state.homeError).toBe('herdr is not running');
    });
  });

  it('starts on the session the phone looked at last', () => {
    const storage = new MemoryStorage();
    storage.setItem('target', 'p7');
    expect(new Store(storage, new FakePush()).state.target).toBe('p7');
  });

  it('asks for nothing while the link is down', () => {
    const { store } = setup();
    store.setLink('closed');
    expect(store.watchRequest()).toBeNull();
  });

  it('watches nothing while the page is hidden and its real watch once visible again', () => {
    const { store, changes } = setup();
    store.openChat('p1');
    store.toggleTerminal();
    changes.length = 0;
    store.setVisible(false);
    expect(changes).toEqual(['view']);
    expect(store.watchRequest()).toEqual({ kind: 'watch', target: null, terminal: false });
    store.setVisible(true);
    expect(store.watchRequest()).toEqual({ kind: 'watch', target: 'p1', terminal: true });
  });

  it('keeps asking for nothing while hidden after the link comes back', () => {
    const { store } = setup();
    store.openChat('p1');
    store.setVisible(false);
    store.setLink('closed');
    store.setLink('open');
    expect(store.watchRequest()).toEqual({ kind: 'watch', target: null, terminal: false });
  });

  it('locks behind the scan gate when the agent ends the pairing or rejects the phone', () => {
    const { store, changes } = setup();
    expect(store.state.gate).toBeNull();
    store.setLink('expired');
    expect(store.state.gate).toBe('expired');
    expect(changes).toEqual(['link', 'gate']);
    store.setLink('unauthorized');
    expect(store.state.gate).toBe('unauthorized');
  });

  it('leaves the gate alone on an ordinary drop', () => {
    const { store, changes } = setup();
    store.setLink('closed');
    store.setLink('outdated');
    expect(store.state.gate).toBeNull();
    expect(changes).toEqual(['link', 'link']);
  });

  it('opens and closes the gate on request', () => {
    const { store, changes } = setup();
    store.setGate('scan');
    expect(store.state.gate).toBe('scan');
    store.setGate(null);
    expect(store.state.gate).toBeNull();
    expect(changes).toEqual(['gate', 'gate']);
  });

  it('goes back to the list and stops streaming the chat', () => {
    const { store } = setup();
    store.openChat('p1');
    store.toggleTerminal();
    store.back();
    expect(store.state.view).toBe('list');
    expect(store.state.showTerm).toBe(false);
    expect(store.watchRequest()).toEqual({ kind: 'watch', target: null, terminal: false });
  });

  it('ignores a chat for another session or while the terminal is shown', () => {
    const { store } = setup();
    store.openChat('p1');
    store.receive({ type: 'chat', target: 'p2', messages: [said('a', 'user', 'x')], note: null });
    expect(store.thread()).toEqual([]);
    store.toggleTerminal();
    store.receive({ type: 'chat', target: 'p1', messages: [said('a', 'user', 'x')], note: null });
    expect(store.thread()).toEqual([]);
  });

  it('shows the terminal of the open session only while it is asked for', () => {
    const { store } = setup();
    store.openChat('p1');
    store.receive({ type: 'terminal', target: 'p1', output: 'ignored' });
    expect(store.state.terminal).toBe('');
    store.toggleTerminal();
    expect(store.watchRequest()).toEqual({ kind: 'watch', target: 'p1', terminal: true });
    store.receive({ type: 'terminal', target: 'p1', output: 'prompt> ' });
    expect(store.state.terminal).toBe('prompt> ');
  });

  it('shows a sent order at once, until the transcript carries it', () => {
    const { store } = setup();
    store.openChat('p1');
    store.receive({
      type: 'chat',
      target: 'p1',
      messages: [said('a', 'user', 'hola')],
      note: null,
    });
    store.beginSend('corre los tests');
    expect(store.thread().at(-1)).toMatchObject({ text: 'corre los tests', pendingSend: true });

    store.receive({
      type: 'chat',
      target: 'p1',
      messages: [
        said('a', 'user', 'hola'),
        said('b', 'user', 'corre los tests (responde en 2 lineas como maximo)'),
      ],
      note: null,
    });
    expect(store.state.pending).toBeNull();
    expect(store.thread()).toHaveLength(2);
  });

  it('marks a sent order delivered once the agent took it, received once in the transcript', () => {
    const sentAt = new Date(2026, 9, 18, 14, 59).getTime();
    const store = new Store(new MemoryStorage(), new FakePush(), () => sentAt);
    store.setLink('open');
    store.openChat('p1');
    store.beginSend('hola');
    expect(store.chatItems().at(-1)).toMatchObject({ delivery: 'sending', time: '14:59' });
    store.sendAccepted();
    expect(store.chatItems().at(-1)).toMatchObject({ delivery: 'delivered', pending: true });
    store.receive({
      type: 'chat',
      target: 'p1',
      messages: [said('a', 'user', 'hola')],
      note: null,
    });
    expect(store.chatItems().at(-1)).toMatchObject({ key: 'a', delivery: 'received' });
  });

  it('names the model of the open chat, and forgets it when another chat opens', () => {
    const { store } = setup();
    store.openChat('p1');
    expect(store.state.model).toBeNull();
    store.receive({
      type: 'chat',
      target: 'p1',
      messages: [],
      note: null,
      model: 'claude-opus-5-5',
    });
    expect(store.state.model).toBe('claude-opus-5-5');
    store.back();
    store.openChat('p2');
    expect(store.state.model).toBeNull();
  });

  it('keeps the reply style picked for this computer, one line until one is picked', () => {
    const { store, storage } = setup();
    expect(store.state.replyStyle.id).toBe('one-line');
    store.setReplyStyle('simple');
    expect(store.state.replyStyle.label).toBe('Explain simply');
    expect(new Store(storage, new FakePush()).state.replyStyle.id).toBe('simple');
  });

  it('shows the quick replies until they are turned off, and remembers it', () => {
    const { store, storage } = setup();
    expect(store.state.quickReplies).toBe(true);
    store.setQuickReplies(false);
    expect(store.state.quickReplies).toBe(false);
    expect(new Store(storage, new FakePush()).state.quickReplies).toBe(false);
  });

  it('offers the quick replies in the chat of a coding agent only', () => {
    const { store } = setup();
    store.receive({
      type: 'sessions',
      sessions: [session('p1'), { ...session('s1'), kind: 'shell', status: 'unknown' }],
    });
    expect(store.showsQuickReplies()).toBe(false);
    store.openChat('p1');
    expect(store.showsQuickReplies()).toBe(true);
    store.toggleTerminal();
    expect(store.showsQuickReplies()).toBe(false);
    store.toggleTerminal();
    store.setQuickReplies(false);
    expect(store.showsQuickReplies()).toBe(false);
    store.setQuickReplies(true);
    store.openChat('s1');
    expect(store.showsQuickReplies()).toBe(false);
  });

  it('drops the order it showed when sending fails', () => {
    const { store } = setup();
    store.openChat('p1');
    store.beginSend('hola');
    store.sendFailed();
    expect(store.thread()).toEqual([]);
  });

  it('keeps why the agent cannot reach Herdr, until it can again', () => {
    const { store, changes } = setup();
    store.receive({ type: 'status', herdrError: 'herdr is not running' });
    expect(store.state.herdrError).toBe('herdr is not running');
    store.receive({ type: 'status', herdrError: null });
    expect(store.state.herdrError).toBeNull();
    expect(changes).toEqual(['status', 'status']);
  });

  it('hands over a new reply to read aloud once, but not the history it opened with', () => {
    const { store } = setup();
    store.openChat('p1');
    store.receive({
      type: 'chat',
      target: 'p1',
      messages: [said('a', 'assistant', 'old')],
      note: null,
    });
    expect(store.takeNewReply()).toBeNull();

    store.receive({
      type: 'chat',
      target: 'p1',
      messages: [said('a', 'assistant', 'old'), said('b', 'assistant', 'listo')],
      note: null,
    });
    expect(store.takeNewReply()).toBe('listo');
    expect(store.takeNewReply()).toBeNull();
  });

  describe('linked devices', () => {
    it('opens the device list, streams no chat there, and goes back to the sessions', () => {
      const { store, changes } = setup();
      store.openDevices();
      expect(store.state.view).toBe('devices');
      expect(store.watchRequest()).toEqual({ kind: 'watch', target: null, terminal: false });
      expect(changes).toEqual(['view']);
      store.back();
      expect(store.state.view).toBe('list');
    });

    it('keeps the list the agent answers with', async () => {
      const { store, changes } = setup();
      const agent = new FakeAgent([device('aaaa', true), device('bbbb')]);
      await store.loadDevices(agent);
      expect(agent.asked).toEqual([{ kind: 'devices' }]);
      expect(store.state.devices).toEqual([device('aaaa', true), device('bbbb')]);
      expect(store.state.devicesError).toBeNull();
      expect(changes).toEqual(['devices']);
    });

    it('keeps the list the agent pushes after a pairing or an unlink', () => {
      const { store, changes } = setup();
      store.receive({ type: 'devices', devices: [device('cccc', true)] });
      expect(store.state.devices).toEqual([device('cccc', true)]);
      expect(changes).toEqual(['devices']);
    });

    it('says why the list could not be loaded', async () => {
      const { store } = setup();
      store.receive({ type: 'devices', devices: [device('aaaa')] });
      const agent = new FakeAgent();
      agent.failure = new Error('locked');
      await store.loadDevices(agent);
      expect(store.state.devicesError).toBe('could not load the devices: locked');
      expect(store.state.devices).toEqual([device('aaaa')]);
    });

    it('unlinks a device through the agent and drops it from the list', async () => {
      const { store, changes } = setup();
      store.receive({ type: 'devices', devices: [device('aaaa', true), device('bbbb')] });
      changes.length = 0;
      const agent = new FakeAgent();
      expect(await store.unlink('bbbb', agent)).toBe(true);
      expect(agent.asked).toEqual([{ kind: 'unlink', id: 'bbbb' }]);
      expect(store.state.devices).toEqual([device('aaaa', true)]);
      expect(changes).toEqual(['devices']);
    });

    it('keeps the device and says why when the agent refuses the unlink', async () => {
      const { store } = setup();
      store.receive({ type: 'devices', devices: [device('bbbb')] });
      const agent = new FakeAgent();
      agent.failure = new Error('no paired device has the id bbbb');
      expect(await store.unlink('bbbb', agent)).toBe(false);
      expect(store.state.devices).toEqual([device('bbbb')]);
      expect(store.state.devicesError).toBe(
        'could not unlink bbbb: no paired device has the id bbbb',
      );

      // The next answer that works clears the error.
      agent.failure = null;
      await store.unlink('bbbb', agent);
      expect(store.state.devicesError).toBeNull();
    });
  });

  describe('notifications', () => {
    it('shows why the browser cannot take them', () => {
      const { store } = setup(new FakePush('install-first'));
      expect(store.state.push).toEqual({ support: 'install-first', on: false, error: null });
    });

    it('enables: asks the key, subscribes in the browser, then tells the agent', async () => {
      const { store, push, changes } = setup();
      const agent = new PushAgent();
      await store.enablePush(agent);
      expect(push.keys).toEqual(['VAPID']);
      expect(agent.asked).toEqual([
        { kind: 'push-key' },
        { kind: 'push-subscribe', endpoint: SUB.endpoint, p256dh: 'P', auth: 'A' },
      ]);
      expect(store.state.push).toMatchObject({ on: true, error: null });
      expect(changes).toContain('push');
    });

    it('shows the agent refusal and stays off when it has no relay', async () => {
      const { store, push } = setup();
      const agent = new PushAgent();
      agent.failOn = 'push-key';
      await store.enablePush(agent);
      expect(store.state.push).toEqual({
        support: 'available',
        on: false,
        error: 'notifications need a relay',
      });
      expect(push.keys).toEqual([]);
    });

    it('shows a denied permission and tells the agent nothing', async () => {
      const { store, push } = setup();
      push.failure = new Error('notification permission was denied');
      const agent = new PushAgent();
      await store.enablePush(agent);
      expect(store.state.push.error).toBe('notification permission was denied');
      expect(agent.asked).toEqual([{ kind: 'push-key' }]);
    });

    it('drops the browser subscription when the agent refuses it', async () => {
      const { store, push } = setup();
      const agent = new PushAgent();
      agent.failOn = 'push-subscribe';
      await store.enablePush(agent);
      expect(push.held).toBeNull();
      expect(store.state.push).toMatchObject({ on: false, error: 'notifications need a relay' });
    });

    it('disables: tells the agent, then unsubscribes in the browser', async () => {
      const { store, push } = setup();
      const agent = new PushAgent();
      await store.enablePush(agent);
      await store.disablePush(agent);
      expect(agent.asked.at(-1)).toEqual({ kind: 'push-unsubscribe' });
      expect(push.held).toBeNull();
      expect(store.state.push.on).toBe(false);
    });

    it('stays on when the agent cannot be told to forget it', async () => {
      const { store, push } = setup();
      const agent = new PushAgent();
      await store.enablePush(agent);
      agent.failOn = 'push-unsubscribe';
      await store.disablePush(agent);
      expect(store.state.push).toMatchObject({ on: true, error: 'notifications need a relay' });
      expect(push.held).toEqual(SUB);
    });

    it('sends a held subscription again on every ready, so the agent always has it', async () => {
      const { store, push } = setup();
      push.held = SUB;
      const agent = new PushAgent();
      await store.syncPush(agent);
      expect(agent.asked).toEqual([
        { kind: 'push-subscribe', endpoint: SUB.endpoint, p256dh: 'P', auth: 'A' },
      ]);
      expect(store.state.push.on).toBe(true);
    });

    it('syncs nothing without a subscription or where Push is unavailable', async () => {
      const agent = new PushAgent();
      await setup().store.syncPush(agent);
      const blocked = new FakePush('insecure');
      blocked.held = SUB;
      await setup(blocked).store.syncPush(agent);
      expect(agent.asked).toEqual([]);
    });

    it('reports a failed resync as text', async () => {
      const { store, push } = setup();
      push.held = SUB;
      const agent = new PushAgent();
      agent.failOn = 'push-subscribe';
      await store.syncPush(agent);
      expect(store.state.push.error).toBe('notifications need a relay');
    });
  });
});
