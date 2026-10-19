// What the phone sends a session: the words, the reply style picked, and an attached photo.
// The suffixes are Spanish because the sessions they reach are run in Spanish.

const PHOTO_ONLY = 'Mira esta imagen.';

/** A way of asking for a reply, appended to every order while it is picked. */
export interface ReplyStyle {
  id: string;
  label: string;
  /** Appended to the order; empty for none. */
  suffix: string;
}

const ONE_LINE: ReplyStyle = {
  id: 'one-line',
  label: 'One line',
  suffix: ' (responde en una sola linea)',
};

/** The styles the chat menu offers, in the mockup's order. Settings will let people add their own. */
export const REPLY_STYLES: readonly ReplyStyle[] = [
  { id: 'off', label: 'Off', suffix: '' },
  ONE_LINE,
  { id: 'simple', label: 'Explain simply', suffix: ' (explicalo simple)' },
  { id: 'ten-lines', label: '10 lines max', suffix: ' (responde en 10 lineas como maximo)' },
  { id: 'spanish', label: 'En español', suffix: ' (responde en español)' },
];

/** Orders sent with one tap, above the message box. Spanish, like the sessions they reach. */
export const QUICK_REPLIES: readonly string[] = [
  'Continúa',
  'Corre los tests',
  'Haz commit',
  'Explícame el cambio',
];

/** The style with this id; one line when it is unknown, such as one removed since. */
export function replyStyle(id: string | null): ReplyStyle {
  return REPLY_STYLES.find((style) => style.id === id) ?? ONE_LINE;
}

/** Whether a style leaves the order as typed, so there is nothing to show for it. */
export function asksNothing(style: ReplyStyle): boolean {
  return style.suffix === '';
}

export interface Order {
  /** What the chat shows the person said. */
  spoken: string;
  /** What the session receives. */
  order: string;
}

/** A quick reply goes as it is, with the reply style; a photo waiting in the box is not its. */
export function quickOrder(reply: string, style: ReplyStyle): Order {
  return composeOrder(reply, style, null);
}

/** A photo on its own is a complete order; words are optional then. */
export function composeOrder(text: string, style: ReplyStyle, photoPath: string | null): Order {
  const spoken = text || PHOTO_ONLY;
  let order = spoken + style.suffix;
  if (photoPath) order += '\n\nImagen adjunta: ' + photoPath;
  return { spoken, order };
}
