import type {
  DurableObjectStateLike,
  WebSocketLike,
  WorkerPlatform,
} from '../../src/L3_periphery/cloudflare/cloudflare-types';

export class FakeWebSocket implements WebSocketLike {
  readonly sent: unknown[] = [];
  closed: { code?: number; reason?: string } | null = null;
  attachment: unknown = null;
  /** Makes send and close throw, like a socket whose peer already left. */
  broken = false;

  send(data: ArrayBuffer | ArrayBufferView | string): void {
    if (this.broken) throw new Error('socket is closed');
    this.sent.push(data);
  }
  close(code?: number, reason?: string): void {
    if (this.broken) throw new Error('socket is closed');
    this.closed = { code, reason };
  }
  serializeAttachment(value: unknown): void {
    this.attachment = structuredClone(value);
  }
  deserializeAttachment(): unknown {
    return this.attachment;
  }
}

export class FakeState implements DurableObjectStateLike {
  readonly accepted: WebSocketLike[] = [];
  readonly data = new Map<string, unknown>();
  autoResponse: unknown = null;
  readonly storage = {
    get: async (key: string) => this.data.get(key),
    put: async (key: string, value: unknown) => {
      this.data.set(key, value);
    },
  };
  acceptWebSocket(socket: WebSocketLike): void {
    this.accepted.push(socket);
  }
  getWebSockets(): WebSocketLike[] {
    return this.accepted;
  }
  setWebSocketAutoResponse(pair: unknown): void {
    this.autoResponse = pair;
  }
}

export class FakePlatform implements WorkerPlatform {
  readonly servers: FakeWebSocket[] = [];
  createPair() {
    const server = new FakeWebSocket();
    this.servers.push(server);
    return { client: 'client-end', server };
  }
  // Node refuses a 101 Response, so the upgrade is stood in for by a marked 200.
  upgradeResponse(client: unknown): Response {
    return new Response(null, { status: 200, headers: { 'x-upgraded': String(client) } });
  }
  keepaliveAutoResponse(): unknown {
    return 'ping-pong';
  }
}
