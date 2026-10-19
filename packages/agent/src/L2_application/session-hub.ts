// The core: keeps every phone up to date and carries its orders to the agents.
//
// Phones never poll. The monitor asks the multiplexer for the session list on
// one shared timer, while a phone is connected or a notifier listens, and the
// hub watches the transcript of each session somebody is looking at. A phone
// hears about a change only when something actually changed.

import type {
  AgentKind,
  ImageResult,
  Request,
  ServerMessage,
  Session,
} from '@remote-sheep/protocol';
import type { ShellSetting } from '../L1_domain/ports/shell-setting';
import type { Multiplexer } from '../L1_domain/ports/multiplexer';
import type { Chat, TranscriptSource } from '../L1_domain/ports/transcript';
import type { Connection, ConnectionEvents } from '../L1_domain/ports/connection';
import type { Notifier } from '../L1_domain/ports/notifier';
import type { UploadStore } from '../L1_domain/ports/upload-store';
import type { PairingService } from './pairing-service';
import type { PushNotifier } from './push-notifier';
import { SessionMonitor } from './session-monitor';

/** The paired phones as the hub serves and pushes them; `PairingService` provides them. */
export type LinkedDevices = Pick<PairingService, 'linkedDevices' | 'unlink' | 'onDevicesChanged'>;

/** The opt-in side of push notifications; `PushNotifier` provides it. */
export type PushSubscriptions = Pick<PushNotifier, 'publicKey' | 'subscribe' | 'unsubscribe'>;

export interface HubOptions {
  multiplexer: Multiplexer;
  transcripts: TranscriptSource;
  uploads: UploadStore;
  devices: LinkedDevices;
  listIntervalMs: number;
  terminalIntervalMs: number;
  /** One append often fires several file events; they are folded into one read. */
  debounceMs: number;
  /**
   * Whether phones may see and start plain shells. On at first; the owner can turn it off from
   * the app, because a shell runs any command on this computer, not only what a coding agent would.
   */
  shells: ShellSetting;
  /** When set, the session list is watched even with no phone connected. */
  notifier?: Notifier;
  /** Absent when this agent cannot send push (no relay); phones asking to subscribe are told why. */
  push?: PushSubscriptions;
  log?: (message: string) => void;
}

/** What one phone looks at: the chat, the raw terminal, or both side by side (split view). */
interface Viewer {
  target: string | null;
  chat: boolean;
  terminal: boolean;
}

interface ChatWatch {
  file: string | null;
  note: string | null;
  stop: (() => void) | null;
  timer: ReturnType<typeof setTimeout> | null;
  /** Set while the file is being looked for, so two phones do not both look. */
  attaching: Promise<void> | null;
  last: { chat: Chat; json: string } | null;
}

