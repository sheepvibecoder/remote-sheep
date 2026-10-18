// Appended to an order so the reply is short enough to listen to.
const BRIEF = ' (responde en 2 lineas como maximo)';
const PHOTO_ONLY = 'Mira esta imagen.';

export interface Order {
  /** What the chat shows the person said. */
  spoken: string;
  /** What the session receives. */
  order: string;
}

/** A photo on its own is a complete order; words are optional then. */
export function composeOrder(text: string, brief: boolean, photoPath: string | null): Order {
  const spoken = text || PHOTO_ONLY;
  let order = brief ? spoken + BRIEF : spoken;
  if (photoPath) order += '\n\nImagen adjunta: ' + photoPath;
  return { spoken, order };
}
