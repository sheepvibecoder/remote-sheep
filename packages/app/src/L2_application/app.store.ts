// What the phone knows and the rules it follows, with no DOM in sight.
//
// The view only renders this state and forwards taps to it, so a redesign
// replaces LR_render and leaves the connection, the protocol and these rules alone.

import type {
  AgentKind,
  ChatMessage,
  LinkedDevice,
  PairingOffer,
  PortState,
  RelayChange,
  RelayInfo,
  Request,
  UpdateState,
  ServerMessage,
  Session,
  Workspace,
} from '@remote-sheep/protocol';
import { checkRelaySetting } from '@remote-sheep/protocol';
import {
  byAttention,
  groupSpaces,
  matches,
  nextToAnswer,
  readsChat,
  sessionBadge,
  sessionRow,
  spaceRow,
  type Badge,
  type ListRow,
  type Space,
} from '../L1_domain/home';
import type { LinkState } from '../L1_domain/link-state';
import type { AgentConnection } from '../L1_domain/ports/agent-connection';
import type { Preferences } from '../L1_domain/ports/preferences';
import type { PushSubscriptions, PushSupport } from '../L1_domain/ports/push-subscriptions';
import type { UpdateSource } from '../L1_domain/ports/update-source';
import { isNewer } from '../L1_domain/version';
import { addressOnPort, isThisPcHost } from '../L1_domain/this-pc';
import { PALETTES, paletteId } from '../L1_domain/palette';
import { speechRate } from '../L1_domain/speech-rate';
import { isDark, THEME_KEY, THEMES, themeChoice, type ThemeChoice } from '../L1_domain/theme';
import { TEXT_SIZE_KEY, TEXT_SIZES, textSize } from '../L1_domain/text-size';
import {
  TYPEFACE_KEY,
  TYPEFACES,
  typefaceChoice,
  type TypefaceChoice,
} from '../L1_domain/typeface';
import {
  CONTEXT_WINDOW_KEY,
  CONTEXT_WINDOWS,
  contextFill,
  contextWindowChoice,
  type ContextFill,
  type ContextWindowChoice,
} from '../L1_domain/context-window';
import { composeOrder, type Order, type ReplyStyle } from '../L1_domain/order';
import {
  DEFAULT_QUICK_REPLIES,
  movedQuickReply,
  readQuickReplies,
  withQuickReply,
  withoutQuickReply,
} from '../L1_domain/quick-replies';
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
  /** Whether phones may use plain consoles, as the agent last said; null until it did. */
  shells: boolean | null;
  /** The computer's relay as the agent last said (never its access code); null until it did. */
  relay: RelayInfo | null;
  /** Why the relay could not be read or changed; null once it could. */
  relayError: string | null;
  /** The computer took the code just sent: the form forgets it. False after anything else. */
  relayCodeAccepted: boolean;
  /** What the New sheet starts: an agent, or a plain console. */
  newKind: NewKind;
  /** The workspace whose sessions the Sessions tab shows; null shows them all. */
  space: string | null;
  /** Why reading the workspaces or starting a session failed; null once one works. */
  homeError: string | null;
  /** The session the chat view shows. */
  target: string;
  /** The Terminal view is up: the raw pane alone, which the box types into. */
  showTerm: boolean;
  /** Split was picked: chat and terminal side by side while the window is wide. Kept per phone. */
  split: boolean;
  /** The half of Split the box serves: a chat order, or keystrokes into the pane. */
  side: Side;
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
  /** The one-tap orders, the person's own included. */
  quickList: string[];
  /** The accent colour, kept for the whole phone. */
  palette: string;
  /** How fast replies are read aloud, kept for the whole phone. */
  speechRate: number;
  /** The theme picked in Settings, kept for the whole phone. */
  theme: ThemeChoice;
  /** Whether the page is drawn dark: the picked theme, or the device's on Auto. */
  dark: boolean;
  /** The step of the chat text size picked in Settings, kept for the whole phone. */
  textSize: number;
  /** The family the reading text is drawn in, kept for the whole phone. */
  typeface: TypefaceChoice;
  /** The context window size picked in Settings, kept for the whole phone; Auto reads the table. */
  contextWindow: ContextWindowChoice;
  /** The phones paired with the agent, this one marked `current`. */
  devices: LinkedDevice[];
  /** Why the last device request failed; null once one works. */
  devicesError: string | null;
  /** Notifications on this phone: whether the browser can, whether they are on, why not. */
  push: { support: PushSupport; on: boolean; error: string | null };
  /** The last "check for updates" and what it found. */
  update: UpdateCheck;
  /** The computer's own agent: its version and its update from Settings → Update. */
  agentUpdate: AgentUpdate;
  /** Settings → Add a device: the last pairing the computer made, or why it could not. */
  pairing: { offer: PairingOffer | null; error: string | null };
  /** Settings → Port. */
  port: PortSettings;
}

