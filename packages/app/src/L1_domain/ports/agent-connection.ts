import type { Invite, KeyPair, Request, ResultOf, ServerMessage } from '@remote-sheep/protocol';
import type { LinkState } from '../link-state';

export interface ConnectionHandlers {
  message(message: ServerMessage): void;
  state(state: LinkState): void;
  /** Called after every successful (re)connection, with the id the agent knows this phone by. */
  ready(device: string): void;
}

/** What the phone presents to the agent on every handshake. */
export interface Credentials {
  phone: KeyPair;
  /** The agent the phone trusts; a peer without its private key never gets past the handshake. */
  agentKey: Uint8Array;
  /** The scanned invite while pairing; null for a phone that is already paired. */
  invite: Invite | null;
}

/** The line to the agent on the computer: a WebSocket today, the relay in stage 3. */
export interface AgentConnection {
  request<R extends Request>(request: R): Promise<ResultOf<R>>;
  close(): void;
}

/** Opens a connection with these credentials; the app gets it from the composition root. */
export type Connect = (credentials: Credentials, handlers: ConnectionHandlers) => AgentConnection;
