// The phone app's view: draws the store and hands taps back to it.
//
// The agent pushes every change, so nothing here polls. State and rules live
// in L2_application; this layer only touches the DOM, so a redesign replaces it
// alone. The connection arrives from the composition root as a port.

import {
  drawPalette,
  drawTheme,
  drawTypography,
  startPalette,
  startTheme,
  startTypography,
  drawContextWindow,
  startContextWindow,
} from './appearance';
import {
  createComponent,
  type ApplicationRef,
  type ComponentRef,
  type EnvironmentInjector,
} from '@angular/core';
import type { ChatMessage, Request, ResultOf, UploadResult } from '@remote-sheep/protocol';
import type { LinkState } from '../L1_domain/link-state';
import { modelLabel } from '../L1_domain/chat';
import type { ContextFill } from '../L1_domain/context-window';
import { enterSends } from '../L1_domain/enter-sends';
import { agentLabel, pageTitle } from '../L1_domain/home';
import { asksNothing, quickOrder, type Order } from '../L1_domain/order';
import { isFixedStyle, promptOf } from '../L1_domain/reply-styles';
import { pairFragmentFrom } from '../L1_domain/pair-link';
import type { Connect } from '../L1_domain/ports/agent-connection';
import type { LocalPairing } from '../L1_domain/ports/local-pairing';
import type { PairingStore } from '../L1_domain/ports/pairing-store';
import type { PushSubscriptions } from '../L1_domain/ports/push-subscriptions';
import type { UpdateSource } from '../L1_domain/ports/update-source';
import {
  Store,
  type Change,
  type Gate,
  type NewKind,
  type Profile,
} from '../L2_application/app.store';
import { LinkStarter } from '../L2_application/link-starter';
import { chooseProfile, profilePreferences } from '../L2_application/profile-choice';
import { stopDictation } from './dictation';
import { $, must, say } from './dom';
import { hideEditor, markUp } from './photo-editor';
import { canScan, scanQr } from './qr-scanner';
import { mountPairingSettings } from './pairing-settings';
import { mountPortSettings } from './port-settings';
import { mountRelaySettings } from './relay-settings';
import { mountUpdateSettings } from './update-settings';
import { renderRich } from './rich-text';
import { SessionListComponent } from './session-list/session-list.component';
import { autoSpeak, drawSpeed, speak, startSpeeds } from './speech';

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

// On a wide window the list stays on the left and the open session fills the right, like a
// messaging app on the web; on a phone each screen takes the whole window in turn.
const wideQuery = window.matchMedia('(min-width: 900px)');
const listShown = () => state.view === 'list' || wideQuery.matches;

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
const toast = $('toast');
const dot = $('dot');
const headAv = $('head-av');
// An <svg>, which `$` would refuse as not an HTMLElement.
const brand = must(document.querySelector<SVGSVGElement>('svg#brand'), 'svg#brand');
const nameEl = $('name');
const sub = $('sub');
const back = $('back');
const text = $('text', HTMLTextAreaElement);
/** The session whose draft the box holds; one box serves every chat. */
let shownDraft: string | null = null;
const send = $('send', HTMLButtonElement);
const keys = $('keys');
const choices = $('choices');
let shownChoices = '';
const mic = $('mic', HTMLButtonElement);
const model = $('model');
const menuModel = $('menu-model');
// The context detail of the chat menu: how many tokens of the window, and a bar.
const menuContext = document.createElement('div');
menuContext.className = 'ctx-detail hidden';
const menuContextLabel = document.createElement('span');
const menuContextPercent = document.createElement('span');
const menuContextBar = document.createElement('i');
{
  const line = document.createElement('div');
  line.className = 'ctx-line';
  line.append(menuContextLabel, menuContextPercent);
  const bar = document.createElement('div');
  bar.className = 'ctxbar';
  bar.append(menuContextBar);
  menuContext.append(line, bar);
  menuModel.after(menuContext);
}
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
      document.title = pageTitle(store.unreadTotal());
      renderHeader();
      renderKeys();
      // The Consoles tab shows up with the first console the agent lists.
      if (listShown()) renderHome();
      if (listShown()) renderList();
      return;
    case 'home':
      renderHome();
      renderList();
      if (!sheet.classList.contains('hidden')) renderSheet();
      return;
    case 'view':
      document.title = pageTitle(store.unreadTotal());
      applyView();
      renderHeader();
      if (state.view === 'settings') {
        void store.loadShells(agent);
        void store.loadRelay(agent);
        void store.loadAgentUpdate(agent);
        void store.loadPort(agent);
      }
      if (listShown()) renderList();
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
      announceProfile();
      if (state.view === 'computers') renderComputers();
      renderComputerSettings();
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
      // The list beside a wide chat tags this session once it fills up.
      renderList();
      return;
    case 'shells':
      renderShells();
      if (!sheet.classList.contains('hidden')) renderSheet();
      return;
    case 'relay':
      renderRelay();
      return;
    case 'agent-update':
      agentUpdateSettings.render(state.agentUpdate, store.canUpdateAgent());
      return;
    case 'pairing':
      pairingSettings.render(state.pairing);
      if (state.pairing.error && state.view === 'settings') say(state.pairing.error, true);
      return;
    case 'port':
      portSettings.render(state.port, store.portLine());
      if (state.port.error && state.view === 'settings') say(state.port.error, true);
      if (state.port.moveTo) location.assign(state.port.moveTo);
      return;
    case 'quick':
      drawQuick();
      // Places shift when one is removed, so an edit in progress must not outlive the change.
      clearQuickForm();
      renderQuickSettings();
      return;
    case 'styles':
      drawStyles();
      clearStyleForm();
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
    case 'appearance':
      drawPalette(state.palette);
      drawTheme(state.theme, state.dark);
      drawTypography(state.textSize, state.typeface);
      drawContextWindow(state.contextWindow);
      drawSpeed(state.speechRate);
      // The picked window changes every percent shown.
      if (state.view === 'chat') renderModel();
      renderList();
      return;
  }
}

