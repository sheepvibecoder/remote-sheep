import { SPEECH_LANGUAGE_KEY, speechLanguage } from '../L1_domain/speech-language';

/** The element with this id, checked against the type the caller expects. */
export function $(id: string): HTMLElement;
export function $<T extends HTMLElement>(id: string, type: new () => T): T;
export function $(id: string, type: new () => HTMLElement = HTMLElement): HTMLElement {
  const el = document.getElementById(id);
  if (!el) throw new Error('missing #' + id);
  if (!(el instanceof type)) throw new Error('#' + id + ' is not a ' + type.name);
  return el;
}

/** A node the markup guarantees; a missing one is a broken page, so say which. */
export function must<T>(value: T | null | undefined, what: string): T {
  if (value === null || value === undefined) throw new Error('missing ' + what);
  return value;
}

export const flash = $('flash');

export function say(message: string, isError = false): void {
  flash.textContent = message;
  flash.className = isError ? 'err' : '';
}

/** Language for dictation and reading aloud. */
export function language(): string {
  return speechLanguage(localStorage.getItem(SPEECH_LANGUAGE_KEY), navigator.language);
}
