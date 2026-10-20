// Settings → Update: the version the computer runs and a button that has it update itself.
// Only drawing and forwarding the tap; the rules live in the Store. Like the relay, the page
// markup has no slot for it yet, so it is built here and placed before the General group.

import type { AgentUpdate } from '../L2_application/app.store';

export interface UpdateSettingsView {
  /** `canUpdate` is the Store's rule for the button. */
  render(update: AgentUpdate, canUpdate: boolean): void;
}

function element<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className: string,
  text = '',
): HTMLElementTagNameMap[K] {
  const made = document.createElement(tag);
  made.className = className;
  made.textContent = text;
  return made;
}

function describeUpdate(update: AgentUpdate): string {
  const running = update.version ? 'v' + update.version : 'version not known yet';
  switch (update.status) {
    case 'unknown':
      return 'Checking…';
    case 'idle':
      return update.plugin ? running : running + ' — not run as the Herdr plugin';
    case 'updating':
      return 'Updating… this can take a few minutes.';
    case 'restarting':
      return 'Restarting the computer’s agent into the update… the app reconnects by itself.';
    case 'updated':
      return update.from && update.from !== update.version
        ? 'Updated: v' + update.from + ' → ' + running + '.'
        : 'Updated; ' + running + ' runs now.';
    case 'current':
      return running + ' — already up to date.';
    case 'failed':
      return 'Update failed: ' + (update.error ?? 'no reason given');
  }
}

export function mountUpdateSettings(
  settings: HTMLElement,
  onUpdate: () => void,
): UpdateSettingsView {
  const group = element('div', 'group', 'Update');
  const list = element('div', 'list');
  const status = element('div', 'item');
  const statusText = element('span', 'tx', 'remote-sheep on this computer');
  const statusHint = element('small', '');
  statusText.append(statusHint);
  status.append(statusText);
  const buttons = element('div', 'form-acts');
  const update = element('button', 'fill', 'Update');
  buttons.append(update);
  list.append(status, buttons);
  const hint = element(
    'p',
    'group-hint',
    'Gets the newest version through Herdr and restarts it; the app reconnects by itself.',
  );

  const general = [...settings.querySelectorAll('.group')].find(
    (node) => node.textContent === 'General',
  );
  if (general) general.before(group, list, hint);
  else settings.append(group, list, hint);

  update.addEventListener('click', onUpdate);

  return {
    render(state, canUpdate) {
      statusHint.textContent = describeUpdate(state);
      update.disabled = !canUpdate;
    },
  };
}