// ---- views ----

function applyView(): void {
  const { view } = state;
  const layout = store.layout();
  const wide = wideQuery.matches;
  list.classList.toggle('on', listShown());
  home.classList.toggle('hidden', !listShown());
  newSession.classList.toggle('hidden', !listShown());
  if (!listShown()) sheet.classList.add('hidden');
  // Nothing open on a wide window: the right side says so instead of staying blank.
  $('empty').classList.toggle('on', wide && view === 'list');
  chat.classList.toggle('on', view === 'chat' && layout !== 'term');
  term.classList.toggle('on', view === 'chat' && layout !== 'chat');
  document.body.classList.toggle('split', view === 'chat' && layout === 'split');
  devices.classList.toggle('on', view === 'devices');
  computers.classList.toggle('on', view === 'computers');
  $('settings').classList.toggle('on', view === 'settings');
  // The gear is the home's way into Settings; a chat has its own ⋮ menu instead.
  $('gear').classList.toggle('hidden', view !== 'list');
  // On a wide window the left column carries the home's top, so the right has no header to show.
  document.body.classList.toggle('at-home', view === 'list');
  $('menu-open').classList.toggle('hidden', view !== 'chat');
  $('tabs').classList.toggle('hidden', !listShown());
  foot.classList.toggle('hidden', view !== 'chat');
  // The list is already on screen beside an open chat, so there is nowhere to go back to.
  back.classList.toggle('hidden', view === 'list' || (wide && view === 'chat'));
  $('chat-menu').classList.toggle('hidden', view !== 'chat');
  if (view === 'chat') renderStyles();
  // The Default badge follows the style a chat picked, so the list is redrawn on the way in.
  if (view === 'settings') renderStyleSettings();
  // A shell, or an agent whose chat cannot be read, has no chat to switch back to.
  $('toggle-term').classList.toggle('hidden', view !== 'chat' || !store.hasChat());
  // The note rides on the terminal itself, whose rows are redrawn from the pane text.
  const agentName = agentLabel(store.currentSession()?.agent) ?? 'this agent';
  if (store.chatUnavailable()) {
    term.dataset['note'] =
      'Chat view isn’t available for ' +
      agentName +
      ' yet. You see its terminal; what you type or dictate goes straight to it.';
  } else {
    delete term.dataset['note'];
  }
  $('to-chat').classList.toggle('on', layout === 'chat');
  $('to-split').classList.toggle('on', layout === 'split');
  $('to-term').classList.toggle('on', layout === 'term');
  $('to-split').classList.toggle('hidden', !store.offersSplit());
  // With the terminal up the whole screen goes dark and the box types into the pane.
  const pane = store.typesIntoPane();
  document.body.classList.toggle('pane', pane);
  text.placeholder = pane ? 'Type into the pane' : 'Message';
  if (state.target !== shownDraft) {
    text.value = store.draft(state.target);
    shownDraft = state.target;
  }
  onText();
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
  if (menu.contains(event.target as Node)) return;
  menu.classList.add('hidden');
});

