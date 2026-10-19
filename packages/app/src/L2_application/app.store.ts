// What the phone knows and the rules it follows, with no DOM in sight.
//
// The view only renders this state and forwards taps to it, so a redesign
// replaces LR_render and leaves the connection, the protocol and these rules alone.

import type {
  ChatMessage,
  LinkedDevice,
  Request,
  ServerMessage,
  Session,
  Workspace,
} from '@remote-sheep/protocol';
import {
  byAttention,
  groupSpaces,
  matches,
  sessionRow,
  spaceRow,
  type ListRow,
  type Space,
} from '../L1_domain/home';
import type { LinkState } from '../L1_domain/link-state';
import type { AgentConnection } from '../L1_domain/ports/agent-connection';
import type { Preferences } from '../L1_domain/ports/preferences';
import type { PushSubscriptions, PushSupport } from '../L1_domain/ports/push-subscriptions';
import type { UpdateSource } from '../L1_domain/ports/update-source';
import { isNewer } from '../L1_domain/version';
import type { ReplyStyle } from '../L1_domain/order';
import {
  DEFAULT_REPLY_STYLES,
  readStyles,
  replyStyle,
  withStyle,
  withoutStyle,
} from '../L1_domain/reply-styles';
import { chatItems, type ChatItem } from '../L1_domain/chat';
import { paneChoices, type PaneChoice } from '../L1_domain/pane-question';

/** An order shown before the transcript has caught up with it. */
export type PendingMessage = Extract<ChatMessage, { kind: 'text' }> & {
  pendingSend: true;
  /** Herdr took it; the transcript may still be catching up. */
  accepted: boolean;
};

/**
 * Why the page shows the scan screen instead of the sessions: no pairing yet, a
 * QR link that cannot be used, or a pairing the agent no longer accepts.
 */
export type Gate = 'scan' | 'invite-expired' | 'invite-invalid' | 'expired' | 'unauthorized';

/** Whether another profile's agent answered the last probe; `checking` while one runs. */
export type Reach = 'checking' | 'online' | 'offline';

/** One paired computer as the Computers screen lists it. */
export interface Profile {
  id: string;
  name: string;
  /** The profile the page is connected to; its reach is the link itself. */
  active: boolean;
  /** Unknown until a probe ran; always null for the active profile. */
  reach: Reach | null;
}

export interface AppState {
  link: LinkState;
  /** The scan screen and why it is shown; null while the phone has a pairing to use. */
  gate: Gate | null;
  sessions: Session[];
  /** Why the computer cannot reach Herdr; null while it can. */
  herdrError: string | null;
  view: 'list' | 'chat' | 'devices' | 'computers' | 'settings';
  /** Every computer this phone is paired with, in the order they were added. */
  profiles: Profile[];
  /** Which tab of the home screen is open. */
  /** Claude Code sessions, plain consoles, or the workspaces. */
  home: 'sessions' | 'consoles' | 'spaces';
  /** What the home search box holds. */
  query: string;
  /** The Herdr workspaces, as last read from the agent. */
  spaces: Workspace[];
  /** The workspace whose sessions the Sessions tab shows; null shows them all. */
  space: string | null;
  /** Why reading the workspaces or starting a session failed; null once one works. */
  homeError: string | null;
  /** The session the chat view shows. */
  target: string;
  showTerm: boolean;
  messages: ChatMessage[];
  note: string | null;
  /** The model of the open chat, as the agent names it; null when it does not say. */
  model: string | null;
  terminal: string;
  pending: PendingMessage | null;
  /** How every order asks to be answered, kept per computer. */
  replyStyle: ReplyStyle;
  /** The styles the person picks from, theirs included. */
  styles: ReplyStyle[];
  /** Whether the one-tap orders show above the message box, kept per computer. */
  quickReplies: boolean;
  /** The phones paired with the agent, this one marked `current`. */
  devices: LinkedDevice[];
  /** Why the last device request failed; null once one works. */
  devicesError: string | null;
  /** Notifications on this phone: whether the browser can, whether they are on, why not. */
  push: { support: PushSupport; on: boolean; error: string | null };
  /** The last "check for updates" and what it found. */
  update: UpdateCheck;
}

export type UpdateCheck =
  | { status: 'idle' | 'checking' }
  | { status: 'latest' | 'available'; version: string }
  | { status: 'failed'; error: string };

/** Which part of the state moved, so the page redraws only that. */
export type Change =
  | 'link'
  | 'gate'
  | 'sessions'
  | 'home'
  | 'status'
  | 'view'
  | 'chat'
  | 'styles'
  | 'terminal'
  | 'devices'
  | 'profiles'
  | 'push'
  | 'update';