/** The computer's port as Settings shows it, and what a change did. */
export interface PortSettings {
  /** As the computer last said; null until it did. */
  state: PortState | null;
  /** Why the port could not be read or changed; null otherwise. */
  error: string | null;
  /** What the person must know after a change; null otherwise. */
  notice: string | null;
  /** The page's new address once the computer restarted there; only for a page on this PC. */
  moveTo: string | null;
}

/**
 * The computer's update as the phone follows it: `restarting` waits for the link to come back
 * after an update; the agent answers before it restarts, so the new version is read then.
 */
export interface AgentUpdate {
  status: 'unknown' | 'idle' | 'updating' | 'restarting' | 'updated' | 'current' | 'failed';
  /** The version the computer runs, as it last said; null until it did. */
  version: string | null;
  /** Whether it runs as the Herdr plugin, the only way it can update itself; null until it said. */
  plugin: boolean | null;
  /** The version it ran before the update, while restarting and once updated. */
  from: string | null;
  /** Why it could not be read or updated; null otherwise. */
  error: string | null;
}

export type UpdateCheck =
  | { status: 'idle' | 'checking' }
  | { status: 'latest' | 'available'; version: string }
  | { status: 'failed'; error: string };

/** How an open session is shown: its chat, chat and terminal side by side, or its terminal. */
export type Layout = 'chat' | 'split' | 'term';

/** One half of the Split view. */
export type Side = 'chat' | 'term';

/** What the New sheet can start. */
export type NewKind = AgentKind | 'shell';

/** A list row with how full its session's context is, shown only while it is filling up. */
export type SessionListRow = ListRow & {
  /** `84%` once the session warns; null while it is calm or the phone never saw its tokens. */
  context: string | null;
};

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
  | 'quick'
  | 'appearance'
  | 'shells'
  | 'relay'
  | 'terminal'
  | 'devices'
  | 'profiles'
  | 'push'
  | 'update'
  | 'agent-update'
  | 'pairing'
  | 'port';

type Listener = (change: Change) => void;

/** Whatever carries a request to the agent: the open connection, in the app. */
export type Agent = Pick<AgentConnection, 'request'>;

const describe = (error: unknown) => (error instanceof Error ? error.message : String(error));

/** How often the phone reads the computer's state while it updates itself. */
const AGENT_UPDATE_POLL_MS = 3000;

/** How long a page on this PC waits for the computer to restart on its new port. */
const PORT_MOVE_DELAY_MS = 6000;

export const BAD_PORT_TEXT = 'a port is a whole number from 1024 to 65535, or auto';

const PORT_SOURCES = {
  variable: 'set by the PORT variable on the computer',
  saved: 'saved',
  picked: 'picked as free',
};

