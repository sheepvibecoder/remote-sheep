import type { AddressInfo } from 'node:net';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { WebSocketServer, type WebSocket as ServerSocket } from 'ws';
import {
  acceptHandshake,
  CLOSE_AGENT_OFFLINE,
  CLOSE_PAIRING_EXPIRED,
  CLOSE_PROTOCOL,
  CLOSE_UNAUTHORIZED,
  decodeClientMessage,
  decodeHello,
  encodeClientMessage,
  encodeServerMessage,
  encodeWelcome,
  generateKeyPair,
  PROTOCOL,
  publicKeyId,
  RELAY_PING,
  RELAY_PONG,
  verifyPairingProof,
  type ClientMessage,
  type Hello,
  type KeyPair,
  type SecureSession,
  type ServerMessage,
} from '@remote-sheep/protocol';
import type { LinkState } from '../../src/L1_domain/link-state';
import type { Credentials } from '../../src/L1_domain/ports/agent-connection';
import {
  agentUrl,
  WebSocketAgentConnection,
} from '../../src/L3_periphery/websocket-agent-connection';

// The adapter listens for the page becoming visible again; Node has no document.
const page = Object.assign(new EventTarget(), { hidden: false });

interface Phone {
  connection: WebSocketAgentConnection;
  states: LinkState[];
  pushed: ServerMessage[];
  devices: string[];
}

/** One connection as the test agent saw it. */
interface Seen {
  socket: ServerSocket;
  hello: Hello | null;
  session: SecureSession | null;
  /** Every binary frame the phone put on the wire, as raw bytes. */
  wire: Uint8Array[];
  messages: ClientMessage[];
  /** Whether the confirm's proof checked out against the invite secret; null without proof. */
  proof: boolean | null;
  closedWith: number | null;
  /** Text frames from the phone: only keepalive pings are expected. */
  texts: string[];
}

/** How the test agent treats a hello: answer it, or close with a code before any key exists. */
type OnHello = (socket: ServerSocket, hello: Hello) => 'accept' | 'refused';