type Listener = (change: Change) => void;

/** Whatever carries a request to the agent: the open connection, in the app. */
export type Agent = Pick<AgentConnection, 'request'>;

const describe = (error: unknown) => (error instanceof Error ? error.message : String(error));

/** A value per session, kept in preferences as JSON; anything unreadable starts empty. */
function readMap<T>(preferences: Preferences, key: string, valid: (value: unknown) => value is T) {
  const map = new Map<string, T>();
  try {
    const value: unknown = JSON.parse(preferences.getItem(key) ?? '{}');
    if (typeof value === 'object' && value !== null) {
      for (const [target, entry] of Object.entries(value)) if (valid(entry)) map.set(target, entry);
    }
  } catch {
    // A corrupt entry only costs the badges; start over.
  }
  return map;
}

const isText = (value: unknown): value is string => typeof value === 'string';
const isCount = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value > 0;

export class Store {
  readonly state: AppState;
  private readonly listeners = new Set<Listener>();
  /** The last reply read aloud; the history a chat opens with is never read. */
  private lastSpoken: string | null = null;
  private primed = false;
  private visible = true;
  /** The status each session had last time, remembered across visits. */
  private readonly lastStatus: Map<string, string>;
  /** Settles the person has not looked at yet, per session. */
  private readonly unreadCounts: Map<string, number>;
  /** When the phone saw each session's status change: the time a row shows and sorts by. */
  private readonly changeTimes: Map<string, number>;

