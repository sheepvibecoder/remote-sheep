// Numbered questions in the raw terminal ("Do you want to proceed? 1. Yes 2. No"). They never
// reach the transcript, so the phone reads them from the pane text and offers the answers as
// buttons instead of making the person find the digit keys.

export interface PaneChoice {
  /** The key that answers it: the option's number. */
  key: string;
  label: string;
  /** The option the pane's cursor (❯) is on. */
  selected: boolean;
}

const OPTION = /^\s*([❯>›]\s*)?(\d+)\.\s+(\S.*?)\s*$/;

/** Lines after the last option that may still belong to the prompt (a blank line, "Esc to cancel"). */
const MAX_FOOTER_LINES = 3;

/** The answers of the question the pane is asking now; empty when it asks none. */
export function paneChoices(terminal: string): PaneChoice[] {
  const lines = terminal.split('\n');
  while (lines.length > 0 && lines[lines.length - 1]?.trim() === '') lines.pop();

  let last = -1;
  for (let i = lines.length - 1; i >= 0 && i >= lines.length - 1 - MAX_FOOTER_LINES; i--) {
    if (OPTION.test(lines[i] ?? '')) {
      last = i;
      break;
    }
  }
  if (last < 0) return [];

  const choices: PaneChoice[] = [];
  for (let i = last; i >= 0; i--) {
    const match = OPTION.exec(lines[i] ?? '');
    if (!match) break;
    choices.unshift({
      key: match[2] ?? '',
      label: match[3] ?? '',
      selected: match[1] !== undefined,
    });
  }
  const counted = choices.every((choice, i) => choice.key === String(i + 1));
  return choices.length >= 2 && counted ? choices : [];
}