export const PORT_MOVED =
  'The computer restarts on the new port. Phones paired over its network need the new address; ' +
  'phones on the relay are unaffected.';

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
  /** True while a loop reads the computer's update, so a second one does not start. */
  private followingUpdate = false;
  /** When the phone saw each session's status change: the time a row shows and sorts by. */
  private readonly changeTimes: Map<string, number>;
  /**
   * What was typed and not sent yet, per session. One box serves every chat, so without this a
   * switch carried the text over and Enter sent it to the wrong session.
   */
  private readonly drafts = new Map<string, string>();
  /** Whether the window has room for Split; the view says so. */
  private wide = false;
  /** What Ctrl+\ goes back to when it leaves Split. */
  private beforeSplit: Layout = 'chat';
  /** Whether the device is set to dark; the view reports it, the light default until it does. */
  private deviceDark = false;
  /**
   * The last used tokens and model each session's chat frame named. The agent reads them only for
   * the open chat, so a list row shows the last value this phone saw for that session.
   */
  private readonly contexts = new Map<string, { used: number; model: string | null }>();
  /** The id the agent knows this browser by, from its last `ready`; null until then. */
  private device: string | null = null;

  constructor(
    private readonly preferences: Preferences,
    private readonly push: PushSubscriptions,
    private readonly now: () => number = () => Date.now(),
    /**
     * What belongs to the phone rather than to one computer (the accent, the reading speed,
     * the theme, the text size and typeface):
     * kept under the plain keys every phone already has, so no choice is lost to the profiles.
     */
    private readonly phone: Preferences = preferences,
  ) {
    this.lastStatus = readMap(preferences, 'statuses', isText);
    this.unreadCounts = readMap(preferences, 'unread', isCount);
    this.changeTimes = readMap(preferences, 'changed', isCount);
    const styles = readStyles(preferences.getItem('replyStyles'));
    const theme = themeChoice(phone.getItem(THEME_KEY));
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
      newKind: 'claude',
      shells: null,
      relay: null,
      relayError: null,
      relayCodeAccepted: false,
      agentUpdate: { status: 'unknown', version: null, plugin: null, from: null, error: null },
      homeError: null,
      target: preferences.getItem('target') || '',
      showTerm: false,
      split: phone.getItem('layout') === 'split',
      side: 'chat',
      messages: [],
      note: null,
      model: null,
      terminal: '',
      pending: null,
      styles,
      replyStyle: replyStyle(styles, preferences.getItem('replyStyle')),
      quickReplies: preferences.getItem('quickReplies') !== '0',
      quickList: readQuickReplies(preferences.getItem('quickList')),
      palette: paletteId(phone.getItem('palette')),
      speechRate: speechRate(phone.getItem('rate')),
      theme,
      dark: isDark(theme, false),
      textSize: textSize(phone.getItem(TEXT_SIZE_KEY)),
      typeface: typefaceChoice(phone.getItem(TYPEFACE_KEY)),
      contextWindow: contextWindowChoice(phone.getItem(CONTEXT_WINDOW_KEY)),
      devices: [],
      devicesError: null,
      push: { support: push.support(), on: false, error: null },
      update: { status: 'idle' },
      pairing: { offer: null, error: null },
      port: { state: null, error: null, notice: null, moveTo: null },
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
        // A session reopened before the first list was opened as a chat; it may have only a
        // terminal.
        if (state.view === 'chat' && !state.showTerm && this.currentSession() && !this.hasChat()) {
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
        // Kept whatever chat is on screen: the frame names its own session, and a frame without
        // tokens means the agent no longer knows them, so the old value would mislead.
        if (message.usedTokens === undefined) this.contexts.delete(message.target);
        else
          this.contexts.set(message.target, {
            used: message.usedTokens,
            model: message.model ?? null,
          });
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
        if (message.target !== state.target || !this.termShown()) return;
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
    // A shell, or an agent whose transcript cannot be read, has only its terminal to show.
    if (this.currentSession() && !this.hasChat()) state.showTerm = true;
    state.side = 'chat';
    this.clearThread();
    this.emit('view');
  }

  setDraft(target: string, text: string): void {
    if (text) this.drafts.set(target, text);
    else this.drafts.delete(target);
  }

  draft(target: string): string {
    return this.drafts.get(target) ?? '';
  }

  /**
   * An order reached `target`: its draft is spent. True when that chat is still the open one, so
   * the box empties; a chat opened while the order travelled keeps what it holds.
   */
  orderSent(target: string): boolean {
    this.drafts.delete(target);
    return target === this.state.target;
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

  /** Reads whether consoles are allowed; a failure keeps its reason in homeError. */
  async loadShells(agent: Agent): Promise<void> {
    await this.askShells(agent, { kind: 'shells' });
  }

  /** Allows or forbids consoles on the computer; the answer of the agent is what shows. */
  async setShells(agent: Agent, on: boolean): Promise<void> {
    await this.askShells(agent, { kind: 'shells', on });
  }

  private async askShells(agent: Agent, request: Extract<Request, { kind: 'shells' }>) {
    try {
      this.state.shells = (await agent.request(request)).on;
      this.state.homeError = null;
      // A Console the sheet no longer offers must not stay picked: back to its default.
      if (!this.newKinds().includes(this.state.newKind)) this.state.newKind = 'claude';
    } catch (error) {
      this.state.homeError = describe(error);
    }
    this.emit('shells');
  }

  /** Reads the computer's relay for Settings. */
  async loadRelay(agent: Agent): Promise<void> {
    await this.askRelay(agent);
  }

  /** Has the computer use this relay at once; one it cannot use is refused here, with why. */
  async setRelay(agent: Agent, url: string, code: string): Promise<void> {
    const checked = checkRelaySetting(url, code);
    if (!checked.ok) {
      this.state.relayError = checked.error;
      this.state.relayCodeAccepted = false;
      this.emit('relay');
      return;
    }
    await this.askRelay(agent, { url: checked.setting.url, code: checked.setting.code });
  }

  /** Has the computer drop its relay and forget it; it then serves its own network only. */
  async turnRelayOff(agent: Agent): Promise<void> {
    await this.askRelay(agent, { off: true });
  }

  private async askRelay(agent: Agent, set?: RelayChange) {
    try {
      this.state.relay = await agent.request(set ? { kind: 'relay', set } : { kind: 'relay' });
      this.state.relayError = null;
      this.state.relayCodeAccepted = set !== undefined && 'code' in set;
    } catch (error) {
      this.state.relayError = describe(error);
      this.state.relayCodeAccepted = false;
    }
    this.emit('relay');
  }

  /**
   * Settings → Add a device: asks the computer for a new pairing (relay link first, and its QR
   * code). It voids the one shown before, so only the newest QR pairs.
   */
  async addDevice(agent: Agent): Promise<void> {
    try {
      this.state.pairing = { offer: await agent.request({ kind: 'pairing' }), error: null };
    } catch (error) {
      this.state.pairing = { offer: null, error: describe(error) };
    }
    this.emit('pairing');
  }

  /**
   * The port as Settings says it: where it comes from and why it cannot change; while the
   * computer restarts, where it is going, since the port it still names is the one it leaves.
   */
  portLine(): string {
    const { state, notice } = this.state.port;
    if (state === null) return 'Checking…';
    const line = state.restarting
      ? 'Moving to ' + (state.saved === null ? 'a free port' : String(state.saved)) + '…'
      : String(state.port) +
        ' — ' +
        PORT_SOURCES[state.source] +
        (state.reason === null ? '' : '. ' + state.reason);
    return notice ? line + ' ' + notice : line;
  }

  /** The id the agent knows this browser by; the link says it on every ready. */
  setThisDevice(id: string): void {
    this.device = id;
  }

  thisDevice(): string | null {
    return this.device;
  }

  /** Reads the computer's port for Settings. */
  async loadPort(agent: Agent): Promise<void> {
    const port = this.state.port;
    try {
      port.state = await agent.request({ kind: 'port' });
      port.error = null;
    } catch (error) {
      port.error = describe(error);
    }
    this.emit('port');
  }

  /**
   * Has the computer move to another port (a number, or `auto` for a free one) and restart there.
   * The computer checks the range and that the port is free. A page opened on this PC follows
   * it to the new address once it had time to restart; phones keep the address they have.
   */
  async setPort(
    agent: Agent,
    text: string,
    page: { protocol: string; hostname: string },
    delayMs = PORT_MOVE_DELAY_MS,
  ): Promise<void> {
    const port = this.state.port;
    const wanted = text.trim().toLowerCase();
    const set = wanted === 'auto' ? 'auto' : /^\d+$/.test(wanted) ? Number(wanted) : null;
    port.notice = null;
    port.moveTo = null;
    if (set === null) {
      port.error = BAD_PORT_TEXT;
      this.emit('port');
      return;
    }
    let answer: PortState;
    try {
      answer = await agent.request({ kind: 'port', set });
    } catch (error) {
      port.error = describe(error);
      this.emit('port');
      return;
    }
    port.state = answer;
    port.error = null;
    port.notice = answer.restarting ? PORT_MOVED : null;
    this.emit('port');
    if (!answer.restarting || answer.saved === null || !isThisPcHost(page.hostname)) return;
    // The new address is another origin, with its own storage: the page pairs there as a new
    // device. So this one is forgotten now, before the agent restarts, and the list shows one
    // browser. If it fails, the old device expires by itself as any unused pairing does.
    const device = this.device;
    if (device !== null) {
      await agent.request({ kind: 'unlink', id: device }).catch(() => undefined);
    }
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    port.moveTo = addressOnPort(page, answer.saved);
    this.emit('port');
  }

  /** The kinds the New sheet offers: Console only while consoles are not turned off. */
  newKinds(): NewKind[] {
    return this.state.shells === false ? ['claude', 'codex'] : ['claude', 'codex', 'shell'];
  }

  /** Picks what the New sheet starts; a kind it does not offer is refused. */
  setNewKind(kind: NewKind): void {
    if (!this.newKinds().includes(kind)) return;
    this.state.newKind = kind;
    this.emit('home');
  }

  /** Starts the kind picked in the sheet, or the one a shortcut names (not remembered), and opens it. */
  async newSession(agent: Agent, space: string, kind = this.state.newKind): Promise<void> {
    const shell = kind === 'shell';
    try {
      const request: Extract<Request, { kind: 'new-session' }> = shell
        ? { kind: 'new-session', space, shell }
        : { kind: 'new-session', space, shell, agent: kind };
      const { target } = await agent.request(request);
      this.state.homeError = null;
      this.openChat(target);
      // Not listed yet, so openChat could not tell it has no chat to read.
      if ((shell || !readsChat(kind)) && !this.state.showTerm) this.toggleTerminal();
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
    // Unlisted yet, the session may still turn out to have a chat, so the way back stays open.
    if (this.state.showTerm && this.currentSession() && !this.hasChat()) return;
    this.state.showTerm = !this.state.showTerm;
    this.state.terminal = '';
    this.emit('view');
  }

  /** The window got wide enough for Split, or too narrow for it: a narrow one shows the chat. */
  setWide(wide: boolean): void {
    if (this.wide === wide) return;
    const before = this.termShown();
    this.wide = wide;
    if (this.termShown() !== before) this.state.terminal = '';
    this.emit('view');
  }

  /** Whether the open session can be shown in Split: a wide window and a chat to show. */
  offersSplit(): boolean {
    return this.wide && this.state.view === 'chat' && this.mayHaveChat();
  }

  /** What the open session shows; Split falls back to the chat while it cannot be offered. */
  layout(): Layout {
    if (this.state.showTerm) return 'term';
    return this.state.split && this.offersSplit() ? 'split' : 'chat';
  }

  /**
   * Picks the layout from the switch. Split is refused where it is not offered, and the chat of
   * a session without one, like the toggle refuses it; only Split is remembered, for the phone.
   */
  setLayout(layout: Layout): void {
    const state = this.state;
    if (layout === 'split' && !this.offersSplit()) return;
    if (layout === 'chat' && !this.mayHaveChat()) return;
    const was = this.layout();
    if (layout === was) return;
    if (layout === 'split') {
      this.beforeSplit = was;
      state.side = 'chat';
    }
    state.split = layout === 'split';
    this.phone.setItem('layout', state.split ? 'split' : 'chat');
    state.showTerm = layout === 'term';
    state.terminal = '';
    this.emit('view');
  }

  /** Ctrl+\: into Split, or back to the layout it was entered from. */
  toggleSplit(): void {
    this.setLayout(this.layout() === 'split' ? this.beforeSplit : 'split');
  }

  /** A tap on one half of Split: the box then serves that half. */
  setSide(side: Side): void {
    if (this.layout() !== 'split' || this.state.side === side) return;
    this.state.side = side;
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

  /** Adds a quick reply (no place) or edits one; false when it is empty, repeated or one too many. */
  saveQuick(place: number | null, words: string): boolean {
    const list = withQuickReply(this.state.quickList, place, words);
    if (!list) return false;
    this.keepQuick(list);
    return true;
  }

  removeQuick(place: number): void {
    this.keepQuick(withoutQuickReply(this.state.quickList, place));
  }

  /** Moves a reply one place up (-1) or down (1); the first cannot go up nor the last down. */
  moveQuick(place: number, step: -1 | 1): void {
    const list = movedQuickReply(this.state.quickList, place, step);
    if (list) this.keepQuick(list);
  }

  resetQuick(): void {
    this.keepQuick([...DEFAULT_QUICK_REPLIES]);
  }

  private keepQuick(list: string[]): void {
    this.state.quickList = list;
    this.preferences.setItem('quickList', JSON.stringify(list));
    this.emit('quick');
  }

  /** Picks an accent; one that is not on offer changes nothing. */
  setPalette(id: string): void {
    if (!PALETTES.some((palette) => palette.id === id)) return;
    this.state.palette = id;
    this.phone.setItem('palette', id);
    this.emit('appearance');
  }

  /** Picks a reading speed; one that is not on offer falls to Normal, like a stored one would. */
  setSpeechRate(rate: number): void {
    this.state.speechRate = speechRate(String(rate));
    this.phone.setItem('rate', String(this.state.speechRate));
    this.emit('appearance');
  }

  /** Picks a theme; one that is not on offer changes nothing. */
  setTheme(id: string): void {
    const theme = THEMES.find((candidate) => candidate.id === id);
    if (!theme) return;
    this.state.theme = theme.id;
    this.phone.setItem(THEME_KEY, theme.id);
    this.drawTheme();
  }

  /** Flips to the other of Light and Dark from what is on screen, leaving Auto. */
  toggleTheme(): void {
    this.setTheme(this.state.dark ? 'light' : 'dark');
  }

  /** What the device asks for (`prefers-color-scheme`), which Auto follows as it changes. */
  setDeviceDark(dark: boolean): void {
    this.deviceDark = dark;
    if (isDark(this.state.theme, dark) !== this.state.dark) this.drawTheme();
  }

  private drawTheme(): void {
    this.state.dark = isDark(this.state.theme, this.deviceDark);
    this.emit('appearance');
  }

  /** Picks a text size by its step; one that is not on offer changes nothing. */
  setTextSize(step: number): void {
    if (!TEXT_SIZES.some((size) => size.step === step)) return;
    this.state.textSize = step;
    this.phone.setItem(TEXT_SIZE_KEY, String(step));
    this.emit('appearance');
  }

  /** Picks the context window size; one that is not on offer changes nothing. */
  setContextWindow(id: string): void {
    const choice = CONTEXT_WINDOWS.find((candidate) => candidate.id === id);
    if (!choice) return;
    this.state.contextWindow = choice.id;
    this.phone.setItem(CONTEXT_WINDOW_KEY, choice.id);
    this.emit('appearance');
  }

  /** How full a session's context window is (the open chat's by default); null when unknown. */
  contextFill(target: string = this.state.target): ContextFill | null {
    const context = this.contexts.get(target);
    if (!context) return null;
    return contextFill(context.used, context.model, this.state.contextWindow);
  }

  /** Picks a typeface; one that is not on offer changes nothing. */
  setTypeface(id: string): void {
    const typeface = TYPEFACES.find((candidate) => candidate.id === id);
    if (!typeface) return;
    this.state.typeface = typeface.id;
    this.phone.setItem(TYPEFACE_KEY, typeface.id);
    this.emit('appearance');
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
   * watching nothing; the view re-sends the watch on the 'view' change. What the open
   * chat settled while hidden is on screen again once the page shows, so it is read.
   */
  setVisible(visible: boolean): void {
    if (this.visible === visible) return;
    this.visible = visible;
    const { view, target } = this.state;
    if (visible && view === 'chat' && this.unreadCounts.delete(target)) this.saveCounts();
    this.emit('view');
  }

  /** What to ask the agent to stream, or null while there is no link. */
  watchRequest(): Extract<Request, { kind: 'watch' }> | null {
    const state = this.state;
    if (state.link !== 'open') return null;
    if (!this.visible) return { kind: 'watch', target: null, terminal: false };
    const target = state.view === 'chat' ? state.target : null;
    // Only Split names the chat: an agent from before it reads the terminal flag alone.
    if (this.layout() === 'split') return { kind: 'watch', target, terminal: true, chat: true };
    return { kind: 'watch', target, terminal: state.showTerm };
  }

  currentSession(): Session | undefined {
    return this.state.sessions.find((s) => s.target === this.state.target);
  }

  /** Whether the open session has a chat to show: a coding agent whose transcript is read. */
  hasChat(): boolean {
    const current = this.currentSession();
    return current?.kind === 'agent' && readsChat(current.agent);
  }

  /** An agent whose chat cannot be read yet: its terminal is shown, and the page says why. */
  chatUnavailable(): boolean {
    const current = this.currentSession();
    return this.state.view === 'chat' && current?.kind === 'agent' && !this.hasChat();
  }

  /** Unlisted yet, the session may still turn out to have a chat. */
  private mayHaveChat(): boolean {
    return !this.currentSession() || this.hasChat();
  }

  /** Whether the raw terminal is on screen: the Terminal view, or the right half of Split. */
  private termShown(): boolean {
    const layout = this.layout();
    return this.state.view === 'chat' && layout !== 'chat';
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
    return this.typesIntoPane() || this.currentSession()?.status === 'blocked';
  }

  /**
   * The numbered answers the open terminal is asking for, to offer as buttons. Only while the
   * session waits for an answer: a plain numbered list in a console or an output is no question,
   * and a tap on it would type a stray digit into the pane.
   */
  paneChoices(): PaneChoice[] {
    const asks = this.currentSession()?.status === 'blocked';
    return this.typesIntoPane() && asks ? paneChoices(this.state.terminal) : [];
  }

  /** The top of an open chat: its session's badge, kept quiet while the link is down. */
  headerBadge(): Badge | null {
    const current = this.state.view === 'chat' ? this.currentSession() : null;
    if (!current) return null;
    const badge = sessionBadge(current);
    // Nobody knows the status with the link down, so the ring must not call for attention.
    return this.state.link === 'open' ? badge : { ...badge, ring: 'idle', asks: false };
  }

  /**
   * With the raw terminal up, or the terminal half of Split picked, the box types into the pane:
   * keystrokes, not a chat order.
   */
  typesIntoPane(): boolean {
    const layout = this.layout();
    return (
      this.state.view === 'chat' &&
      (layout === 'term' || (layout === 'split' && this.state.side === 'term'))
    );
  }

  /**
   * What the send button delivers, or null when there is nothing to send. The pane gets the
   * words exactly as typed: a reply style or a photo path would break a shell command.
   * `usesPhoto` says whether the attached photo goes with it, so it is cleared only then.
   */
  orderFor(text: string, photoPath: string | null): (Order & { usesPhoto: boolean }) | null {
    const words = text.trim();
    if (this.typesIntoPane()) {
      return words ? { spoken: words, order: words, usesPhoto: false } : null;
    }
    if (!words && !photoPath) return null;
    return {
      ...composeOrder(words, this.state.replyStyle, photoPath),
      usesPhoto: photoPath !== null,
    };
  }

  /** The one-tap orders, in the chat of a coding agent: a console takes commands, not replies. */
  showsQuickReplies(): boolean {
    const { quickReplies, view } = this.state;
    return (
      quickReplies &&
      this.state.quickList.length > 0 &&
      view === 'chat' &&
      !this.typesIntoPane() &&
      !this.isShell()
    );
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
  listedRows(): SessionListRow[] {
    if (this.state.home === 'spaces') {
      return this.listedSpaces().map((space) => ({ ...spaceRow(space), context: null }));
    }
    const now = this.now();
    return this.listedSessions().map((session) => ({
      ...sessionRow(session, {
        changedAt: this.changedAt(session.target),
        unread: this.unread(session.target),
        now,
      }),
      context: this.contextTag(session.target),
    }));
  }

  /** The list tag: only a session that is filling up gets one, so a calm list stays quiet. */
  private contextTag(target: string): string | null {
    const fill = this.contextFill(target);
    return fill && fill.level !== 'ok' ? String(fill.percent) + '%' : null;
  }

  /** How many sessions have something unread, for the tab title. */
  unreadTotal(): number {
    return [...this.unreadCounts.values()].filter((count) => count > 0).length;
  }

  /**
   * The next session that asks for an answer, or null; for the Alt+↓ shortcut. It looks at every
   * agent in list order, whatever tab, space or search the list is showing.
   */
  nextToAnswer(): string | null {
    const open = this.state.view === 'chat' ? this.state.target : null;
    const agents = this.state.sessions.filter((session) => session.kind === 'agent');
    const ordered = byAttention(agents, (target) => this.changedAt(target));
    return nextToAnswer(
      ordered.map((session) => ({ key: session.target, asks: session.status === 'blocked' })),
      open,
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

  /** Reads the computer's version, and whether it can update itself, for Settings. */
  async loadAgentUpdate(agent: Agent): Promise<void> {
    await this.readAgentUpdate(agent);
    await this.followAgentUpdate(agent);
  }

  /** Whether the Update button can be used: the state is known and no update is under way. */
  canUpdateAgent(): boolean {
    const status = this.state.agentUpdate.status;
    return status !== 'unknown' && status !== 'updating' && status !== 'restarting';
  }

  /**
   * Has the computer update itself. The agent answers at once and Herdr works for minutes, so
   * the state is read every few seconds until the outcome; a new build restarts the agent, the
   * link comes back by itself, and `afterReady` reads the new version.
   */
  async updateAgent(agent: Agent): Promise<void> {
    if (!this.canUpdateAgent()) return;
    const update = this.state.agentUpdate;
    update.status = 'updating';
    update.error = null;
    this.emit('agent-update');
    try {
      const answer = await agent.request({ kind: 'update', run: true });
      update.from = answer.version;
      this.applyAgentUpdate(answer);
    } catch (error) {
      update.status = 'failed';
      update.error = describe(error);
    }
    this.emit('agent-update');
    await this.followAgentUpdate(agent);
  }

  /** Runs on every ready: after an update's restart, reads the version that runs now. */
  async afterReady(agent: Agent): Promise<void> {
    const status = this.state.agentUpdate.status;
    if (status === 'restarting' || status === 'updating') await this.loadAgentUpdate(agent);
  }

  /** Reads the state every few seconds while an update runs; one reader at a time. */
  private async followAgentUpdate(agent: Agent): Promise<void> {
    if (this.followingUpdate) return;
    this.followingUpdate = true;
    try {
      // A method, not the field: the status can change while the loop waits.
      while (this.agentUpdating()) {
        await new Promise((resolve) => setTimeout(resolve, AGENT_UPDATE_POLL_MS));
        if (!this.agentUpdating()) return;
        await this.readAgentUpdate(agent);
      }
    } finally {
      this.followingUpdate = false;
    }
  }

  private agentUpdating(): boolean {
    return this.state.agentUpdate.status === 'updating';
  }

  private async readAgentUpdate(agent: Agent): Promise<void> {
    const update = this.state.agentUpdate;
    try {
      this.applyAgentUpdate(await agent.request({ kind: 'update' }));
    } catch (error) {
      // While an update runs, a dropped link is the restart; the next ready reads what runs.
      if (update.status === 'updating' || update.status === 'restarting') {
        update.status = 'restarting';
      } else {
        update.status = 'failed';
        update.error = describe(error);
      }
    }
    this.emit('agent-update');
  }

  /** What the agent said, read against what this phone was following. */
  private applyAgentUpdate(answer: UpdateState): void {
    const update = this.state.agentUpdate;
    const following = update.status === 'updating' || update.status === 'restarting';
    update.version = answer.version;
    update.plugin = answer.plugin;
    update.error = null;
    if (!following) {
      // An update another device started is followed too; an older outcome is not news.
      if (answer.updating) {
        update.status = 'updating';
        update.from = answer.version;
      } else {
        update.status = 'idle';
      }
      return;
    }
    if (answer.outcome === 'failed') {
      update.status = 'failed';
      update.error = answer.error ?? 'the update failed';
    } else if (answer.outcome === 'current') {
      update.status = 'current';
    } else if (answer.outcome === 'updated') {
      update.status = 'restarting';
    } else if (!answer.updating) {
      // No outcome and nothing running: the agent that answers was started by the restart.
      update.status = update.from === null ? 'idle' : 'updated';
    } else {
      update.status = 'updating';
    }
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
