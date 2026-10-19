// The phone app's view: draws the store and hands taps back to it.
//
// The agent pushes every change, so nothing here polls. State and rules live
// in L2_application; this layer only touches the DOM, so a redesign replaces it
// alone. The connection arrives from the composition root as a port.

import './appearance';
import {
  createComponent,
  type ApplicationRef,
  type ComponentRef,
  type EnvironmentInjector,
} from '@angular/core';
import type { ChatMessage, Request, ResultOf, UploadResult } from '@remote-sheep/protocol';
import type { LinkState } from '../L1_domain/link-state';
import { modelLabel } from '../L1_domain/chat';
import { initials } from '../L1_domain/home';
import {
  QUICK_REPLIES,
  asksNothing,
  composeOrder,
  quickOrder,
  type Order,
} from '../L1_domain/order';
import { isFixedStyle, promptOf } from '../L1_domain/reply-styles';
import { pairFragmentFrom } from '../L1_domain/pair-link';
import type { Connect } from '../L1_domain/ports/agent-connection';
import type { PairingStore } from '../L1_domain/ports/pairing-store';
import type { PushSubscriptions } from '../L1_domain/ports/push-subscriptions';
import type { UpdateSource } from '../L1_domain/ports/update-source';
import { Store, type Change, type Gate, type Profile } from '../L2_application/app.store';
import { LinkStarter } from '../L2_application/link-starter';
import { chooseProfile, profilePreferences } from '../L2_application/profile-choice';
import { stopDictation } from './dictation';
import { $, must, say } from './dom';
import { hideEditor, markUp } from './photo-editor';
import { canScan, scanQr } from './qr-scanner';
import { renderRich } from './rich-text';
import { SessionListComponent } from './session-list/session-list.component';
import { autoSpeak, speak } from './speech';

declare const __VERSION__: string;

// There is no console to open on a phone, so a script error has to announce
// itself or it looks like a button that simply does nothing.
window.addEventListener('error', (event) => {
  alert(
    'Script error (' +
      __VERSION__ +
      ')\n\n' +
      event.message +
      '\n\n' +
      (event.filename || '') +
      ':' +
      event.lineno,
  );
});
window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason as { message?: string } | undefined;
  alert('Unhandled error (' + __VERSION__ + ')\n\n' + (reason?.message || String(event.reason)));
});

const gate = $('gate');
const gateText = $('gate-text');
const head = $('head');
const foot = $('foot');
const list = $('list');
const home = $('home');
const search = $('search', HTMLInputElement);
const spaceLeave = $('space-leave');
const homeError = $('home-error');
const newSession = $('new-session', HTMLButtonElement);
const sheet = $('sheet');
const sheetList = $('sheet-list');
const chat = $('chat');
const term = $('term');
const devices = $('devices');
const devicesOpen = $('devices-open');
const computers = $('computers');
const gateProfiles = $('gate-profiles');
const gateScan = $('gate-scan');
const profileOpen = $('profile-open');
const toast = $('toast');
const dot = $('dot');
// An <svg>, which `$` would refuse as not an HTMLElement.
const brand = must(document.querySelector<SVGSVGElement>('svg#brand'), 'svg#brand');
const nameEl = $('name');
const sub = $('sub');
const back = $('back');
const text = $('text', HTMLTextAreaElement);
const send = $('send', HTMLButtonElement);
const keys = $('keys');
const choices = $('choices');
let shownChoices = '';
const mic = $('mic', HTMLButtonElement);
const model = $('model');
const menuModel = $('menu-model');
const menu = $('menu');

// Built by `startApp`, which is where the browser's push port arrives.
let store: Store;
let state: Store['state'];
let starter: LinkStarter | null = null;

// ---- talking to the agent ----

function request<R extends Request>(body: R): Promise<ResultOf<R>> {
  const link = starter?.connection;
  if (!link) return Promise.reject(new Error('locked'));
  return link.request(body);
}

/** The store's way to the agent: the open connection, or a `locked` error without one. */
const agent = { request };

/** Tells the agent what this page is looking at. */
function watch(): void {
  const wanted = store.watchRequest();
  if (wanted) request(wanted).catch((err: unknown) => say((err as Error).message, true));
}

function onLink(next: LinkState): void {
  // `unauthorized` and `expired` lock the page through the gate.
  if (next === 'outdated') {
    say('this page and your computer run different versions; reload the page', true);
  } else if (next === 'closed') {
    say('reconnecting to your computer...', true);
  } else if (next === 'open') {
    showHerdrStatus();
  }
}

function showHerdrStatus(): void {
  if (state.herdrError) say('your computer cannot reach Herdr: ' + state.herdrError, true);
  else say('');
}