function openChat(next: string): void {
  chat.textContent = '';
  term.textContent = '';
  store.openChat(next);
}

back.addEventListener('click', () => store.back());

// Each choice of the switch only acts when it is not the one already showing.
$('to-chat').addEventListener('click', () => {
  switchView(() => store.setLayout('chat'));
});
$('to-split').addEventListener('click', () => {
  switchView(() => store.setLayout('split'));
});
$('to-term').addEventListener('click', () => {
  switchView(() => store.setLayout('term'));
});
const LAYOUT_NAMES = { chat: 'chat', split: 'split view', term: 'raw terminal' } as const;
function switchView(change: () => void): void {
  const was = store.layout();
  // The rows of the old terminal must not linger while the agent sends the new snapshot.
  term.textContent = '';
  change();
  if (store.layout() !== was) say(LAYOUT_NAMES[store.layout()]);
}
// In Split the box serves the half last touched.
chat.addEventListener('pointerdown', () => {
  store.setSide('chat');
});
term.addEventListener('pointerdown', () => {
  store.setSide('term');
});

// Every view shows the version at the bottom, so a stale page is told apart at a glance.
$('version').textContent = 'RemoteSheep v' + __VERSION__;

function renderHeader(): void {
  const { view } = state;
  $('side-host').textContent = store.activeProfileName() ?? '';
  const current = store.currentSession();
  const status = view === 'chat' ? current?.status || '' : '';
  dot.className = 'dot ' + (state.link === 'open' ? status : 'unknown');
  // A chat wears its session's avatar, ring and status line, the same as its row.
  const badge = store.headerBadge();
  headAv.classList.toggle('hidden', !badge);
  dot.classList.toggle('hidden', view === 'list' || badge !== null);
  nameEl.classList.toggle('chat', badge !== null);
  sub.classList.toggle('needs', badge?.asks === true);
  if (badge) {
    headAv.textContent = badge.avatar;
    headAv.className = 'av ' + badge.ring;
    headAv.classList.toggle('sh', badge.shell);
  }
  const title = must(nameEl.firstChild, '#name title');
  // The list is the home: it carries the app's name, and says which computer it shows below.
  brand.classList.toggle('hidden', view !== 'list');
  nameEl.classList.toggle('home', view === 'list');
  sub.classList.toggle('host', view === 'list');
  if (view === 'list') {
    title.textContent = 'RemoteSheep ';
    // Which computer the list shows; tapping it opens the computers, like a host picker.
    sub.textContent = store.activeProfileName() ?? '';
  } else if (view === 'devices') {
    title.textContent = 'Devices ';
    sub.textContent = state.devices.length + ' linked';
  } else if (view === 'settings') {
    // The page carries its own big title, as in the mockup.
    title.textContent = '';
    sub.textContent = '';
  } else if (view === 'computers') {
    // The page carries its own big title, like Settings.
    title.textContent = '';
    sub.textContent = '';
  } else {
    title.textContent = (current ? current.title : 'gone') + ' ';
    sub.textContent = badge ? badge.line : '';
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
  // Like the dot on a messaging app's tab: something settled while you were elsewhere.
  $('tab-sessions').classList.toggle('has-unread', store.unreadTotal() > 0);
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
  // The sheet redraws on the 'home' and 'shells' changes; a failure lands in homeError.
  void store.loadSpaces(agent);
  void store.loadShells(agent);
});

sheet.addEventListener('click', (event) => {
  if (event.target === sheet) sheet.classList.add('hidden');
});

