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

/** Orders sent with one tap, above the message box. Spanish, like the sessions they reach. */
export const QUICK_REPLIES: readonly string[] = [
  'Continúa',
  'Corre los tests',
  'Haz commit',
  'Explícame el cambio',
];

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
