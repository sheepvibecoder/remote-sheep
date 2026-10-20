// Settings → Add a device: a button that asks the computer for a new pairing, its QR code and
// its links. Only drawing and forwarding the tap; the rules live in the Store. The QR code comes
// from the agent as SVG and is shown as an image, which runs nothing it might carry.

import type { AppState } from '../L2_application/app.store';

export interface PairingSettingsView {
  render(pairing: AppState['pairing']): void;
}

const PLACES = { relay: 'Anywhere (relay)', network: 'On this network', 'this-pc': 'On this PC' };

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

export function mountPairingSettings(
  settings: HTMLElement,
  onAdd: () => void,
): PairingSettingsView {
  const group = element('div', 'group', 'Add a device');
  const list = element('div', 'list');
  const buttons = element('div', 'form-acts');
  const add = element('button', 'fill', 'Show a QR code');
  buttons.append(add);
  const qr = element('img', 'hidden');
  qr.alt = 'QR code to pair another device';
  qr.width = 240;
  const links = element('div', '');
  list.append(buttons, qr, links);
  const hint = element(
    'p',
    'group-hint',
    'Scan it with the other phone, or open a link on it. It pairs one device and works for 5 minutes.',
  );

  const general = [...settings.querySelectorAll('.group')].find(
    (node) => node.textContent === 'General',
  );
  if (general) general.before(group, list, hint);
  else settings.append(group, list, hint);

  add.addEventListener('click', onAdd);

  return {
    render({ offer }) {
      qr.classList.toggle('hidden', offer === null);
      links.replaceChildren();
      if (!offer) return;
      qr.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(offer.qr);
      for (const link of offer.links) {
        const item = element('div', 'item');
        const text = element('span', 'tx', PLACES[link.where]);
        text.append(element('small', '', link.url));
        item.append(text);
        links.append(item);
      }
    },
  };
}
