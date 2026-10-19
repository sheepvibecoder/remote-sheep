// Reading replies aloud. It runs in the browser and costs no tokens.

import { DEFAULT_SPEECH_RATE, SPEECH_RATES } from '../L1_domain/speech-rate';
import type { Store } from '../L2_application/app.store';
import { $, language, say } from './dom';
import { speakable } from './rich-text';

const button = $('toggle-speak');
let enabled = localStorage.getItem('speak') === '1';
/** The speed the store holds, copied here by `drawSpeed`. */
let rate = DEFAULT_SPEECH_RATE;

export function speak(raw: string): void {
  if (!('speechSynthesis' in window)) {
    say('this browser cannot read aloud', true);
    return;
  }
  // Only the first paragraph: the point is not to listen to a whole report.
  const first = speakable(raw).split(/\n\s*\n/)[0];
  if (!first) return;
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(first.slice(0, 700));
  utterance.lang = language();
  utterance.rate = rate;
  speechSynthesis.speak(utterance);
}

export function autoSpeak(): boolean {
  return enabled;
}

function apply(): void {
  button.classList.toggle('on', enabled);
  if (!enabled && 'speechSynthesis' in window) speechSynthesis.cancel();
}

button.addEventListener('click', () => {
  enabled = !enabled;
  localStorage.setItem('speak', enabled ? '1' : '0');
  apply();
  // The first utterance has to come from a tap, or mobile browsers stay mute.
  if (enabled) speak('listo');
});
apply();

// The speed is chosen in Settings; each tap also reads a sample so the change can be heard.
const speeds = $('speeds');

/** Marks the speed the store holds and reads aloud at it from now on. */
export function drawSpeed(current: number): void {
  rate = current;
  for (const option of speeds.children) {
    option.classList.toggle('on', Number((option as HTMLElement).dataset['rate']) === current);
  }
}

/** Builds the speed options, each handing its pick to the store, and marks the current one. */
export function startSpeeds(store: Store): void {
  for (const step of SPEECH_RATES) {
    const option = document.createElement('button');
    option.dataset['rate'] = String(step.rate);
    option.textContent = step.label;
    option.addEventListener('click', () => {
      store.setSpeechRate(step.rate);
      speak('Así suena esta velocidad.');
    });
    speeds.append(option);
  }
  drawSpeed(store.state.speechRate);
}