export class SessionHub implements ConnectionEvents {
  private readonly viewers = new Map<Connection, Viewer>();
  private readonly chats = new Map<string, ChatWatch>();
  private readonly terminals = new Map<string, string>();
  private readonly monitor: SessionMonitor;
  private terminalTimer: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly options: HubOptions) {
    this.monitor = new SessionMonitor({
      multiplexer: { listSessions: () => this.listPanes() },
      intervalMs: options.listIntervalMs,
      notifier: options.notifier && {
        // A phone with the chat open shows the change itself; only the others are told.
        notify: (change) => {
          if (!this.isChatWatched(change.session.target)) options.notifier?.notify(change);
        },
      },
      log: options.log,
      events: {
        sessions: (sessions) => this.broadcast((c) => c.send({ type: 'sessions', sessions })),
        status: (herdrError) => this.broadcast((c) => c.send({ type: 'status', herdrError })),
        refreshed: () => this.followTranscripts(),
      },
    });
    if (options.notifier) this.monitor.start();
    // For the agent's lifetime: the hub and the pairing service live and die
    // together. pushDevices logs its own failures, so nothing waits for it.
    options.devices.onDevicesChanged(() => void this.pushDevices());
  }

  // ---- ConnectionEvents ----

  open(connection: Connection): void {
    this.viewers.set(connection, { target: null, chat: false, terminal: false });
    if (this.monitor.known()) {
      connection.send({ type: 'sessions', sessions: this.reachable() });
    }
    const herdrError = this.monitor.error();
    if (herdrError !== null) connection.send({ type: 'status', herdrError });
    this.monitor.start();
  }

  close(connection: Connection): void {
    this.viewers.delete(connection);
    this.reconcile();
    if (this.viewers.size === 0 && !this.options.notifier) this.stop();
  }

  async request(connection: Connection, request: Request): Promise<unknown> {
    switch (request.kind) {
      case 'watch':
        return this.watch(
          connection,
          request.target,
          request.terminal,
          request.chat ?? !request.terminal,
        );
      case 'prompt':
        return this.options.multiplexer.sendPrompt(
          this.requireSession(request.target),
          request.text,
        );
      case 'keys':
        return this.options.multiplexer.sendKeys(this.requireSession(request.target), request.keys);
      case 'image':
        return this.image(request.target, request.id);
      case 'upload':
        return this.options.uploads.save(request.media, request.data);
      case 'devices':
        return this.options.devices.linkedDevices(connection.device);
      case 'unlink':
        return this.options.devices.unlink(request.id);
      case 'push-key':
        return { key: this.requirePush().publicKey };
      case 'push-subscribe':
        return this.requirePush().subscribe(connection.device, {
          endpoint: request.endpoint,
          p256dh: request.p256dh,
          auth: request.auth,
        });
      case 'push-unsubscribe':
        return this.requirePush().unsubscribe(connection.device);
      case 'spaces':
        return this.options.multiplexer.listSpaces();
      case 'shells':
        if (request.on !== undefined) {
          await this.options.shells.set(request.on);
          // The cached list still holds the shells until the next poll; phones are told now.
          this.broadcast((c) => c.send({ type: 'sessions', sessions: this.reachable() }));
        }
        return { on: this.options.shells.enabled() };
      case 'new-session':
        return this.newSession(request.space, request.shell, request.agent ?? 'claude');
    }
  }

  /** Releases every timer and watcher. */
  stop(): void {
    this.monitor.stop();
    if (this.terminalTimer) clearInterval(this.terminalTimer);
    this.terminalTimer = null;
    for (const target of [...this.chats.keys()]) this.unwatchChat(target);
    this.terminals.clear();
  }

  // ---- requests ----

  private async watch(
    connection: Connection,
    target: string | null,
    terminal: boolean,
    chat: boolean,
  ) {
    const viewer = this.viewers.get(connection);
    if (!viewer) return;
    viewer.target = target;
    viewer.chat = chat;
    viewer.terminal = terminal;
    this.reconcile();
    if (!target) return;

    if (terminal) {
      // The target becomes an argument to the multiplexer, so only a session
      // it reported itself is ever passed on.
      const output = await this.options.multiplexer.readTerminal(this.requireSession(target));
      this.terminals.set(target, output);
      connection.send({ type: 'terminal', target, output });
    }
    if (!chat) return;

    const watch = this.chats.get(target);
    if (!watch) return;
    // A first look reaches every viewer of the session, this one included.
    if (watch.attaching) return watch.attaching;
    if (!watch.file && !watch.note) return this.attach(target, watch);
    if (watch.last) {
      connection.send(chatFrame(target, watch.last.chat, null));
    } else if (watch.note) {
      connection.send(chatFrame(target, { messages: [], model: null }, watch.note));
    }
  }

  private async newSession(
    space: string,
    shell: boolean,
    agent: AgentKind,
  ): Promise<{ target: string }> {
    if (shell && !this.options.shells.enabled()) {
      throw new Error('consoles are off on this computer: turn them on in the app, under Settings');
    }
    const spaces = await this.options.multiplexer.listSpaces();
    if (!spaces.some((known) => known.id === space)) throw new Error('unknown workspace: ' + space);
    const multiplexer = this.options.multiplexer;
    return {
      target: await (shell
        ? multiplexer.startShell(space)
        : multiplexer.startSession(space, agent)),
    };
  }

  /**
   * The sessions a phone may reach right now. The monitor's list is only as fresh as its last
   * poll, so shells are left out here the moment the owner turns consoles off, not a poll later.
   */
  private reachable(): Session[] {
    const shells = this.options.shells.enabled();
    return this.monitor.current().filter((session) => session.kind !== 'shell' || shells);
  }

  /** The agents, then the shells when they are allowed: one list, so each target is known once. */
  private async listPanes(): Promise<Session[]> {
    const agents = await this.options.multiplexer.listSessions();
    if (!this.options.shells.enabled()) return agents;
    return [...agents, ...(await this.options.multiplexer.listShells())];
  }

  private requirePush(): PushSubscriptions {
    if (!this.options.push) {
      throw new Error('notifications need a relay: start the agent with REMOTE_SHEEP_RELAY');
    }
    return this.options.push;
  }

  private isChatWatched(target: string): boolean {
    for (const viewer of this.viewers.values()) {
      if (viewer.target === target && viewer.chat) return true;
    }
    return false;
  }

  private requireSession(target: string): Session {
    const found = this.reachable().find((s) => s.target === target);
    if (!found) throw new Error('unknown session: ' + target);
    return found;
  }

  private async image(target: string, id: string): Promise<ImageResult> {
    const located = await this.locate(this.requireSession(target));
    const found = located.file ? this.options.transcripts.image(located.file, id) : null;
    if (!found) throw new Error('image not found');
    return found;
  }

  // ---- sessions ----

  // A session restarted with /clear writes to a new transcript, and one that
  // was not written yet may exist now, so after every list each watched
  // session is looked up again and followed to whichever file it writes now.
  private followTranscripts(): void {
    for (const [target, watch] of [...this.chats]) {
      this.attach(target, watch).catch((err: unknown) =>
        this.options.log?.('following transcript failed: ' + (err as Error).message),
      );
    }
  }

  // ---- chats ----

  /** Watches exactly the transcripts and terminals somebody is looking at. */
  private reconcile(): void {
    const chatTargets = new Set<string>();
    let terminalWanted = false;
    for (const viewer of this.viewers.values()) {
      if (!viewer.target) continue;
      if (viewer.terminal) terminalWanted = true;
      if (viewer.chat) chatTargets.add(viewer.target);
    }

    for (const target of [...this.chats.keys()]) {
      if (!chatTargets.has(target)) this.unwatchChat(target);
    }
    for (const target of chatTargets) {
      if (!this.chats.has(target)) {
        this.chats.set(target, {
          file: null,
          note: null,
          stop: null,
          timer: null,
          attaching: null,
          last: null,
        });
      }
    }

    if (terminalWanted && !this.terminalTimer) {
      this.terminalTimer = setInterval(
        () => void this.refreshTerminals(),
        this.options.terminalIntervalMs,
      );
    } else if (!terminalWanted && this.terminalTimer) {
      clearInterval(this.terminalTimer);
      this.terminalTimer = null;
      this.terminals.clear();
    }
  }

  private async locate(session: Session) {
    const pid = await this.options.multiplexer.processId(session.target);
    return this.options.transcripts.locate(pid, session.cwd);
  }

  private attach(target: string, watch: ChatWatch): Promise<void> {
    watch.attaching ??= this.find(target, watch).finally(() => {
      watch.attaching = null;
    });
    return watch.attaching;
  }

  private async find(target: string, watch: ChatWatch): Promise<void> {
    // A phone that reopens straight into a chat can ask before the first list
    // has arrived; the next refresh finds the file then.
    if (!this.monitor.known()) return;
    const session = this.reachable().find((s) => s.target === target);
    if (!session) {
      this.setNote(target, watch, 'session gone');
      return;
    }
    const located = await this.locate(session);
    // The phone may have looked away while the file was being found.
    if (this.chats.get(target) !== watch) return;

    if (located.file !== null && located.file === watch.file) return;
    this.detach(watch);
    if (located.file === null) {
      this.setNote(target, watch, located.note);
      return;
    }
    try {
      watch.stop = this.options.transcripts.watch(located.file, () => this.schedule(target));
    } catch (err) {
      // The file can vanish between finding and watching; the next refresh retries.
      this.options.log?.('watching transcript failed: ' + (err as Error).message);
      return;
    }
    watch.file = located.file;
    watch.note = null;
    this.pushChat(target);
  }

  /** Lets go of the current file, so the next one is pushed even if it reads the same. */
  private detach(watch: ChatWatch): void {
    watch.stop?.();
    if (watch.timer) clearTimeout(watch.timer);
    watch.stop = null;
    watch.timer = null;
    watch.file = null;
    watch.last = null;
  }

  private setNote(target: string, watch: ChatWatch, note: string): void {
    if (watch.note === note) return;
    watch.note = note;
    this.sendChat(target, { messages: [], model: null }, note);
  }

  private schedule(target: string): void {
    const watch = this.chats.get(target);
    if (!watch) return;
    if (watch.timer) clearTimeout(watch.timer);
    watch.timer = setTimeout(() => {
      watch.timer = null;
      this.pushChat(target);
    }, this.options.debounceMs);
  }

  private pushChat(target: string): void {
    const watch = this.chats.get(target);
    if (!watch?.file) return;
    let chat: Chat;
    try {
      chat = this.options.transcripts.read(watch.file);
    } catch (err) {
      this.options.log?.('reading transcript failed: ' + (err as Error).message);
      return;
    }
    const json = JSON.stringify(chat);
    if (watch.last?.json === json) return;
    watch.last = { chat, json };
    this.sendChat(target, chat, null);
  }

  private sendChat(target: string, chat: Chat, note: string | null): void {
    this.broadcast((c, viewer) => {
      if (viewer.target === target && viewer.chat) c.send(chatFrame(target, chat, note));
    });
  }

  private unwatchChat(target: string): void {
    const watch = this.chats.get(target);
    if (!watch) return;
    this.detach(watch);
    this.chats.delete(target);
  }

  // ---- raw terminal ----

  // A permission prompt is drawn by the CLI and never reaches the transcript,
  // so the terminal stays available. There is no file to watch, so it is the
  // one thing still read on a timer, and only while somebody has it open.
  private async refreshTerminals(): Promise<void> {
    const targets = new Set<string>();
    for (const viewer of this.viewers.values()) {
      if (viewer.target && viewer.terminal) targets.add(viewer.target);
    }
    for (const target of targets) {
      const session = this.reachable().find((s) => s.target === target);
      // Gone since the phone asked; the next list tells it so.
      if (!session) continue;
      let output: string;
      try {
        output = await this.options.multiplexer.readTerminal(session);
      } catch (err) {
        this.options.log?.('reading terminal failed: ' + (err as Error).message);
        continue;
      }
      if (this.terminals.get(target) === output) continue;
      this.terminals.set(target, output);
      this.broadcast((c, viewer) => {
        if (viewer.target === target && viewer.terminal)
          c.send({ type: 'terminal', target, output });
      });
    }
  }

  // ---- linked devices ----

  /** Each phone gets its own copy, since `current` differs from one phone to the next. */
  private async pushDevices(): Promise<void> {
    for (const connection of [...this.viewers.keys()]) {
      try {
        const devices = await this.options.devices.linkedDevices(connection.device);
        // The phone may have left while the registry was read.
        if (this.viewers.has(connection)) connection.send({ type: 'devices', devices });
      } catch (err) {
        this.options.log?.('pushing the device list failed: ' + (err as Error).message);
        return;
      }
    }
  }

  private broadcast(send: (connection: Connection, viewer: Viewer) => void): void {
    for (const [connection, viewer] of this.viewers) send(connection, viewer);
  }
}

// The model is left out rather than sent as null, so a phone from before it existed sees the
// same frame it always did.
function chatFrame(target: string, chat: Chat, note: string | null): ServerMessage {
  return {
    type: 'chat',
    target,
    messages: chat.messages,
    note,
    ...(chat.model ? { model: chat.model } : {}),
  };
}
