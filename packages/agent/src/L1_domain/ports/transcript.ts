import type { ChatMessage, ImageResult } from '@remote-sheep/protocol';

export type Located = { file: string } | { file: null; note: string };

/** What a transcript holds for the phone: the conversation, the model replying in it and how full its context is. */
export interface Chat {
  messages: ChatMessage[];
  /** The model of the latest reply; null when the agent does not say. */
  model: string | null;
  /** How much of the context window the latest reply filled; null when the agent does not say. */
  usedTokens: number | null;
}

/** Where an agent writes its conversation: Claude Code today, Codex later. */
export interface TranscriptSource {
  locate(pid: number | null, cwd: string): Promise<Located>;
  read(file: string): Chat;
  image(file: string, id: string): ImageResult | null;
  /** Calls onChange whenever the file grows; returns a function that stops watching. */
  watch(file: string, onChange: () => void): () => void;
}
