// What Enter does in the message box, as in WhatsApp: with a keyboard and mouse Enter sends and
// Shift+Enter breaks the line; on a touch screen Enter breaks the line and the button sends,
// because the on-screen keyboard has no Shift+Enter.

export interface EnterPress {
  key: string;
  shiftKey: boolean;
  /** An input method (accents, Chinese, Japanese) uses Enter to pick a word; that Enter is its. */
  isComposing: boolean;
}

/** Whether this key press sends the message instead of reaching the box. */
export function enterSends(press: EnterPress, keyboardAndMouse: boolean): boolean {
  return keyboardAndMouse && press.key === 'Enter' && !press.shiftKey && !press.isComposing;
}