function onChange(change: Change): void {
  switch (change) {
    case 'link':
      onLink(state.link);
      renderHeader();
      if (state.view === 'computers') renderComputers();
      return;
    case 'gate':
      renderGate();
      return;
    case 'status':
      showHerdrStatus();
      return;
    case 'sessions':
      renderHeader();
      renderKeys();
      // The Consoles tab shows up with the first console the agent lists.
      if (state.view === 'list') renderHome();
      if (state.view === 'list') renderList();
      return;
    case 'home':
      renderHome();
      renderList();
      if (!sheet.classList.contains('hidden')) renderSheet();
      return;
    case 'view':
      applyView();
      renderHeader();
      if (state.view === 'list') renderList();
      if (state.view === 'devices') renderDevices();
      if (state.view === 'computers') {
        renderComputers();
        // Probes report through the store; nothing waits for them.
        void starter?.checkProfiles();
      }
      watch();
      return;
    case 'profiles':
      renderHeader();
      profileOpen.classList.toggle('hidden', state.view !== 'list' || !state.profiles.length);
      announceProfile();
      if (state.view === 'computers') renderComputers();
      if (state.gate) renderGateProfiles();
      return;
    case 'devices':
      if (state.view === 'devices') {
        renderHeader();
        renderDevices();
      }
      return;
    case 'chat':
      onChat();
      return;
    case 'styles':
      drawStyles();
      renderStyleSettings();
      return;
    case 'terminal':
      onTerminal(state.terminal);
      renderKeys();
      return;
    case 'push':
      if (state.view === 'devices') renderDevices();
      return;
    case 'update':
      onUpdate();
      return;
  }
}

// ---- views ----

function applyView(): void {
  const { view, showTerm } = state;
  list.classList.toggle('on', view === 'list');
  home.classList.toggle('hidden', view !== 'list');
  newSession.classList.toggle('hidden', view !== 'list');
  if (view !== 'list') sheet.classList.add('hidden');
  chat.classList.toggle('on', view === 'chat' && !showTerm);
  term.classList.toggle('on', view === 'chat' && showTerm);
  devices.classList.toggle('on', view === 'devices');
  computers.classList.toggle('on', view === 'computers');
  $('settings').classList.toggle('on', view === 'settings');
  // Always one tap away on the home screen, like switching accounts in a messaging app.
  profileOpen.classList.toggle('hidden', view !== 'list' || !state.profiles.length);
  foot.classList.toggle('hidden', view !== 'chat');
  back.classList.toggle('hidden', view === 'list');
  // In a chat the ⋮ holds what changes that chat; elsewhere the settings of the app.
  $('chat-menu').classList.toggle('hidden', view !== 'chat');
  $('app-menu').classList.toggle('hidden', view === 'chat');
  if (view === 'chat') renderStyles();
  const termButton = $('toggle-term');
  // A shell has no chat to switch back to.
  termButton.classList.toggle('hidden', view !== 'chat' || store.isShell());
  termButton.classList.toggle('on', showTerm);
  renderKeys();
  syncHistory(view);
}

// Android's back gesture walks the browser history, so without an entry of our
// own it leaves the app. One entry stands for "inside a chat or another screen";
// popping it goes back to the list, like a messaging app.
function syncHistory(view: typeof state.view): void {
  const inside = (history.state as { inside?: boolean } | null)?.inside === true;
  if (view !== 'list' && !inside) history.pushState({ inside: true }, '');
  else if (view === 'list' && inside) history.back();
}

window.addEventListener('popstate', () => {
  if (state.view !== 'list') store.back();
});

// ---- updates ----
// Nothing is cached, so an update is simply a reload once the server serves a
// newer build than this page runs.

let updates: UpdateSource;

$('check-update').addEventListener('click', () => {
  // The result arrives as an 'update' change; nothing else waits for it.
  void store.checkForUpdate(updates, __VERSION__);
});

function onUpdate(): void {
  const update = state.update;
  const label = $('check-update');
  switch (update.status) {
    case 'idle':
      label.textContent = 'Check for updates';
      return;
    case 'checking':
      label.textContent = 'Checking for updates...';
      return;
    case 'latest':
      label.textContent = 'Check for updates';
      say('you have the latest version (v' + update.version + ')');
      return;
    case 'failed':
      label.textContent = 'Check for updates';
      say('could not check for updates: ' + update.error, true);
      return;
    case 'available':
      label.textContent = 'Update to v' + update.version;
      if (confirm('Version ' + update.version + ' is available. Reload to update?')) {
        location.reload();
      }
      return;
  }
}

// ---- menu ----
// Settings live behind the ⋮, like WhatsApp; any tap closes it again.

$('menu-open').addEventListener('click', (event) => {
  event.stopPropagation();
  menu.classList.toggle('hidden');
});
document.addEventListener('click', (event) => {
  // A switch inside the menu stays open so its new state can be seen.
  if (
    menu.contains(event.target as Node) &&
    event.target !== devicesOpen &&
    event.target !== $('settings-open') &&
    event.target !== $('computers-open')
  )
    return;
  menu.classList.add('hidden');
});

