// How large the chat text is drawn. Four steps, all shown at once; the phone keeps the step number
// under the key it always used, so a size picked before the steps had names is kept.

export interface TextSize {
  step: number;
  label: string;
  px: string;
}

const NORMAL: TextSize = { step: 1, label: 'Normal', px: '17px' };

export const TEXT_SIZES: readonly TextSize[] = [
  { step: 0, label: 'Small', px: '15px' },
  NORMAL,
  { step: 2, label: 'Large', px: '20px' },
  { step: 3, label: 'Extra large', px: '23px' },
];

export const DEFAULT_TEXT_SIZE = NORMAL.step;

/** Where the phone keeps the step: the key it always used, read by the store and the first paint. */
export const TEXT_SIZE_KEY = 'size';

/** A stored step that is still on offer, else Normal. Compared as text: `Number('')` is 0, Small. */
export function textSize(stored: string | null): number {
  return TEXT_SIZES.find((size) => String(size.step) === stored)?.step ?? DEFAULT_TEXT_SIZE;
}

/** The CSS size of a step, Normal's for one that is not on offer. */
export function textSizePx(step: number): string {
  return (TEXT_SIZES.find((size) => size.step === step) ?? NORMAL).px;
}