describe('WebSocketAgentConnection', () => {
  let server: WebSocketServer;
  let url: string;
  let agent: KeyPair;
  let handshakeKeys: KeyPair;
  let secret: Uint8Array;
  let onHello: OnHello;
  /** A man in the middle cannot open the confirm, but answers `ready` anyway. */
  let ignoreBadConfirm: boolean;
  let seen: Seen[];
  let phone: Phone | null = null;

  beforeAll(async () => {
    (globalThis as { document?: unknown }).document = page;
    server = new WebSocketServer({ port: 0 });
    await new Promise<void>((resolve) => server.once('listening', () => resolve()));
    url = 'ws://127.0.0.1:' + (server.address() as AddressInfo).port;
    server.on('connection', (socket) => {
      const entry: Seen = {
        socket,
        hello: null,
        session: null,
        wire: [],
        messages: [],
        proof: null,
        closedWith: null,
        texts: [],
      };
      seen.push(entry);
      socket.on('close', (code) => (entry.closedWith = code));
      socket.on('message', (data: Buffer, isBinary: boolean) => {
        if (!isBinary) {
          entry.texts.push(data.toString());
          return;
        }
        const bytes = new Uint8Array(data);
        entry.wire.push(bytes);
        if (!entry.session) {
          const greeting = decodeHello(bytes);
          if (!greeting) {
            socket.close(CLOSE_UNAUTHORIZED);
            return;
          }
          entry.hello = greeting;
          if (onHello(socket, greeting) === 'refused') return;
          const accepted = acceptHandshake(handshakeKeys, greeting);
          entry.session = accepted.session;
          socket.send(encodeWelcome(accepted.welcome));
          return;
        }
        const session = entry.session;
        let message: ClientMessage | null;
        try {
          message = decodeClientMessage(session.open(bytes));
        } catch {
          if (!ignoreBadConfirm) {
            socket.close(CLOSE_UNAUTHORIZED);
            return;
          }
          message = { type: 'confirm' };
        }
        if (!message) {
          socket.close(CLOSE_UNAUTHORIZED);
          return;
        }
        entry.messages.push(message);
        if (message.type === 'confirm') {
          if (message.proof) {
            entry.proof = verifyPairingProof(secret, session.transcript, message.proof);
          }
          const device = publicKeyId(hello(entry).identity);
          seal(entry, { type: 'ready', protocol: PROTOCOL, version: '0.3.0', device });
          return;
        }
        answer(entry, message);
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  afterEach(() => {
    phone?.connection.close();
    phone = null;
    for (const entry of seen) entry.socket.terminate();
  });

  function hello(entry: Seen): Hello {
    if (!entry.hello) throw new Error('no hello yet');
    return entry.hello;
  }

  function at(index: number): Seen {
    const entry = seen[index];
    if (!entry) throw new Error('no connection ' + String(index));
    return entry;
  }

  function seal(entry: Seen, message: ServerMessage): void {
    if (!entry.session) throw new Error('no session yet');
    entry.socket.send(entry.session.seal(encodeServerMessage(message)));
  }

  function answer(entry: Seen, message: ClientMessage): void {
    if (message.type !== 'request') return;
    const { id, request } = message;
    if (request.kind === 'image') {
      seal(entry, {
        type: 'reply',
        id,
        ok: true,
        result: { media: 'image/png', data: new Uint8Array([7, 8]) },
      });
    } else if (request.kind === 'prompt') {
      seal(entry, { type: 'reply', id, ok: false, error: 'unknown session: ' + request.target });
    } else if (request.kind === 'watch') {
      seal(entry, { type: 'reply', id, ok: true });
    }
  }

  interface Setup {
    /** Pair with an invite for the test agent instead of connecting as a paired phone. */
    pair?: boolean;
    onHello?: OnHello;
    agentKeys?: KeyPair;
    ignoreBadConfirm?: boolean;
    keepaliveMs?: number;
  }

  const phoneKeys = generateKeyPair();

  function setup(options: Setup = {}): Phone {
    seen = [];
    agent = generateKeyPair();
    handshakeKeys = options.agentKeys ?? agent;
    secret = crypto.getRandomValues(new Uint8Array(32));
    onHello = options.onHello ?? (() => 'accept');
    ignoreBadConfirm = options.ignoreBadConfirm ?? false;
    const credentials: Credentials = {
      phone: phoneKeys,
      agentKey: agent.publicKey,
      invite: options.pair
        ? { agentKey: agent.publicKey, secret, expiresAt: Date.now() + 60_000 }
        : null,
    };
    const created: Phone = {
      connection: null as unknown as WebSocketAgentConnection,
      states: [],
      pushed: [],
      devices: [],
    };
    created.connection = new WebSocketAgentConnection(
      url,
      credentials,
      {
        message: (message) => created.pushed.push(message),
        state: (state) => created.states.push(state),
        ready: (device) => created.devices.push(device),
      },
      options.keepaliveMs === undefined ? {} : { keepaliveMs: options.keepaliveMs },
    );
    phone = created;
    return created;
  }

  async function until(check: () => boolean, ms = 3000): Promise<void> {
    for (let waited = 0; !check() && waited < ms; waited += 10) {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    expect(check()).toBe(true);
  }

  it('pairs with an invite: the agent can verify the proof, then the link opens', async () => {
    const q = setup({ pair: true });
    await until(() => q.devices.length === 1);
    const first = at(0);
    expect(hello(first).pair).toBe(true);
    expect([...hello(first).identity]).toEqual([...phoneKeys.publicKey]);
    expect(first.proof).toBe(true);
    expect(q.devices).toEqual([publicKeyId(phoneKeys.publicKey)]);
    expect(q.states).toEqual(['connecting', 'open']);
  });

  it('reconnects after pairing as a paired phone, with fresh ephemeral keys', async () => {
    const q = setup({ pair: true });
    await until(() => q.devices.length === 1);
    at(0).socket.terminate();
    await until(() => q.devices.length === 2);
    const second = at(1);
    expect(hello(second).pair).toBe(false);
    expect(second.messages[0]).toEqual({ type: 'confirm' });
    expect([...hello(second).ephemeral]).not.toEqual([...hello(at(0)).ephemeral]);
    expect(q.states).toEqual(['connecting', 'open', 'closed', 'connecting', 'open']);
  });

  it('connects with a stored pairing: no pairing flag and no proof', async () => {
    const p = setup();
    await until(() => p.devices.length === 1);
    expect(hello(at(0)).pair).toBe(false);
    expect(at(0).messages).toEqual([{ type: 'confirm' }]);
    expect(at(0).proof).toBeNull();
    expect(p.states).toEqual(['connecting', 'open']);
  });

  it('answers each request with its own typed result, bytes included', async () => {
    const p = setup();
    await until(() => p.devices.length === 1);
    const image = await p.connection.request({ kind: 'image', target: 'p1', id: 'u:0' });
    expect(image.media).toBe('image/png');
    expect([...image.data]).toEqual([7, 8]);
    await expect(
      p.connection.request({ kind: 'watch', target: null, terminal: false }),
    ).resolves.toBeUndefined();
    await expect(p.connection.request({ kind: 'prompt', target: 'p9', text: 'x' })).rejects.toThrow(
      'unknown session: p9',
    );
  });

  it('puts only sealed bytes on the wire after the hello', async () => {
    const p = setup();
    await until(() => p.devices.length === 1);
    const request = { kind: 'prompt', target: 'secret-pane', text: 'hello there' } as const;
    await expect(p.connection.request(request)).rejects.toThrow();
    const wire = at(0).wire;
    const plain = encodeClientMessage({ type: 'request', id: 1, request });
    const sent = wire[wire.length - 1] ?? new Uint8Array();
    expect(sent).not.toEqual(plain);
    expect(decodeClientMessage(sent)).toBeNull();
    expect(new TextDecoder().decode(sent)).not.toContain('secret-pane');
    // Every frame but the hello is opaque to anyone without the session keys.
    for (const frame of wire.slice(1)) expect(decodeClientMessage(frame)).toBeNull();
  });

  it('hands every sealed push that is not a reply to the page', async () => {
    const p = setup();
    await until(() => p.devices.length === 1);
    seal(at(0), { type: 'status', herdrError: 'herdr is not running' });
    await until(() => p.pushed.length === 1);
    expect(p.pushed).toEqual([{ type: 'status', herdrError: 'herdr is not running' }]);
  });

  it('refuses a request while the link is not open', async () => {
    const p = setup({ onHello: () => 'refused' });
    await expect(
      p.connection.request({ kind: 'watch', target: null, terminal: false }),
    ).rejects.toThrow('not connected to your computer');
  });

  it.each([
    [CLOSE_UNAUTHORIZED, 'unauthorized'],
    [CLOSE_PROTOCOL, 'outdated'],
    [CLOSE_PAIRING_EXPIRED, 'expired'],
  ] as const)('stops for good on close code %i and reports %s', async (code, state) => {
    const p = setup({
      onHello: (socket) => {
        socket.close(code, 'no');
        return 'refused';
      },
    });
    await until(() => p.states.includes(state));
    await new Promise((resolve) => setTimeout(resolve, 1300));
    expect(seen).toHaveLength(1);
    expect(p.states).toEqual(['connecting', state]);
  });

  it('closes the connection on a tampered frame from the agent', async () => {
    const p = setup();
    await until(() => p.devices.length === 1);
    const entry = at(0);
    if (!entry.session) throw new Error('no session');
    const sealed = entry.session.seal(encodeServerMessage({ type: 'status', herdrError: null }));
    sealed[0] = (sealed[0] ?? 0) ^ 1;
    entry.socket.send(sealed);
    await until(() => entry.closedWith !== null);
    expect(p.pushed).toEqual([]);
    expect(p.states).toEqual(['connecting', 'open', 'unauthorized']);
    await new Promise((resolve) => setTimeout(resolve, 1300));
    expect(seen).toHaveLength(1);
  });

  it('never opens against an agent with another key, even one that answers ready', async () => {
    const p = setup({ agentKeys: generateKeyPair(), ignoreBadConfirm: true });
    await until(() => (seen[0]?.closedWith ?? null) !== null);
    expect(p.devices).toEqual([]);
    expect(p.states).not.toContain('open');
    expect(p.states).toEqual(['connecting', 'unauthorized']);
  });

  it('is closed by the real agent when it holds another key', async () => {
    const p = setup({ agentKeys: generateKeyPair() });
    await until(() => p.states.includes('unauthorized'));
    // The close reaches the test agent a moment after the phone gives up.
    await until(() => at(0).closedWith === CLOSE_UNAUTHORIZED);
    expect(p.devices).toEqual([]);
  });

  it('sends keepalive pings while open and takes the pong in stride', async () => {
    const p = setup({ keepaliveMs: 20 });
    await until(() => p.devices.length === 1);
    await until(() => at(0).texts.length >= 2);
    expect(new Set(at(0).texts)).toEqual(new Set([RELAY_PING]));
    at(0).socket.send(RELAY_PONG);
    const answered = p.connection.request({ kind: 'watch', target: null, terminal: false });
    await expect(answered).resolves.toBeUndefined();
    expect(at(0).closedWith).toBeNull();
    expect(p.states).not.toContain('unauthorized');
  });

  it('still hangs up on any other text frame', async () => {
    const p = setup();
    await until(() => p.devices.length === 1);
    at(0).socket.send('hello there');
    await until(() => p.states.includes('unauthorized'));
    await until(() => at(0).closedWith === CLOSE_UNAUTHORIZED);
  });

  it('keeps retrying when the relay says the agent is offline', async () => {
    const p = setup({
      onHello: (socket) => (socket.close(CLOSE_AGENT_OFFLINE, 'agent offline'), 'refused'),
    });
    await until(() => seen.length >= 2);
    expect(p.states).toContain('closed');
    expect(p.states).not.toContain('unauthorized');
  });

  it('fails pending requests when the link drops, and reconnects on its own', async () => {
    const p = setup();
    await until(() => p.devices.length === 1);
    // The test agent never answers keys, so this request is still waiting when the link drops.
    const pending = p.connection.request({ kind: 'keys', target: 'p1', keys: ['esc'] });
    await until(() => at(0).messages.some((m) => m.type === 'request'));
    at(0).socket.terminate();
    await expect(pending).rejects.toThrow('connection lost');
    await until(() => p.devices.length === 2);
    expect(p.states).toContain('closed');
    expect(seen).toHaveLength(2);
    expect(hello(at(1)).pair).toBe(false);
  });
});

describe('agentUrl', () => {
  it('names the agent room, over wss when the page came over https', () => {
    const agentKey = generateKeyPair().publicKey;
    const room = publicKeyId(agentKey);
    expect(agentUrl({ protocol: 'https:', host: 'relay.example.com' }, agentKey)).toBe(
      'wss://relay.example.com/ws?agent=' + room,
    );
    expect(agentUrl({ protocol: 'http:', host: '192.168.1.5:3999' }, agentKey)).toBe(
      'ws://192.168.1.5:3999/ws?agent=' + room,
    );
  });
});