function openChat(next: string): void {
  chat.textContent = '';
  term.textContent = '';
  store.openChat(next);
}

back.addEventListener('click', () => store.back());

$('toggle-term').addEventListener('click', () => {
  term.textContent = '';
  store.toggleTerminal();
  say(state.showTerm ? 'raw terminal' : 'chat');
});

// Every view shows the version at the bottom, so a stale page is told apart at a glance.
$('version').textContent = 'RemoteSheep v' + __VERSION__;

function renderHeader(): void {
  const { view, sessions } = state;
  const current = store.currentSession();
  const status = view === 'chat' ? current?.status || '' : '';
  dot.className = 'dot ' + (state.link === 'open' ? status : 'unknown');
  const title = must(nameEl.firstChild, '#name title');
  // The list is the home: it carries the app's name, and says which computer it shows below.
  brand.classList.toggle('hidden', view !== 'list');
  dot.classList.toggle('hidden', view === 'list');
  nameEl.classList.toggle('home', view === 'list');
  if (view === 'list') {
    title.textContent = 'RemoteSheep ';
    const profile = store.activeProfileName();
    sub.textContent =
      (profile ? profile + '  ·  ' : '') +
      (sessions.length ? sessions.length + ' running' : 'none');
  } else if (view === 'devices') {
    title.textContent = 'Devices ';
    sub.textContent = state.devices.length + ' linked';
  } else if (view === 'settings') {
    title.textContent = 'Settings ';
    sub.textContent = '';
  } else if (view === 'computers') {
    title.textContent = 'Profiles ';
    sub.textContent = state.profiles.length + ' paired';
  } else {
    title.textContent = (current ? current.title : 'gone') + ' ';
    sub.textContent = current ? (current.kind === 'shell' ? 'console' : status) : '';
    // A chat says which computer it runs on, so two profiles never look alike.
    const profile = store.activeProfileName();
    if (profile) sub.textContent += (sub.textContent ? '  ·  ' : '') + profile;
  }
}

// ---- home ----

search.addEventListener('input', () => store.setQuery(search.value));
$('tab-sessions').addEventListener('click', () => store.setHome('sessions'));
$('tab-consoles').addEventListener('click', () => store.setHome('consoles'));
$('tab-spaces').addEventListener('click', () => {
  store.setHome('spaces');
  // A failure lands in homeError; nothing else waits for the list.
  void store.loadSpaces(agent);
});
spaceLeave.addEventListener('click', () => store.leaveSpace());

function renderHome(): void {
  if (search.value !== state.query) search.value = state.query;
  search.placeholder = 'Search ' + state.home;
  $('tab-sessions').classList.toggle('on', state.home === 'sessions');
  $('tab-consoles').classList.toggle('on', state.home === 'consoles');
  $('tab-consoles').classList.toggle('hidden', !store.hasShells() && state.home !== 'consoles');
  $('tab-spaces').classList.toggle('on', state.home === 'spaces');
  const label = state.home !== 'spaces' ? store.spaceLabel() : null;
  spaceLeave.classList.toggle('hidden', label === null);
  spaceLeave.textContent = (label ?? '') + '  ×';
  homeError.classList.toggle('hidden', state.homeError === null);
  homeError.textContent = state.homeError ?? '';
}

// ---- new session ----

newSession.addEventListener('click', () => {
  sheet.classList.remove('hidden');
  renderSheet();
  // The sheet redraws on the 'home' change; a failure lands in homeError.
  void store.loadSpaces(agent);
});

sheet.addEventListener('click', (event) => {
  if (event.target === sheet) sheet.classList.add('hidden');
});

function renderSheet(): void {
  sheetList.textContent = '';
  if (!state.spaces.length) {
    const hint = document.createElement('p');
    hint.className = 'hint';
    hint.textContent = state.homeError ?? 'Reading the workspaces...';
    sheetList.append(hint);
    return;
  }
  for (const space of state.spaces) {
    const line = document.createElement('div');
    line.className = 'sheet-line';
    const row = document.createElement('button');
    row.className = 'card';
    const avatar = document.createElement('span');
    avatar.className = 'av idle';
    avatar.textContent = initials(space.label);
    const who = document.createElement('span');
    who.className = 'who';
    const title = document.createElement('span');
    title.className = 't';
    title.textContent = space.label;
    who.append(title);
    row.append(avatar, who);
    row.addEventListener('click', () => void startIn(space.id, space.label, false));
    // The agent refuses it unless its owner turned consoles on, and says how.
    const shell = document.createElement('button');
    shell.className = 'sheet-shell';
    shell.textContent = '$ console';
    shell.title = 'open a plain console in ' + space.label;
    shell.addEventListener('click', () => void startIn(space.id, space.label, true));
    line.append(row, shell);
    sheetList.append(line);
  }
}

