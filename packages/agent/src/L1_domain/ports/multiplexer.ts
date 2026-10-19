import type { AgentKind, Session, Workspace } from '@remote-sheep/protocol';

/** Whatever keeps the agents' terminals alive: Herdr today, tmux or zellij later. */
export interface Multiplexer {
  /** The panes running a coding agent. */
  listSessions(): Promise<Session[]>;
  /** The panes running a plain shell, with no coding agent in them. */
  listShells(): Promise<Session[]>;
  /** pid of the agent process in the pane, which ties the pane to its transcript. */
  processId(target: string): Promise<number | null>;
  readTerminal(session: Session): Promise<string>;
  /** Types the text into the pane and presses Enter. */
  sendPrompt(session: Session, text: string): Promise<void>;
  sendKeys(session: Session, keys: string[]): Promise<void>;
  /** The places a new session can start in. */
  listSpaces(): Promise<Workspace[]>;
  /** Starts a coding agent in a new terminal of this space; answers its target. */
  startSession(space: string, agent: AgentKind): Promise<string>;
  /** Opens a new terminal of this space with only its shell; answers its target. */
  startShell(space: string): Promise<string>;
}
