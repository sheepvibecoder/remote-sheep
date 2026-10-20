// The language dictation listens in and replies are read aloud in. Nobody picks it in the app:
// it follows the browser, so a phone set up in any language works without a setting.

export const SPEECH_LANGUAGE_KEY = 'lang';

export const DEFAULT_SPEECH_LANGUAGE = 'en-US';

/** A language the person stored, else the browser's, else US English. */
export function speechLanguage(stored: string | null, browser: string | null): string {
  return stored || browser || DEFAULT_SPEECH_LANGUAGE;
}