async function startIn(space: string, label: string, shell: boolean): Promise<void> {
  sheetList.textContent = '';
  const hint = document.createElement('p');
  hint.className = 'hint';
  hint.textContent = (shell ? 'Opening a console in ' : 'Starting Claude Code in ') + label + '...';
  sheetList.append(hint);
  await store.newSession(agent, space, shell);
  sheet.classList.add('hidden');
}

/** A tap opens the chat of a session, or the sessions of a space. */
function openRow(key: string): void {
  if (state.home === 'spaces') store.openSpace(key);
  else openChat(key);
}

function emptyHint(): string {
  if (state.link !== 'open') return 'Connecting...';
  const query = state.query.trim();
  if (query) return 'Nothing matches "' + query + '".';
  return state.home === 'consoles'
    ? 'No consoles in Herdr right now.'
    : 'No agent sessions in Herdr right now.';
}

/** The Angular list, mounted on #list once the app starts. */
let listView: ComponentRef<SessionListComponent> | null = null;

function renderList(): void {
  listView?.setInput('rows', store.listedRows());
  listView?.setInput('hint', emptyHint());
}

// ---- linked devices ----
// A plain placeholder: where the list lives and how it looks is decided in the redesign.

devicesOpen.addEventListener('click', () => {
  store.openDevices();
  // The store keeps a failure in devicesError; nothing waits for the answer.
  void store.loadDevices(agent);
});

const when = (ms: number) => new Date(ms).toLocaleString();

const PUSH_UNAVAILABLE = {
  insecure: 'Open the app through the relay (https) to get notifications.',
  'install-first': 'On iPhone, add the app to the home screen first.',
  unsupported: 'This browser cannot show notifications.',
} as const;

/** The Notifications switch, or the reason there is none. */
function renderPush(): void {
  const { support, on, error } = state.push;
  const row = document.createElement('p');
  if (support === 'available') {
    const toggle = document.createElement('button');
    toggle.textContent = on ? 'Notifications: on' : 'Notifications: off';
    toggle.addEventListener('click', () => {
      // The store reports a refusal through push.error; nothing else waits.
      void (on ? store.disablePush(agent) : store.enablePush(agent));
    });
    row.append(toggle);
  } else {
    row.textContent = PUSH_UNAVAILABLE[support];
  }
  devices.append(row);
  if (error) {
    const reason = document.createElement('p');
    reason.textContent = error;
    devices.append(reason);
  }
}

function renderDevices(): void {
  devices.textContent = '';
  renderPush();
  if (state.devicesError) {
    const error = document.createElement('p');
    error.textContent = state.devicesError;
    devices.append(error);
  }
  if (!state.devices.length) {
    const hint = document.createElement('p');
    hint.textContent = 'No linked devices.';
    devices.append(hint);
  }
  for (const device of state.devices) {
    const row = document.createElement('p');
    row.textContent =
      device.id +
      (device.current ? ' (this phone)' : '') +
      ' - paired ' +
      when(device.pairedAt) +
      ', last used ' +
      when(device.lastSeen) +
      ', expires ' +
      when(device.expiresAt) +
      ' ';
    const unlink = document.createElement('button');
    unlink.textContent = 'Unlink';
    unlink.addEventListener('click', () => {
      const warning = device.current ? ' This phone will need a new QR code.' : '';
      if (!confirm('Unlink ' + device.id + '?' + warning)) return;
      // The store reports a refusal through devicesError; nothing else waits.
      void store.unlink(device.id, agent);
    });
    row.append(unlink);
    devices.append(row);
  }
}

// ---- computers: the profiles, one per paired computer ----
// A plain placeholder like the devices list; the redesign decides its place.

$('settings-open').addEventListener('click', () => {
  store.openSettings();
});
$('computers-open').addEventListener('click', () => {
  store.openComputers();
});
profileOpen.addEventListener('click', () => {
  store.openComputers();
});
gateScan.addEventListener('click', () => void scanToPair());

const REACH_TEXT = {
  checking: 'checking…',
  online: 'online',
  offline: 'offline',
} as const;

function reachText(profile: Profile): string {
  if (profile.active) return state.link === 'open' ? 'connected' : 'not connected';
  return profile.reach ? REACH_TEXT[profile.reach] : '';
}