  constructor(
    private readonly preferences: Preferences,
    private readonly push: PushSubscriptions,
    private readonly now: () => number = () => Date.now(),
  ) {
    this.lastStatus = readMap(preferences, 'statuses', isText);
    this.unreadCounts = readMap(preferences, 'unread', isCount);
    this.changeTimes = readMap(preferences, 'changed', isCount);
    const styles = readStyles(preferences.getItem('replyStyles'));
    this.state = {
      link: 'closed',
      gate: null,
      sessions: [],
      herdrError: null,
      view: 'list',
      profiles: [],
      home: 'sessions',
      query: '',
      spaces: [],
      space: null,
      homeError: null,
      target: preferences.getItem('target') || '',
      showTerm: false,
      messages: [],
      note: null,
      model: null,
      terminal: '',
      pending: null,
      styles,
      replyStyle: replyStyle(styles, preferences.getItem('replyStyle')),
      quickReplies: preferences.getItem('quickReplies') !== '0',
      devices: [],
      devicesError: null,
      push: { support: push.support(), on: false, error: null },
      update: { status: 'idle' },
    };
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // ---- what the agent says ----

  receive(message: ServerMessage): void {
    const state = this.state;
    switch (message.type) {
      case 'sessions':
        state.sessions = message.sessions;
        this.countSettled(message.sessions);
        this.emit('sessions');
        // A shell reopened before the first list was opened as a chat; it has only a terminal.
        if (state.view === 'chat' && !state.showTerm && this.isShell()) {
          state.showTerm = true;
          this.emit('view');
        }
        return;
      case 'status':
        state.herdrError = message.herdrError;
        this.emit('status');
        return;
      case 'devices':
        state.devices = message.devices;
        this.emit('devices');
        return;
      case 'chat': {
        if (message.target !== state.target || state.view !== 'chat' || state.showTerm) return;
        state.messages = message.messages;
        state.note = message.note;
        state.model = message.model ?? null;
        // The transcript has caught up once it carries the order we just sent.
        const pending = state.pending;
        if (
          pending &&
          state.messages.some((m) => m.kind === 'text' && m.text.startsWith(pending.text))
        ) {
          state.pending = null;
        }
        this.emit('chat');
        return;
      }
      case 'terminal':
        if (message.target !== state.target || state.view !== 'chat' || !state.showTerm) return;
        state.terminal = message.output;
        this.emit('terminal');
        return;
    }
  }

  setLink(link: LinkState): void {
    this.state.link = link;
    this.emit('link');
    // Only a new QR gets past either one, so the page goes back to the scan screen.
    if (link === 'expired' || link === 'unauthorized') this.setGate(link);
  }

  setGate(gate: Gate | null): void {
    this.state.gate = gate;
    this.emit('gate');
  }

  // ---- what the person does ----

  openChat(target: string): void {
    const state = this.state;
    if (this.unreadCounts.delete(target)) this.saveCounts();
    state.target = target;
    this.preferences.setItem('target', target);
    state.view = 'chat';
    // A shell has no transcript, so its terminal is all there is to show.
    if (this.isShell()) state.showTerm = true;
    this.clearThread();
    this.emit('view');
  }

  back(): void {
    this.state.view = 'list';
    this.state.showTerm = false;
    this.emit('view');
  }

  setHome(home: AppState['home']): void {
    this.state.home = home;
    this.emit('home');
  }

  setQuery(query: string): void {
    this.state.query = query;
    this.emit('home');
  }

  /** A space opens as its sessions: the Sessions tab, showing only that workspace. */
  openSpace(space: string): void {
    this.state.home = 'sessions';
    this.state.space = space;
    this.state.query = '';
    this.emit('home');
  }

  leaveSpace(): void {
    this.state.space = null;
    this.emit('home');
  }

  async loadSpaces(agent: Agent): Promise<void> {
    try {
      this.state.spaces = await agent.request({ kind: 'spaces' });
      this.state.homeError = null;
    } catch (error) {
      this.state.homeError = describe(error);
    }
    this.emit('home');
  }

  /** Starts a session, or a console, in this workspace and opens it. */
  async newSession(agent: Agent, space: string, shell = false): Promise<void> {
    try {
      const { target } = await agent.request({ kind: 'new-session', space, shell });
      this.state.homeError = null;
      this.openChat(target);
      // Not listed yet, so openChat could not tell it is a shell.
      if (shell && !this.state.showTerm) this.toggleTerminal();
    } catch (error) {
      this.state.homeError = describe(error);
      this.emit('home');
    }
  }

  openDevices(): void {
    this.state.view = 'devices';
    this.state.showTerm = false;
    this.emit('view');
  }

  openSettings(): void {
    this.state.view = 'settings';
    this.state.showTerm = false;
    this.emit('view');
  }

  openComputers(): void {
    this.state.view = 'computers';
    this.state.showTerm = false;
    this.emit('view');
  }

  /** The stored profiles, keeping the reach already known for each. */
  setProfiles(profiles: { id: string; name: string }[], active: string | null): void {
    const known = new Map(this.state.profiles.map((p) => [p.id, p.reach]));
    this.state.profiles = profiles.map(({ id, name }) => ({
      id,
      name,
      active: id === active,
      reach: id === active ? null : (known.get(id) ?? null),
    }));
    this.emit('profiles');
  }

  setReach(id: string, reach: Reach): void {
    const profile = this.state.profiles.find((p) => p.id === id);
    if (!profile || profile.active) return;
    profile.reach = reach;
    this.emit('profiles');
  }

  /** The name of the computer the page shows, or null before any pairing. */
  activeProfileName(): string | null {
    return this.state.profiles.find((p) => p.active)?.name ?? null;
  }

  async loadDevices(agent: Agent): Promise<void> {
    try {
      this.state.devices = await agent.request({ kind: 'devices' });
      this.state.devicesError = null;
    } catch (error) {
      this.state.devicesError = 'could not load the devices: ' + describe(error);
    }
    this.emit('devices');
  }

  /**
   * Unlinking this phone works too: the agent then closes it with 4003 and the
   * page drops to the scan gate. Returns whether the agent accepted it.
   */
  async unlink(id: string, agent: Agent): Promise<boolean> {
    const state = this.state;
    try {
      await agent.request({ kind: 'unlink', id });
    } catch (error) {
      state.devicesError = 'could not unlink ' + id + ': ' + describe(error);
      this.emit('devices');
      return false;
    }
    // The agent pushes the new list too; this only spares a moment of a stale row.
    state.devices = state.devices.filter((device) => device.id !== id);
    state.devicesError = null;
    this.emit('devices');
    return true;
  }

  /** Browser permission and subscription first, then the agent learns where to push. */
  async enablePush(agent: Agent): Promise<void> {
    const state = this.state.push;
    let subscribed = false;
    try {
      const { key } = await agent.request({ kind: 'push-key' });
      const subscription = await this.push.subscribe(key);
      subscribed = true;
      await agent.request({ kind: 'push-subscribe', ...subscription });
      state.on = true;
      state.error = null;
    } catch (error) {
      state.error = describe(error);
      // A subscription the agent never heard of would only be a stale one.
      if (subscribed) await this.push.unsubscribe().catch(() => undefined);
    }
    this.emit('push');
  }

  /** The agent forgets first: if it cannot be told, the switch stays on and says why. */
  async disablePush(agent: Agent): Promise<void> {
    const state = this.state.push;
    try {
      await agent.request({ kind: 'push-unsubscribe' });
      await this.push.unsubscribe();
      state.on = false;
      state.error = null;
    } catch (error) {
      state.error = describe(error);
    }
    this.emit('push');
  }

  /**
   * Runs on every ready: a reconnect, or a re-pair that gave this phone a new
   * device id, must leave the agent holding the subscription the browser has.
   */
  async syncPush(agent: Agent): Promise<void> {
    const state = this.state.push;
    if (state.support !== 'available') return;
    try {
      const subscription = await this.push.current();
      state.on = subscription !== null;
      if (subscription) await agent.request({ kind: 'push-subscribe', ...subscription });
      state.error = null;
    } catch (error) {
      state.error = describe(error);
    }
    this.emit('push');
  }

  toggleTerminal(): void {
    if (this.state.showTerm && this.isShell()) return;
    this.state.showTerm = !this.state.showTerm;
    this.state.terminal = '';
    this.emit('view');
  }

  beginSend(spoken: string): void {
    this.state.pending = {
      id: 'pending',
      role: 'user',
      kind: 'text',
      text: spoken,
      at: this.now(),
      pendingSend: true,
      accepted: false,
    };
    this.emit('chat');
  }

  sendAccepted(): void {
    if (!this.state.pending) return;
    this.state.pending.accepted = true;
    this.emit('chat');
  }

  setReplyStyle(id: string): void {
    this.state.replyStyle = replyStyle(this.state.styles, id);
    this.preferences.setItem('replyStyle', this.state.replyStyle.id);
    this.emit('chat');
  }

  /** Adds a style (no id) or edits one; false when the name or the prompt is empty. */
  saveStyle(id: string | null, label: string, prompt: string): boolean {
    const styles = withStyle(this.state.styles, id, label, prompt);
    if (!styles) return false;
    this.keepStyles(styles);
    return true;
  }

  removeStyle(id: string): void {
    this.keepStyles(withoutStyle(this.state.styles, id));
  }

  resetStyles(): void {
    this.keepStyles([...DEFAULT_REPLY_STYLES]);
  }

  private keepStyles(styles: ReplyStyle[]): void {
    this.state.styles = styles;
    this.preferences.setItem('replyStyles', JSON.stringify(styles));
    this.setReplyStyle(this.state.replyStyle.id);
    this.emit('styles');
  }

  setQuickReplies(on: boolean): void {
    this.state.quickReplies = on;
    this.preferences.setItem('quickReplies', on ? '1' : '0');
    this.emit('chat');
  }

  sendFailed(): void {
    this.state.pending = null;
    this.emit('chat');
  }

  // ---- derived ----

  /**
   * A locked or backgrounded page keeps its socket, so the agent would still count
   * its chat as open on screen and hold back the notification (S2). Hidden means
   * watching nothing; the view re-sends the watch on the 'view' change.
   */
  setVisible(visible: boolean): void {
    if (this.visible === visible) return;
    this.visible = visible;
    this.emit('view');
  }

  /** What to ask the agent to stream, or null while there is no link. */
  watchRequest(): Extract<Request, { kind: 'watch' }> | null {
    const state = this.state;
    if (state.link !== 'open') return null;
    if (!this.visible) return { kind: 'watch', target: null, terminal: false };
    return {
      kind: 'watch',
      target: state.view === 'chat' ? state.target : null,
      terminal: state.showTerm,
    };
  }

  currentSession(): Session | undefined {
    return this.state.sessions.find((s) => s.target === this.state.target);
  }

  /** Whether the open session is a plain shell rather than a coding agent. */
  isShell(): boolean {
    return this.currentSession()?.kind === 'shell';
  }

  /**
   * Enter, Esc, 1, 2 and ↑ answer Claude Code's menus, so they are offered only
   * while the open session waits for an answer or its raw terminal is up.
   */
  showsKeys(): boolean {
    if (this.state.view !== 'chat') return false;
    return this.state.showTerm || this.currentSession()?.status === 'blocked';
  }

  /** The numbered answers the open terminal is asking for, to offer as buttons. */
  paneChoices(): PaneChoice[] {
    const { view, showTerm, terminal } = this.state;
    return view === 'chat' && showTerm ? paneChoices(terminal) : [];
  }

  /** The one-tap orders, in the chat of a coding agent: a console takes commands, not replies. */
  showsQuickReplies(): boolean {
    const { quickReplies, view, showTerm } = this.state;
    return quickReplies && view === 'chat' && !showTerm && !this.isShell();
  }

  /** The rows of the Sessions or the Consoles tab: one kind each, so they never look alike. */
  listedSessions(): Session[] {
    const { sessions, space, query, home } = this.state;
    const kind = home === 'consoles' ? 'shell' : 'agent';
    const listed = sessions.filter(
      (session) =>
        session.kind === kind &&
        (space === null || session.space === space) &&
        (matches(session.title, query) || matches(session.project, query)),
    );
    return byAttention(listed, (target) => this.changedAt(target));
  }

  /** The rows of the open tab, with what this phone saw of each session. */
  listedRows(): ListRow[] {
    if (this.state.home === 'spaces') return this.listedSpaces().map(spaceRow);
    const now = this.now();
    return this.listedSessions().map((session) =>
      sessionRow(session, {
        changedAt: this.changedAt(session.target),
        unread: this.unread(session.target),
        now,
      }),
    );
  }

  /** When the phone last saw this session's status change, or null if it never did. */
  changedAt(target: string): number | null {
    return this.changeTimes.get(target) ?? null;
  }

  /** Whether the agent lists any console; it lists none unless its owner turned them on. */
  hasShells(): boolean {
    return this.state.sessions.some((session) => session.kind === 'shell');
  }

  listedSpaces(): Space[] {
    return groupSpaces(this.state.sessions, this.state.spaces).filter((space) =>
      matches(space.label, this.state.query),
    );
  }

  /** The name of the workspace the Sessions tab is narrowed to, or null. */
  spaceLabel(): string | null {
    const { space } = this.state;
    if (space === null) return null;
    const found = groupSpaces(this.state.sessions, this.state.spaces).find((s) => s.id === space);
    return found?.label ?? space;
  }

  /** Asks the server which version it serves now, against the one this page runs. */
  async checkForUpdate(source: UpdateSource, running: string): Promise<void> {
    this.state.update = { status: 'checking' };
    this.emit('update');
    try {
      const version = await source.latestVersion();
      this.state.update = { status: isNewer(version, running) ? 'available' : 'latest', version };
    } catch (error) {
      this.state.update = { status: 'failed', error: describe(error) };
    }
    this.emit('update');
  }

  /** How many times this session settled since its chat was last on screen. */
  unread(target: string): number {
    return this.unreadCounts.get(target) ?? 0;
  }

  // Like a messaging app's unread badge, counted on the phone: a session that
  // went from working to done or blocked while nobody looked at its chat.
  // Statuses persist, so an app opened from a notification still counts what
  // settled while it was closed.
  private countSettled(sessions: Session[]): void {
    const state = this.state;
    const live = new Set(sessions.map((s) => s.target));
    for (const session of sessions) {
      const was = this.lastStatus.get(session.target);
      this.lastStatus.set(session.target, session.status);
      if (was !== session.status) this.changeTimes.set(session.target, this.now());
      const settled =
        was === 'working' && (session.status === 'done' || session.status === 'blocked');
      const onScreen = this.visible && state.view === 'chat' && state.target === session.target;
      if (settled && !onScreen)
        this.unreadCounts.set(session.target, this.unread(session.target) + 1);
    }
    for (const map of [this.lastStatus, this.unreadCounts, this.changeTimes]) {
      for (const target of [...map.keys()]) if (!live.has(target)) map.delete(target);
    }
    this.saveCounts();
  }

  private saveCounts(): void {
    this.preferences.setItem('statuses', JSON.stringify(Object.fromEntries(this.lastStatus)));
    this.preferences.setItem('unread', JSON.stringify(Object.fromEntries(this.unreadCounts)));
    this.preferences.setItem('changed', JSON.stringify(Object.fromEntries(this.changeTimes)));
  }

  /** The chat as shown: the transcript plus an order still on its way. */
  thread(): ChatMessage[] {
    const { messages, pending } = this.state;
    return pending ? [...messages, pending] : messages;
  }

  /** The chat as the view draws it: day lines, hours, and where each order is. */
  chatItems(): ChatItem[] {
    const { messages, pending } = this.state;
    return chatItems(messages, pending, this.now());
  }

  /** The newest reply when it is one not read aloud yet; null otherwise. */
  takeNewReply(): string | null {
    const last = this.state.messages[this.state.messages.length - 1];
    if (!last) return null;
    if (!this.primed) {
      this.primed = true;
      this.lastSpoken = last.id;
      return null;
    }
    if (last.role !== 'assistant' || last.kind !== 'text' || last.id === this.lastSpoken)
      return null;
    this.lastSpoken = last.id;
    return last.text;
  }

  private clearThread(): void {
    const state = this.state;
    state.messages = [];
    state.note = null;
    state.model = null;
    state.terminal = '';
    state.pending = null;
    this.primed = false;
  }

  private emit(change: Change): void {
    for (const listener of this.listeners) listener(change);
  }
}
