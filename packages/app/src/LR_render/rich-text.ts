// Light markdown, built as nodes so nothing is ever injected as html.

import { languageName, splitCode } from '../L1_domain/code-fence';
import { say } from './dom';

const BT = String.fromCharCode(96);
const RICH = new RegExp('(\\*\\*[^*]+\\*\\*|' + BT + '[^' + BT + ']+' + BT + ')');

export function renderRich(el: HTMLElement, raw: string): void {
  el.textContent = '';
  for (const piece of splitCode(raw)) {
    if (piece.kind === 'code') el.append(codeBlock(piece.language, piece.code));
    else el.append(prose(piece.text));
  }
}

function prose(text: string): HTMLElement {
  const p = document.createElement('p');
  const plain = text.replace(/^#{1,6}\s+/gm, '');
  for (const part of plain.split(RICH)) {
    if (!part) continue;
    if (part.length > 4 && part.startsWith('**') && part.endsWith('**')) {
      const strong = document.createElement('strong');
      strong.textContent = part.slice(2, -2);
      p.append(strong);
    } else if (part.length > 2 && part.startsWith(BT) && part.endsWith(BT)) {
      const code = document.createElement('code');
      code.textContent = part.slice(1, -1);
      p.append(code);
    } else {
      p.append(document.createTextNode(part));
    }
  }
  return p;
}

function codeBlock(language: string, code: string): HTMLElement {
  const block = document.createElement('div');
  block.className = 'code';
  const header = document.createElement('header');
  const name = document.createElement('span');
  name.textContent = languageName(language);
  const copy = document.createElement('button');
  copy.textContent = 'Copy';
  copy.addEventListener('click', (event) => {
    // A tap on a message reads it aloud; a tap on Copy only copies.
    event.stopPropagation();
    navigator.clipboard.writeText(code).then(
      () => say('copied'),
      () => say('this browser cannot copy here', true),
    );
  });
  header.append(name, copy);
  const pre = document.createElement('pre');
  pre.textContent = code;
  block.append(header, pre);
  return block;
}

/** The same text with the markup removed, for reading aloud. */
export function speakable(raw: string): string {
  return raw
    .replace(/\*\*/g, '')
    .replace(new RegExp(BT, 'g'), '')
    .replace(/^#{1,6}\s+/gm, '')
    .trim();
}