function renderComputers(): void {
  computers.textContent = '';
  if (canScan()) {
    const scan = document.createElement('button');
    scan.textContent = 'Scan a QR code to add a computer';
    scan.addEventListener('click', () => void scanToPair());
    computers.append(scan);
  }
  for (const profile of state.profiles) {
    // The whole row switches, like picking a chat; the current one is marked.
    const row = document.createElement('button');
    row.className = 'profile' + (profile.active ? ' on' : '');
    row.textContent = (profile.active ? '✓ ' : '') + profile.name + ' - ' + reachText(profile);
    row.addEventListener('click', () => starter?.switchTo(profile.id));
    const actions = document.createElement('p');
    actions.className = 'actions';
    const rename = document.createElement('button');
    rename.textContent = 'Rename';
    rename.addEventListener('click', () => {
      const name = prompt('Name this computer', profile.name);
      // Failures reach the page through the starter's error hook.
      if (name) void starter?.rename(profile.id, name);
    });
    const remove = document.createElement('button');
    remove.textContent = 'Remove';
    remove.addEventListener('click', () => {
      if (!confirm('Remove ' + profile.name + ' from this phone? It will need a new QR code.'))
        return;
      // Failures reach the page through the starter's error hook.
      void starter?.remove(profile.id);
    });
    actions.append(rename, remove);
    computers.append(row, actions);
  }
  const hint = document.createElement('p');
  hint.textContent =
    (canScan() ? '' : 'To add a computer, scan its QR code with the phone camera. ') +
    'Profiles share this list only when the app is opened through the relay.';
  computers.append(hint);
}

/** Scans a computer's QR code and pairs with it on this page's own address. */
async function scanToPair(): Promise<void> {
  let scanned: string | null;
  try {
    scanned = await scanQr();
  } catch (error) {
    alert('Cannot open the camera: ' + (error as Error).message);
    return;
  }
  if (scanned === null) return;
  const fragment = pairFragmentFrom(scanned);
  if (!fragment) {
    alert('That is not a remote-sheep QR code.');
    return;
  }
  // The page starts over with the invite, like a QR opened from the camera app.
  location.hash = fragment;
}

// The page starts over on a switch, so whether to announce the profile survives the reload.
const ANNOUNCE = 'announce-profile';

function announceProfile(): void {
  const name = store.activeProfileName();
  if (!name || sessionStorage.getItem(ANNOUNCE) !== '1') return;
  sessionStorage.removeItem(ANNOUNCE);
  toast.textContent = 'Now on ' + name;
  toast.classList.remove('hidden');
  setTimeout(() => {
    toast.classList.add('hidden');
  }, 3000);
}

// ---- chat ----

// Screenshots are fetched only once they are about to be seen: each one is
// tens of kilobytes and most of them are never scrolled to.
const seen = new WeakSet<HTMLImageElement>();

const watcher =
  'IntersectionObserver' in window
    ? new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            watcher?.unobserve(entry.target);
            void loadImage(entry.target as HTMLImageElement);
          }
        },
        { root: chat, rootMargin: '400px' },
      )
    : null;

async function loadImage(img: HTMLImageElement): Promise<void> {
  if (seen.has(img)) return;
  seen.add(img);
  try {
    const found = await request({
      kind: 'image',
      target: state.target,
      id: must(img.dataset['id'], 'image id'),
    });
    img.src = URL.createObjectURL(
      new Blob([found.data as Uint8Array<ArrayBuffer>], { type: found.media }),
    );
    img.alt = 'screenshot';
  } catch {
    img.replaceWith(
      Object.assign(document.createElement('span'), {
        className: 'shot-failed',
        textContent: 'image unavailable',
      }),
    );
  }
}

function renderImage(bubble: HTMLElement, message: ChatMessage): void {
  bubble.textContent = '';
  const img = document.createElement('img');
  img.dataset['id'] = message.id;
  img.alt = 'loading screenshot';
  img.loading = 'lazy';
  img.addEventListener('click', () => window.open(img.src, '_blank'));
  bubble.append(img);
  if (watcher) watcher.observe(img);
  else void loadImage(img);
}

function onChat(): void {
  const atBottom = chat.scrollTop + chat.clientHeight >= chat.scrollHeight - 90;
  renderChat();
  if (state.note) say(state.note);
  if (atBottom) chat.scrollTop = chat.scrollHeight;
  const reply = store.takeNewReply();
  if (reply && autoSpeak()) speak(reply);
}

// One tick: Herdr took the order. Two: the transcript carries it.
const TICK_PATHS: Record<'delivered' | 'received', string> = {
  delivered: 'm5 13 4 4 10-11',
  received: 'm2 13 4 4 8-9M10 16l1 1 8-9',
};

function ticks(delivery: 'delivered' | 'received'): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('class', 'ticks');
  svg.setAttribute('aria-label', delivery);
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', TICK_PATHS[delivery]);
  svg.append(path);
  return svg;
}

function renderModel(): void {
  const name = modelLabel(state.model);
  model.textContent = name ?? '';
  model.classList.toggle('hidden', !name);
  menuModel.textContent = name ? 'Model · ' + name : '';
  menuModel.classList.toggle('hidden', !name);
  renderStyles();
}

