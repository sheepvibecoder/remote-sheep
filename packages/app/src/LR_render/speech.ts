// Reading replies aloud. It runs in the browser and costs no tokens.

import { SPEECH_RATES, speechRate } from '../L1_domain/speech-rate';
import { $, language, say } from './dom';
import { speakable } from './rich-text';

const button = $('toggle-speak');
let enabled = localStorage.getItem('speak') === '1';

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
  utterance.rate = speechRate(localStorage.getItem('rate'));
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
function showRate(): void {
  const current = speechRate(localStorage.getItem('rate'));
  for (const option of speeds.children) {
    option.classList.toggle('on', Number((option as HTMLElement).dataset['rate']) === current);
  }
}
for (const step of SPEECH_RATES) {
  const option = document.createElement('button');
  option.dataset['rate'] = String(step.rate);
  option.textContent = step.label;
  option.addEventListener('click', () => {
    localStorage.setItem('rate', String(step.rate));
    showRate();
    speak('Así suena esta velocidad.');
  });
  speeds.append(option);
}
showRate();
