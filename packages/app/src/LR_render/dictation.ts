// Dictation. It runs in the browser and costs no tokens.

import { $, language, say } from './dom';

interface Alternative {
  transcript: string;
}
type ResultList = ArrayLike<ArrayLike<Alternative>>;
interface Engine {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: { results: ResultList }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

const Recognition = ((window as unknown as Record<string, unknown>)['SpeechRecognition'] ||
  (window as unknown as Record<string, unknown>)['webkitSpeechRecognition']) as
  (new () => Engine) | undefined;

const mic = $('mic', HTMLButtonElement);
const text = $('text', HTMLTextAreaElement);

let recognition: Engine | null = null;
let baseText = '';
// Phrases finished in earlier runs of the engine. One run hears one phrase.
let settled = '';
// What the current run has heard so far.
let phrase = '';

export function stopDictation(): void {
  mic.classList.remove('on');
  if (recognition) {
    const ending = recognition;
    recognition = null;
    ending.stop();
  }
  announce();
}

// Devices disagree on what a result holds: Android Chrome repeats the whole
// phrase heard so far, while others send only the newly recognised words.
// Keeping a result that already contains what we have, and appending the one
// that does not, reads both correctly. It also recomputes from the list every
// time, so a result announced twice changes nothing.
function phraseFrom(results: ResultList): string {
  let out = '';
  for (const result of Array.from(results)) {
    const said = result[0]?.transcript ?? '';
    if (said.startsWith(out)) out = said;
    else out += said;
  }
  return out;
}

function paint(): void {
  text.value = (baseText + ' ' + settled + ' ' + phrase).replace(/\s+/g, ' ').trim();
  announce();
}

// The view sizes the box and swaps mic for send on `input`; a value set from
// code fires none, so dictation raises it itself.
function announce(): void {
  text.dispatchEvent(new Event('input'));
}

function startDictation(Engine: new () => Engine): void {
  const engine = new Engine();
  engine.lang = language();
  // One phrase per run. In continuous mode Android reports every result with
  // the whole phrase so far rather than just the new words, so joining the
  // results pasted each phrase back on top of itself.
  engine.continuous = false;
  engine.interimResults = true;
  baseText = text.value.trim();
  settled = '';
  phrase = '';

  engine.onresult = (event) => {
    phrase = phraseFrom(event.results);
    paint();
  };
  engine.onerror = (event) => {
    stopDictation();
    say(
      event.error === 'not-allowed'
        ? 'microphone blocked (needs https or permission)'
        : 'dictation: ' + event.error,
      true,
    );
  };
  engine.onend = () => {
    // Each run ends at a pause. Bank the phrase it heard, then listen again
    // while the button is lit.
    if (recognition === engine && mic.classList.contains('on')) {
      settled = (settled + ' ' + phrase).replace(/\s+/g, ' ').trim();
      phrase = '';
      engine.start();
    } else {
      mic.classList.remove('on');
      announce();
    }
  };

  recognition = engine;
  mic.classList.add('on');
  say('listening (' + engine.lang + ')');
  engine.start();
}

if (!Recognition) {
  mic.disabled = true;
  mic.title = 'dictation not supported by this browser';
} else {
  mic.addEventListener('click', () => {
    if (mic.classList.contains('on')) {
      stopDictation();
      say('');
    } else {
      startDictation(Recognition);
    }
  });
}