// Patch item by item. Rebuilding the whole thread on every change is what
// made the first version flash.
function renderChat(): void {
  renderModel();
  const wanted = store.chatItems();
  if (!wanted.length) {
    chat.textContent = '';
    const hint = document.createElement('div');
    hint.className = 'hint';
    hint.textContent = state.note || 'Nothing said yet in this session.';
    chat.append(hint);
    return;
  }
  for (const stale of chat.querySelectorAll('.hint')) stale.remove();
  while (chat.children.length > wanted.length) chat.lastElementChild?.remove();
  wanted.forEach((item, i) => {
    let bubble = chat.children[i] as HTMLElement | undefined;
    if (!bubble) {
      bubble = document.createElement('div');
      chat.append(bubble);
    }
    if (item.kind === 'day') {
      if (bubble.dataset['stamp'] === item.key) return;
      bubble.dataset['stamp'] = item.key;
      bubble.className = 'daysep';
      bubble.dataset['raw'] = '';
      const label = document.createElement('span');
      label.textContent = item.label;
      bubble.replaceChildren(label);
      return;
    }
    const { message, time, delivery } = item;
    const body = message.kind === 'text' ? message.text : '';
    const stamp = [item.key, message.kind, body.length, time, delivery ?? ''].join(':');
    if (bubble.dataset['stamp'] === stamp) return;
    bubble.dataset['stamp'] = stamp;
    bubble.className = 'bubble ' + message.role + (delivery === 'sending' ? ' pending' : '');

    if (message.kind === 'image') {
      bubble.classList.add('shot');
      bubble.dataset['raw'] = '';
      renderImage(bubble, message);
    } else {
      bubble.dataset['raw'] = message.text;
      renderRich(bubble, message.text);
    }
    if (!time && (delivery === null || delivery === 'sending')) return;
    const meta = document.createElement('span');
    meta.className = 'meta';
    meta.textContent = time;
    if (delivery === 'delivered' || delivery === 'received') meta.append(ticks(delivery));
    bubble.append(meta);
  });
}

chat.addEventListener('click', (event) => {
  const bubble = (event.target as HTMLElement).closest<HTMLElement>('.bubble');
  const raw = bubble?.dataset['raw'];
  if (raw) speak(raw);
});

// ---- raw terminal ----

function onTerminal(value: string): void {
  const atBottom = term.scrollTop + term.clientHeight >= term.scrollHeight - 60;
  const lines = value.split('\n');
  while (term.children.length > lines.length) term.lastElementChild?.remove();
  while (term.children.length < lines.length) term.append(document.createElement('div'));
  lines.forEach((line, i) => {
    const row = must(term.children[i], 'terminal row');
    if (row.textContent !== line) row.textContent = line;
  });
  if (atBottom) term.scrollTop = term.scrollHeight;
}

// ---- footer controls ----

// The key bar and, above it, the answers of a numbered question the pane is asking.
function renderKeys(): void {
  keys.classList.toggle('hidden', !store.showsKeys());
  const offered = store.paneChoices();
  const signature = offered.map((choice) => choice.key + choice.label + choice.selected).join('|');
  choices.classList.toggle('hidden', offered.length === 0);
  if (signature === shownChoices) return;
  shownChoices = signature;
  choices.replaceChildren(
    ...offered.map((choice) => {
      const button = document.createElement('button');
      button.dataset['key'] = choice.key;
      button.classList.toggle('primary', choice.selected);
      const number = document.createElement('b');
      number.textContent = choice.key;
      button.append(number, choice.label);
      button.addEventListener('click', () => void sendKey(button));
      return button;
    }),
  );
}

const styles = $('styles');
const styleChip = $('style-chip', HTMLButtonElement);

// The chat menu lists the styles again whenever the person changes them in Settings.
function drawStyles(): void {
  styles.replaceChildren(
    ...state.styles.map((style) => {
      const option = document.createElement('button');
      option.dataset['style'] = style.id;
      option.textContent = style.label;
      option.addEventListener('click', () => {
        store.setReplyStyle(style.id);
        menu.classList.add('hidden');
      });
      return option;
    }),
  );
  renderStyles();
}
drawStyles();

// The chip says which style every order carries; tapping it opens the menu to change it.
styleChip.addEventListener('click', (event) => {
  event.stopPropagation();
  menu.classList.toggle('hidden');
});

function renderStyles(): void {
  const picked = state.replyStyle;
  for (const option of styles.querySelectorAll<HTMLElement>('button')) {
    option.classList.toggle('on', option.dataset['style'] === picked.id);
  }
  styleChip.textContent = picked.label;
  toggleQuick.classList.toggle('on', state.quickReplies);
  quick.classList.toggle('hidden', !store.showsQuickReplies());
  styleChip.classList.toggle('hidden', asksNothing(picked));
}

/** The box grows with what is written, up to a few lines, and the mic turns into send. */
function onText(): void {
  text.style.height = 'auto';
  text.style.height = Math.min(text.scrollHeight, 140) + 'px';
  // While dictating the mic stays, so the person can stop it.
  const ready = (text.value.trim() !== '' || photo !== null) && !mic.classList.contains('on');
  send.classList.toggle('hidden', !ready);
  mic.classList.toggle('hidden', ready);
}