// What the sheet starts: an agent of the pick, or a plain console.
const KINDS: { kind: NewKind; label: string; shows: string }[] = [
  { kind: 'claude', label: 'Claude Code', shows: 'chat' },
  { kind: 'codex', label: 'Codex', shows: 'terminal' },
  { kind: 'shell', label: 'Console', shows: 'shell' },
];
for (const { kind, label, shows } of KINDS) {
  const option = document.createElement('button');
  option.dataset['kind'] = kind;
  option.textContent = label;
  const small = document.createElement('small');
  small.textContent = shows;
  option.append(small);
  option.addEventListener('click', () => store.setNewKind(kind));
  $('sheet-kinds').append(option);
}

// A fixed drawing, never built from data, so it is safe as markup.
const FOLDER_ICON =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" /></svg>';

function renderSheet(): void {
  const offered = store.newKinds();
  for (const option of $('sheet-kinds').children) {
    const kind = (option as HTMLElement).dataset['kind'];
    option.classList.toggle('on', kind === state.newKind);
    option.classList.toggle('hidden', !offered.some((known) => known === kind));
  }
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
    const folder = document.createElement('span');
    folder.className = 'av sq';
    folder.innerHTML = FOLDER_ICON;
    const who = document.createElement('span');
    who.className = 'who';
    const title = document.createElement('span');
    title.className = 't';
    title.textContent = space.label;
    who.append(title);
    const chevron = document.createElement('span');
    chevron.className = 'chev';
    chevron.textContent = '›';
    row.append(folder, who, chevron);
    row.addEventListener('click', () => void startIn(space.id, space.label));
    line.append(row);
    sheetList.append(line);
  }
}

