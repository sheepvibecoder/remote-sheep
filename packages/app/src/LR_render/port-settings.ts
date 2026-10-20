// Settings → Port: the port the computer listens on, and a form to move it. Only drawing and
// forwarding taps; the rules live in the Store, which also says when the page must move.

import type { PortSettings } from '../L2_application/app.store';

export interface PortSettingsActions {
  /** A port number as typed, or `auto`. */
  save(text: string): void;
}

export interface PortSettingsView {
  /** `line` is the Store's description of the port. */
  render(port: PortSettings, line: string): void;
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

export function mountPortSettings(
  settings: HTMLElement,
  actions: PortSettingsActions,
): PortSettingsView {
  const group = element('div', 'group', 'Port');
  const list = element('div', 'list');
  const status = element('div', 'item');
  const statusText = element('span', 'tx', 'Port');
  const statusHint = element('small', '');
  statusText.append(statusHint);
  status.append(statusText);
  const form = element('div', 'form');
  const input = element('input', '');
  input.placeholder = '3998, or auto';
  input.inputMode = 'numeric';
  input.autocomplete = 'off';
  const buttons = element('div', 'form-acts');
  const auto = element('button', 'line', 'Auto');
  const save = element('button', 'fill', 'Use this port');
  buttons.append(auto, save);
  form.append(input, buttons);
  list.append(status, form);
  const hint = element(
    'p',
    'group-hint',
    'The computer restarts on the new port. Phones paired over its network need the new ' +
      'address; phones on the relay are unaffected.',
  );

  const general = [...settings.querySelectorAll('.group')].find(
    (node) => node.textContent === 'General',
  );
  if (general) general.before(group, list, hint);
  else settings.append(group, list, hint);

  save.addEventListener('click', () => {
    actions.save(input.value);
  });
  auto.addEventListener('click', () => {
    actions.save('auto');
  });

  return {
    render({ state }, line) {
      statusHint.textContent = line;
      form.classList.toggle('hidden', !state?.canChange);
    },
  };
}
