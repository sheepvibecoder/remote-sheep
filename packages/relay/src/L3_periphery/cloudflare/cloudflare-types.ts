// The slice of the Cloudflare runtime these adapters touch, as plain structural types.
//
// Declaring only what is used lets the adapters run in Node against small fakes: workerd is
// needed to deploy the relay, not to test it.

export interface WebSocketLike {
  send(data: ArrayBuffer | ArrayBufferView | string): void;
  close(code?: number, reason?: string): void;
  serializeAttachment(value: unknown): void;
  deserializeAttachment(): unknown;
}

export interface DurableObjectStateLike {
  acceptWebSocket(socket: WebSocketLike): void;
  getWebSockets(): WebSocketLike[];
  setWebSocketAutoResponse(pair: unknown): void;
  readonly storage: {
    get(key: string): Promise<unknown>;
    put(key: string, value: unknown): Promise<void>;
  };
}

/** What the relay's environment (vars, secrets) holds. */
export interface RelayEnv {
  /** Comma-separated access codes, set with `wrangler secret put ACCESS_CODES`. */
  readonly ACCESS_CODES?: string;
}

/** The pieces that exist only inside workerd: socket pairs, the 101 response, the auto-reply. */
export interface WorkerPlatform {
  createPair(): { client: unknown; server: WebSocketLike };
  upgradeResponse(client: unknown): Response;
  /** `ping` answered `pong` by the runtime, without waking the Durable Object. */
  keepaliveAutoResponse(): unknown;
}