async function startIn(space: string, label: string): Promise<void> {
  sheetList.textContent = '';
  const hint = document.createElement('p');
  hint.className = 'hint';
  const what = KINDS.find((known) => known.kind === state.newKind)?.label ?? 'a session';
  hint.textContent =
    (state.newKind === 'shell' ? 'Opening a console in ' : 'Starting ' + what + ' in ') +
    label +
    '...';
  sheetList.append(hint);
  await store.newSession(agent, space);
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
  listView?.setInput('selected', state.view === 'chat' ? state.target : null);
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

$('computers-open').addEventListener('click', () => {
  store.openComputers();
});
sub.addEventListener('click', () => {
  if (state.view === 'list') store.openComputers();
});
$('gear').addEventListener('click', () => store.openSettings());
// A wide window keeps the home's top in the left column: the same gear and host picker.
$('side-gear').addEventListener('click', () => store.openSettings());
$('side-host').addEventListener('click', () => store.openComputers());
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
  const heading = document.createElement('h1');
  heading.className = 'h-title';
  heading.textContent = 'Computers';
  const card = document.createElement('div');
  card.className = 'list';
  computers.append(heading, card);
  for (const profile of state.profiles) {
    // The whole row switches, like picking a chat; the current one is marked.
    const row = document.createElement('div');
    row.className = 'item';
    const pick = document.createElement('button');
    pick.className = 'tx';
    pick.textContent = profile.name;
    const reach = document.createElement('small');
    reach.textContent = reachText(profile);
    pick.append(reach);
    pick.addEventListener('click', () => starter?.switchTo(profile.id));
    const actions = document.createElement('span');
    actions.className = 'end';
    if (profile.active) {
      const mark = document.createElement('span');
      mark.className = 'ok';
      mark.textContent = '✓';
      actions.append(mark);
    }
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
    rename.className = 'link';
    remove.className = 'link';
    actions.append(rename, remove);
    row.append(pick, actions);
    card.append(row);
  }
  if (canScan()) {
    const scan = document.createElement('button');
    scan.className = 'item add';
    scan.textContent = 'Add a computer';
    scan.addEventListener('click', () => void scanToPair());
    card.append(scan);
  }
  const hint = document.createElement('p');
  hint.className = 'group-hint';
  hint.textContent =
    (canScan() ? '' : 'To add a computer, scan its QR code with the phone camera. ') +
    'Computers share this list only when the app is opened through the relay.';
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

function drawPercent(percent: HTMLElement, fill: ContextFill): HTMLElement {
  percent.className = 'ctx ' + fill.level;
  percent.textContent = String(fill.percent) + '%';
  return percent;
}

function renderModel(): void {
  const name = modelLabel(state.model);
  const fill = store.contextFill();
  model.textContent = name ?? '';
  if (name && fill) model.append(' · ', drawPercent(document.createElement('span'), fill));
  model.classList.toggle('hidden', !name);
  menuModel.textContent = name ? (fill ? 'Context · ' : 'Model · ') + name : '';
  menuModel.classList.toggle('hidden', !name);
  menuContext.classList.toggle('hidden', !fill);
  if (fill) {
    menuContextLabel.textContent = fill.label;
    drawPercent(menuContextPercent, fill);
    menuContextBar.style.width = String(fill.fraction * 100) + '%';
  }
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
  const label = document.createElement('div');
  label.className = 'lbl';
  label.textContent = 'The pane is asking';
  choices.replaceChildren(
    label,
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
  const ready =
    store.orderFor(text.value, photo?.path ?? null) !== null && !mic.classList.contains('on');
  send.classList.toggle('hidden', !ready);
  mic.classList.toggle('hidden', ready);
}

text.addEventListener('input', () => {
  store.setDraft(state.target, text.value);
  onText();
});

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

// A fine pointer that can hover is a mouse: there Enter sends; a touch screen keeps Enter for
// new lines. Asked on each press, so a tablet that gets a mouse plugged in follows along.
const keyboardAndMouse = window.matchMedia('(hover: hover) and (pointer: fine)');
text.addEventListener('keydown', (event) => {
  if (!enterSends(event, keyboardAndMouse.matches)) return;
  event.preventDefault();
  if (!send.disabled) void sendOrder();
});

const quick = $('quick');
const toggleQuick = $('toggle-quick');
// The chips are drawn again whenever the person changes the list in Settings.
function drawQuick(): void {
  quick.replaceChildren(
    ...state.quickList.map((reply) => {
      const chip = document.createElement('button');
      chip.textContent = reply;
      // What is being typed, and a photo waiting, stay in the box.
      chip.addEventListener('click', () => void deliver(quickOrder(reply, state.replyStyle)));
      return chip;
    }),
  );
  renderStyles();
}
toggleQuick.addEventListener('click', () => store.setQuickReplies(!state.quickReplies));

async function sendOrder(): Promise<void> {
  const order = store.orderFor(text.value, photo?.path ?? null);
  if (!order) return;
  const target = state.target;
  const sent = await deliver(order);
  if (!sent) return;
  if (store.orderSent(target)) text.value = '';
  if (order.usesPhoto) photo = null;
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
  $('side-top').classList.toggle('hidden', reason !== null);
  $('statusbar').classList.toggle('hidden', reason !== null);
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
  /** How a page opened on the agent's own computer asks it for a pairing, with no QR. */
  localPairing: LocalPairing;
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
  // The accent, the reading speed, the theme, the text size and the typeface belong to the phone,
  // under the plain keys it always used.
  store = new Store(
    profilePreferences(localStorage, profile),
    dependencies.push,
    () => Date.now(),
    localStorage,
  );
  store.setWide(wideQuery.matches);
  listView = createComponent(SessionListComponent, {
    environmentInjector: angular.injector,
    hostElement: list,
  });
  angular.appRef.attachView(listView.hostView);
  listView.instance.open.subscribe(openRow);
  listView.instance.start.subscribe((space) => {
    // Failures land in homeError, which the home shows; nothing else waits for it.
    void store.newSession(agent, space, 'claude');
  });
  updates = dependencies.updates;
  state = store.state;
  // Everything below reads `state`, which exists only from here on: drawing at load would
  // crash the page before the first screen.
  // The unread counts come from storage, so the tab shows them before the first session list,
  // which never arrives while the computer is unreachable.
  document.title = pageTitle(store.unreadTotal());
  startPalette(store);
  startTheme(store);
  startTypography(store);
  startContextWindow(store);
  startSpeeds(store);
  drawStyles();
  drawQuick();
  renderStyleSettings();
  renderQuickSettings();
  renderComputerSettings();
  renderShells();
  agentUpdateSettings.render(state.agentUpdate, store.canUpdateAgent());
  pairingSettings.render(state.pairing);
  portSettings.render(state.port, store.portLine());
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
        // After an update's restart the Store reads the new version; it reports by itself.
        void store.afterReady(agent);
      },
      error: (message) => say(message, true),
      restart: () => {
        sessionStorage.setItem(ANNOUNCE, '1');
        location.replace(location.pathname);
      },
      // As a scanned QR does: the page starts over on the pairing link.
      pair: (fragment) => {
        location.hash = fragment;
      },
    },
    localStorage,
    { page: { hostname: location.hostname, localPairing: dependencies.localPairing } },
  );
  // Errors surface through the store and the hooks; the page has nothing to wait for.
  void starter.start(dependencies.fragment);
}

