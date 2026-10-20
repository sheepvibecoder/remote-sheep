import { describe, expect, it } from 'vitest';
import { DEFAULT_SPEECH_LANGUAGE, speechLanguage } from '../../src/L1_domain/speech-language';

describe('speechLanguage', () => {
  it('keeps the language a person already set', () => {
    expect(speechLanguage('es-PE', 'en-GB')).toBe('es-PE');
  });

  it("follows the browser's language when nobody set one", () => {
    expect(speechLanguage(null, 'fr-FR')).toBe('fr-FR');
    expect(speechLanguage('', 'de-DE')).toBe('de-DE');
  });

  it('falls back to US English when the browser names none', () => {
    expect(DEFAULT_SPEECH_LANGUAGE).toBe('en-US');
    expect(speechLanguage(null, '')).toBe('en-US');
    expect(speechLanguage(null, null)).toBe('en-US');
  });
});
