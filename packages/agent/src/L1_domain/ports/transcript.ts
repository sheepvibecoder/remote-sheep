import type { ChatMessage, ImageResult } from '@remote-sheep/protocol';

export type Located = { file: string } | { file: null; note: string };

/** Where an agent writes its conversation: Claude Code today, Codex later. */
export interface TranscriptSource {
  locate(pid: number | null, cwd: string): Promise<Located>;
  read(file: string): ChatMessage[];
  image(file: string, id: string): ImageResult | null;
  /** Calls onChange whenever the file grows; returns a function that stops watching. */
  watch(file: string, onChange: () => void): () => void;
}