// ---- settings: the reply styles the person writes ----
// Each style is a row; tapping one opens the form in its card to edit or delete it.

const styleList = $('style-list');
const styleForm = $('style-form');
const styleName = $('style-name', HTMLInputElement);
const stylePrompt = $('style-prompt', HTMLInputElement);
const styleSave = $('style-save');
const styleDelete = $('style-delete');
let editingStyle: string | null = null;

function renderStyleSettings(): void {
  styleList.replaceChildren(
    ...state.styles.map((style) => {
      const fixed = isFixedStyle(style);
      const row = document.createElement(fixed ? 'div' : 'button');
      row.className = 'item';
      const name = document.createElement('span');
      name.className = 'tx';
      name.textContent = style.label;
      const prompt = document.createElement('span');
      prompt.className = 'prompt';
      prompt.textContent = promptOf(style.suffix);
      name.append(prompt);
      row.append(name);
      // The style every order carries until a chat picks another.
      if (style.id === state.replyStyle.id) {
        const badge = document.createElement('span');
        badge.className = 'def';
        badge.textContent = 'Default';
        row.append(badge);
      }
      if (!fixed) row.addEventListener('click', () => openStyleForm(style.id));
      return row;
    }),
  );
}

function openStyleForm(id: string | null): void {
  const style = state.styles.find((s) => s.id === id);
  editingStyle = style ? style.id : null;
  styleName.value = style ? style.label : '';
  stylePrompt.value = style ? promptOf(style.suffix) : '';
  styleSave.textContent = style ? 'Save' : 'Add style';
  styleDelete.classList.toggle('hidden', !style);
  styleForm.classList.remove('hidden');
  styleName.focus();
}

function clearStyleForm(): void {
  editingStyle = null;
  styleName.value = '';
  stylePrompt.value = '';
  styleForm.classList.add('hidden');
}

$('style-new').addEventListener('click', () => openStyleForm(null));
$('style-cancel').addEventListener('click', clearStyleForm);
styleDelete.addEventListener('click', () => {
  if (editingStyle) store.removeStyle(editingStyle);
});
styleSave.addEventListener('click', () => {
  if (store.saveStyle(editingStyle, styleName.value, stylePrompt.value)) clearStyleForm();
  else say('A style needs a name and a prompt.', true);
});
$('style-reset').addEventListener('click', () => {
  clearStyleForm();
  store.resetStyles();
});

// ---- settings: the quick replies the person writes ----

const quickSettings = $('quick-list');
const quickForm = $('quick-form');
const quickWords = $('quick-words', HTMLInputElement);
const quickSave = $('quick-save');
const quickDelete = $('quick-delete');
let editingQuick: number | null = null;

function renderQuickSettings(): void {
  quickSettings.replaceChildren(
    ...state.quickList.map((reply, place, list) => {
      // A div, not a button: the row holds the arrow buttons, and buttons cannot nest.
      const row = document.createElement('div');
      row.className = 'item quick-row';
      const name = document.createElement('button');
      name.className = 'tx';
      name.textContent = reply;
      name.addEventListener('click', () => openQuickForm(place));
      const arrow = (text: string, title: string, step: -1 | 1, blocked: boolean) => {
        const button = document.createElement('button');
        button.className = 'end';
        button.textContent = text;
        button.title = title;
        button.disabled = blocked;
        button.addEventListener('click', () => store.moveQuick(place, step));
        return button;
      };
      row.append(
        name,
        arrow('↑', 'move up', -1, place === 0),
        arrow('↓', 'move down', 1, place === list.length - 1),
      );
      return row;
    }),
  );
}

