// Settings → Relay: whether the computer uses a relay, and a form to set one or turn it off.
// Only drawing and forwarding taps; the rules live in the Store. The page markup has no slot for
// it yet, so it is built here and placed before the General group.

import { relayIsOn, type RelayInfo } from '@remote-sheep/protocol';

export interface RelaySettingsActions {
  save(url: string, code: string): void;
  turnOff(): void;
}

export interface RelaySettingsView {
  render(relay: RelayInfo | null): void;
  /** Empties the code box, so the code does not stay on screen once sent. */
  clearCode(): void;
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

export function mountRelaySettings(
  settings: HTMLElement,
  actions: RelaySettingsActions,
): RelaySettingsView {
  const group = element('div', 'group', 'Relay');
  const list = element('div', 'list');
  const status = element('div', 'item');
  const statusText = element('span', 'tx', 'Relay');
  const statusHint = element('small', '');
  statusText.append(statusHint);
  status.append(statusText);

  const form = element('div', 'form');
  const url = element('input', '');
  url.placeholder = 'https://my-relay.workers.dev';
  url.autocomplete = 'off';
  url.inputMode = 'url';
  const code = element('input', '');
  code.type = 'password';
  code.placeholder = 'Access code';
  code.autocomplete = 'off';
  const buttons = element('div', 'form-acts');
  const off = element('button', 'line', 'Turn off');
  const save = element('button', 'fill', 'Use this relay');
  buttons.append(off, save);
  form.append(url, code, buttons);
  list.append(status, form);
  const hint = element(
    'p',
    'group-hint',
    'Reach this computer from outside its network. The computer connects at once and keeps it.',
  );

  const general = [...settings.querySelectorAll('.group')].find(
    (node) => node.textContent === 'General',
  );
  if (general) general.before(group, list, hint);
  else settings.append(group, list, hint);

  save.addEventListener('click', () => {
    actions.save(url.value, code.value);
  });
  off.addEventListener('click', () => {
    actions.turnOff();
  });

  return {
    render(relay) {
      const fixed = relay?.fixed === true;
      statusHint.textContent =
        relay === null
          ? 'Checking…'
          : relayIsOn(relay)
            ? relay.url + (relay.connected ? ' — connected' : ' — not connected yet')
            : 'Off: phones reach this computer on its network only.';
      if (fixed) statusHint.textContent += ' Set by variables on the computer.';
      form.classList.toggle('hidden', relay === null || fixed);
      off.disabled = !relay?.on;
      if (relay?.url && document.activeElement !== url) url.value = relay.url;
    },
    clearCode() {
      code.value = '';
    },
  };
}