text.addEventListener('input', onText);

// ---- photo from the phone ----
// The file is written on the PC and the order names its path, so the session
// opens it the same way it would open any file.
const photoInput = $('photo-input', HTMLInputElement);
const cameraInput = $('camera-input', HTMLInputElement);
const attached = $('attached');
const preview = $('attached-preview', HTMLImageElement);
let photo: (UploadResult & { preview: string }) | null = null;

function showAttached(): void {
  attached.classList.toggle('hidden', !photo);
  onText();
  if (!photo) {
    if (preview.src) URL.revokeObjectURL(preview.src);
    return;
  }
  preview.src = photo.preview;
  $('attached-name').textContent = photo.name + '  -  ' + Math.round(photo.bytes / 1024) + ' KB';
}

// The clip opens the gallery; the camera button goes straight to the camera.
$('photo').addEventListener('click', () => photoInput.click());
$('camera').addEventListener('click', () => cameraInput.click());

$('attached-drop').addEventListener('click', () => {
  photo = null;
  showAttached();
  say('');
});

async function attachPhoto(file: File): Promise<void> {
  let marked: Blob | null;
  try {
    // Straight to the editor: a photo of a screen is worth little until you can
    // point at the part that has to change.
    marked = await markUp(file);
  } catch (err) {
    // Loud on purpose. This failure used to land in the status line, where it
    // read as the editor simply never opening.
    hideEditor();
    const message = (err as Error).message;
    alert(
      'The photo could not be opened for marking.\n\n' +
        message +
        '\n\ntype: ' +
        (file.type || 'unknown') +
        '\nsize: ' +
        Math.round(file.size / 1024) +
        ' KB',
    );
    say(message, true);
    return;
  }
  if (!marked) {
    say('');
    return;
  }

  say('uploading photo...');
  try {
    const saved = await request({
      kind: 'upload',
      media: marked.type || 'image/jpeg',
      data: new Uint8Array(await marked.arrayBuffer()),
    });
    if (photo) URL.revokeObjectURL(photo.preview);
    photo = { ...saved, preview: URL.createObjectURL(marked) };
    showAttached();
    say('photo ready to send');
  } catch (err) {
    photo = null;
    showAttached();
    say((err as Error).message, true);
  }
}

for (const input of [photoInput, cameraInput]) {
  input.addEventListener('change', () => {
    const file = input.files?.[0];
    input.value = '';
    if (file) void attachPhoto(file);
  });
}

// ---- sending ----

send.addEventListener('click', () => void sendOrder());

const quick = $('quick');
const toggleQuick = $('toggle-quick');
for (const reply of QUICK_REPLIES) {
  const chip = document.createElement('button');
  chip.textContent = reply;
  // What is being typed, and a photo waiting, stay in the box.
  chip.addEventListener('click', () => void deliver(quickOrder(reply, state.replyStyle)));
  quick.append(chip);
}
toggleQuick.addEventListener('click', () => store.setQuickReplies(!state.quickReplies));

async function sendOrder(): Promise<void> {
  const body = text.value.trim();
  // A photo on its own is a complete order; words are optional then.
  if (!body && !photo) return;
  const sent = await deliver(composeOrder(body, state.replyStyle, photo?.path ?? null));
  if (!sent) return;
  text.value = '';
  photo = null;
  showAttached();
}

/** Sends one order and shows it until the transcript carries it; true once Herdr took it. */
async function deliver({ spoken, order }: Order): Promise<boolean> {
  const target = state.target;
  if (!target) return false;
  stopDictation();
  send.disabled = true;
  say('sending...');
  // Show it straight away; the transcript takes a moment to catch up.
  store.beginSend(spoken);
  chat.scrollTop = chat.scrollHeight;
  try {
    await request({ kind: 'prompt', target, text: order });
    store.sendAccepted();
    say('sent');
    return true;
  } catch (err) {
    store.sendFailed();
    say((err as Error).message, true);
    return false;
  } finally {
    send.disabled = false;
  }
}

for (const button of keys.querySelectorAll<HTMLButtonElement>('button[data-key]')) {
  button.addEventListener('click', () => void sendKey(button));
}

async function sendKey(button: HTMLButtonElement): Promise<void> {
  if (!state.target) return;
  const key = must(button.dataset['key'], 'key name');
  try {
    await request({ kind: 'keys', target: state.target, keys: [key] });
    say('sent ' + key);
  } catch (err) {
    say((err as Error).message, true);
  }
}

// ---- gate ----

const GATE_TEXT: Record<Gate, string> = {
  scan: 'Scan the QR code your computer shows.',
  'invite-expired':
    'This QR code has expired. Press Enter where remote-sheep runs on your computer for a new one, and scan it.',
  'invite-invalid':
    'This link is not a valid pairing QR code. Scan the QR code your computer shows.',
  expired:
    'This phone is no longer paired: the pairing expired or was revoked. Scan a new QR code.',
  unauthorized: 'Your computer did not accept this phone. Scan a new QR code from your computer.',
};