function openQuickForm(place: number | null): void {
  const reply = place === null ? undefined : state.quickList[place];
  editingQuick = reply === undefined ? null : place;
  quickWords.value = reply ?? '';
  quickSave.textContent = reply === undefined ? 'Add reply' : 'Save';
  quickDelete.classList.toggle('hidden', reply === undefined);
  quickForm.classList.remove('hidden');
  quickWords.focus();
}

function clearQuickForm(): void {
  editingQuick = null;
  quickWords.value = '';
  quickForm.classList.add('hidden');
}

$('quick-new').addEventListener('click', () => openQuickForm(null));
$('quick-cancel').addEventListener('click', clearQuickForm);
quickDelete.addEventListener('click', () => {
  if (editingQuick !== null) store.removeQuick(editingQuick);
});
quickSave.addEventListener('click', () => {
  if (store.saveQuick(editingQuick, quickWords.value)) clearQuickForm();
  else say('That reply is empty, already there, or the list is full.', true);
});
$('quick-reset').addEventListener('click', () => {
  clearQuickForm();
  store.resetQuick();
});

// ---- settings: the computers this phone is paired with ----
// A row switches, like on the computers screen; adding, renaming and removing live there.

function renderComputerSettings(): void {
  $('computer-list').replaceChildren(
    ...state.profiles.map((profile) => {
      const row = document.createElement('button');
      row.className = 'item';
      const name = document.createElement('span');
      name.className = 'tx';
      name.textContent = profile.name;
      const reach = document.createElement('small');
      reach.textContent = reachText(profile);
      name.append(reach);
      row.append(name);
      if (profile.active) {
        const mark = document.createElement('span');
        mark.className = 'ok';
        mark.textContent = '✓';
        row.append(mark);
      } else {
        row.addEventListener('click', () => starter?.switchTo(profile.id));
      }
      return row;
    }),
  );
}

wideQuery.addEventListener('change', () => {
  store.setWide(wideQuery.matches);
  applyView();
  renderHeader();
  if (listShown()) {
    renderHome();
    renderList();
  }
});

// ---- keyboard ----
// Ctrl+K jumps to the search, Alt+↓ to the next session that waits for an answer, Ctrl+\ turns
// Split on and off. They only listen once the app is paired and showing, so the pairing screen
// is left alone.

document.addEventListener('keydown', (event) => {
  if (state.gate) return;
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
    if (!listShown()) return;
    event.preventDefault();
    search.focus();
  } else if (event.ctrlKey && event.key === '\\') {
    if (!store.offersSplit()) return;
    event.preventDefault();
    switchView(() => store.toggleSplit());
  } else if (event.altKey && event.key === 'ArrowDown') {
    const next = store.nextToAnswer();
    if (next === null) return;
    event.preventDefault();
    openChat(next);
  }
});

// ---- settings: consoles ----

const toggleShells = $('toggle-shells', HTMLButtonElement);

function renderShells(): void {
  must(toggleShells.querySelector('.tg'), 'consoles switch').classList.toggle(
    'on',
    state.shells === true,
  );
  toggleShells.disabled = state.shells === null;
  if (state.homeError && state.view === 'settings') say(state.homeError, true);
}

toggleShells.addEventListener('click', () => {
  if (state.shells !== null) void store.setShells(agent, !state.shells);
});

// ---- settings: relay ----

const relaySettings = mountRelaySettings($('settings'), {
  save: (url, code) => {
    void store.setRelay(agent, url, code);
  },
  turnOff: () => {
    void store.turnRelayOff(agent);
  },
});

function renderRelay(): void {
  relaySettings.render(state.relay);
  if (state.relayCodeAccepted) relaySettings.clearCode();
  if (state.relayError && state.view === 'settings') say(state.relayError, true);
}

// ---- settings: add a device, port ----

const pairingSettings = mountPairingSettings($('settings'), () => {
  // The QR or the reason arrives as a 'pairing' change; nothing else waits for it.
  void store.addDevice(agent);
});

const portSettings = mountPortSettings($('settings'), {
  save: (text) => {
    // The outcome, and the move of a page on this PC, arrive as 'port' changes.
    void store.setPort(agent, text, location);
  },
});

// ---- settings: update ----

const agentUpdateSettings = mountUpdateSettings($('settings'), () => {
  // The outcome arrives as an 'agent-update' change; nothing else waits for it.
  void store.updateAgent(agent);
});
