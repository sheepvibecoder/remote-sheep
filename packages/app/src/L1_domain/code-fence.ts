// Fenced code: the one piece of markdown the chat lays out as a block. Everything else stays
// prose; its inline marks (bold, `code`) are drawn by rich-text.ts in the view.

export type Piece =
  { kind: 'text'; text: string } | { kind: 'code'; language: string; code: string };

// Tested on one line at a time, so the info text after the language needs no pattern of its own.
const FENCE = /^```([\w+-]*)/;

/** Prose and fenced code, in order. A fence still being written runs to the end. */
export function splitCode(raw: string): Piece[] {
  const pieces: Piece[] = [];
  let prose: string[] = [];
  let code: string[] | null = null;
  let language = '';
  const flushProse = () => {
    const text = prose.join('\n').trim();
    if (text) pieces.push({ kind: 'text', text });
    prose = [];
  };
  for (const line of raw.split('\n')) {
    const fence = FENCE.exec(line.trim());
    if (code === null && fence) {
      flushProse();
      code = [];
      language = fence[1] ?? '';
    } else if (code !== null && line.trim() === '```') {
      pieces.push({ kind: 'code', language, code: code.join('\n') });
      code = null;
    } else if (code !== null) {
      code.push(line);
    } else {
      prose.push(line);
    }
  }
  if (code !== null) pieces.push({ kind: 'code', language, code: code.join('\n') });
  flushProse();
  return pieces;
}

// Fences name languages by their file extension; the block's label spells the common ones out.
const LANGUAGES: Readonly<Record<string, string>> = {
  ts: 'typescript',
  js: 'javascript',
  py: 'python',
  sh: 'shell',
  bash: 'shell',
  rb: 'ruby',
  md: 'markdown',
  yml: 'yaml',
};

/** The label of a code block: its language, spelled out, or plain code when the fence names none. */
export function languageName(tag: string): string {
  const name = tag.toLowerCase();
  return LANGUAGES[name] ?? (name || 'code');
}
