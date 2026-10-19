// How fast replies are read aloud. A few steps, not a slider: it is a thumb-sized choice.

export interface SpeechRate {
  label: string;
  rate: number;
}

export const SPEECH_RATES: readonly SpeechRate[] = [
  { label: 'Slow', rate: 0.8 },
  { label: 'Normal', rate: 1.05 },
  { label: 'Fast', rate: 1.25 },
  { label: 'Faster', rate: 1.5 },
];

export const DEFAULT_SPEECH_RATE = 1.05;

/** A stored speed that is still on offer, else Normal. */
export function speechRate(stored: string | null): number {
  const rate = Number(stored);
  return SPEECH_RATES.find((step) => step.rate === rate)?.rate ?? DEFAULT_SPEECH_RATE;
}
