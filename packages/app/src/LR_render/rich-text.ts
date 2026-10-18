// Light markdown, built as nodes so nothing is ever injected as html.

const BT = String.fromCharCode(96);
const RICH = new RegExp('(\\*\\*[^*]+\\*\\*|' + BT + '[^' + BT + ']+' + BT + ')');

export function renderRich(el: HTMLElement, raw: string): void {
  el.textContent = '';
  const plain = raw.replace(/^#{1,6}\s+/gm, '');
  for (const part of plain.split(RICH)) {
    if (!part) continue;
    if (part.length > 4 && part.startsWith('**') && part.endsWith('**')) {
      const strong = document.createElement('strong');
      strong.textContent = part.slice(2, -2);
      el.append(strong);
    } else if (part.length > 2 && part.startsWith(BT) && part.endsWith(BT)) {
      const code = document.createElement('code');
      code.textContent = part.slice(1, -1);
      el.append(code);
    } else {
      el.append(document.createTextNode(part));
    }
  }
}

/** The same text with the markup removed, for reading aloud. */
export function speakable(raw: string): string {
  return raw
    .replace(/\*\*/g, '')
    .replace(new RegExp(BT, 'g'), '')
    .replace(/^#{1,6}\s+/gm, '')
    .trim();
}