function renderGate(): void {
  const reason = state.gate;
  gate.classList.toggle('on', reason !== null);
  head.classList.toggle('hidden', reason !== null);
  if (reason === null) {
    applyView();
    renderHeader();
    renderHome();
    renderList();
    return;
  }
  gateText.textContent = GATE_TEXT[reason];
  renderGateProfiles();
  gateScan.classList.toggle('hidden', !canScan());
  for (const el of [list, chat, term, devices, computers, $('settings')]) el.classList.remove('on');
  home.classList.add('hidden');
  newSession.classList.add('hidden');
  sheet.classList.add('hidden');
  foot.classList.add('hidden');
}

/** The other computers this phone is paired with, so a dead pairing does not trap the page. */
function renderGateProfiles(): void {
  gateProfiles.textContent = '';
  for (const profile of state.profiles) {
    if (profile.active) continue;
    const open = document.createElement('button');
    open.textContent = 'Open ' + profile.name;
    open.addEventListener('click', () => starter?.switchTo(profile.id));
    gateProfiles.append(open);
  }
}

export interface AppDependencies {
  connect: Connect;
  pairings: PairingStore;
  /** The URL fragment the page opened with, already removed from the address bar. */
  fragment: string;
  /** The session a tapped notification asked for, already removed from the address. */
  session: string | null;
  /** The computer a tapped notification came from (its agent id), already removed too. */
  agent: string | null;
  push: PushSubscriptions;
  updates: UpdateSource;
}

/** Pairs with the QR in the fragment, or reconnects with the pairing this phone kept. */
/** What the view needs from Angular to mount the screens already rebuilt as components. */
export interface AngularHost {
  appRef: ApplicationRef;
  injector: EnvironmentInjector;
}

export function startApp(dependencies: AppDependencies, angular: AngularHost): void {
  const profile = chooseProfile(
    localStorage,
    dependencies.fragment,
    dependencies.agent,
    Date.now(),
  );
  store = new Store(profilePreferences(localStorage, profile), dependencies.push);
  listView = createComponent(SessionListComponent, {
    environmentInjector: angular.injector,
    hostElement: list,
  });
  angular.appRef.attachView(listView.hostView);
  listView.instance.open.subscribe(openRow);
  updates = dependencies.updates;
  state = store.state;
  store.subscribe(onChange);
  document.addEventListener('visibilitychange', () => {
    store.setVisible(document.visibilityState === 'visible');
  });
  if (dependencies.session) openChat(dependencies.session);
  starter = new LinkStarter(
    store,
    dependencies.pairings,
    dependencies.connect,
    {
      ready: () => {
        watch();
        // Failures show in the Devices view through push.error.
        void store.syncPush(agent);
      },
      error: (message) => say(message, true),
      restart: () => {
        sessionStorage.setItem(ANNOUNCE, '1');
        location.replace(location.pathname);
      },
    },
    localStorage,
  );
  // Errors surface through the store and the hooks; the page has nothing to wait for.
  void starter.start(dependencies.fragment);
}

// ---- settings: the reply styles the person writes ----

const styleList = $('style-list');
const styleName = $('style-name', HTMLInputElement);
const stylePrompt = $('style-prompt', HTMLInputElement);
const styleSave = $('style-save');
let editingStyle: string | null = null;

function renderStyleSettings(): void {
  styleList.replaceChildren(
    ...state.styles.map((style) => {
      const row = document.createElement('div');
      row.className = 'style-row';
      const name = document.createElement('span');
      name.textContent = style.label;
      const prompt = document.createElement('small');
      prompt.textContent = promptOf(style.suffix);
      name.append(prompt);
      row.append(name);
      if (!isFixedStyle(style)) {
        const edit = document.createElement('button');
        edit.textContent = 'Edit';
        edit.addEventListener('click', () => {
          editingStyle = style.id;
          styleName.value = style.label;
          stylePrompt.value = promptOf(style.suffix);
          styleSave.textContent = 'Save';
        });
        const remove = document.createElement('button');
        remove.textContent = 'Delete';
        remove.addEventListener('click', () => store.removeStyle(style.id));
        row.append(edit, remove);
      }
      return row;
    }),
  );
}

function clearStyleForm(): void {
  editingStyle = null;
  styleName.value = '';
  stylePrompt.value = '';
  styleSave.textContent = 'Add style';
}

styleSave.addEventListener('click', () => {
  if (store.saveStyle(editingStyle, styleName.value, stylePrompt.value)) clearStyleForm();
  else say('A style needs a name and a prompt.', true);
});
$('style-reset').addEventListener('click', () => {
  clearStyleForm();
  store.resetStyles();
});
renderStyleSettings();
