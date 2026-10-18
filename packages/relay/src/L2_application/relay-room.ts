// The rules of one room: one agent and the phones paired with it.
//
// The relay forwards sealed frames and reads none of them. The room keeps no state in memory
// between calls: who is who lives in each socket's role and in the RoomStore, because the
// Durable Object that hosts it hibernates and forgets everything else.

import {
  CLOSE_AGENT_OFFLINE,
  CLOSE_PROTOCOL,
  decodeRelayEnvelope,
  encodeRelayEnvelope,
} from '@remote-sheep/protocol';
import type { AccessCodes } from '../L1_domain/ports/access-codes';
import type { RelaySocket } from '../L1_domain/ports/relay-socket';
import { isSendableCloseCode } from '@remote-sheep/protocol';
import type { RoomSockets } from '../L1_domain/ports/room-sockets';
import type { RoomStore } from '../L1_domain/ports/room-store';

/** What a platform hands over as a message: text, or the bytes of a binary frame. */
export type RoomMessage = string | ArrayBuffer;

export class RelayRoom {
  constructor(
    private readonly sockets: RoomSockets,
    private readonly store: RoomStore,
    private readonly codes: AccessCodes,
  ) {}

  /** Seats an accepted socket as the room's agent, replacing the one it had. */
  async connectAgent(socket: RelaySocket, ticket: string): Promise<void> {
    await this.store.setOwner(ticket);
    // Before naming the new socket, so that the old agent is the only one found.
    for (const old of this.sockets.all()) {
      if (old.role()?.role === 'agent') this.closeAgent(old, 1000, 'replaced');
    }
    socket.setRole({ role: 'agent' });
  }

  /** Asked before accepting a phone, so "offline" can be a plain HTTP 503. */
  agentOnline(): boolean {
    return this.agent() !== null;
  }

  async connectPhone(socket: RelaySocket): Promise<void> {
    const stream = await this.store.nextStream();
    // Looked up after the await: the agent may have left while the stream id was being stored.
    const agent = this.agent();
    if (agent === null) {
      socket.close(CLOSE_AGENT_OFFLINE, 'agent offline');
      return;
    }
    socket.setRole({ role: 'phone', stream });
    agent.send(encodeRelayEnvelope({ kind: 'open', stream }));
  }

  onMessage(socket: RelaySocket, message: RoomMessage): void {
    const role = socket.role();
    if (role === null || role.role === 'closed') return;
    if (role.role === 'phone') {
      if (typeof message === 'string') {
        this.dropPhone(socket, role.stream, CLOSE_PROTOCOL, 'text frames are not allowed');
        return;
      }
      const agent = this.agent();
      if (agent === null) {
        this.dropPhone(socket, role.stream, CLOSE_AGENT_OFFLINE, 'agent offline');
        return;
      }
      agent.send(
        encodeRelayEnvelope({ kind: 'data', stream: role.stream, data: new Uint8Array(message) }),
      );
      return;
    }
    const envelope =
      typeof message === 'string' ? null : decodeRelayEnvelope(new Uint8Array(message));
    if (envelope === null || envelope.kind === 'open') {
      this.closeAgent(socket, CLOSE_PROTOCOL, 'malformed envelope');
      return;
    }
    const phone = this.phone(envelope.stream);
    if (phone === undefined) return;
    if (envelope.kind === 'data') {
      phone.send(envelope.data);
    } else {
      // Verbatim: 4001, 4002 and 4003 tell the phone why, and the relay must not blur it.
      phone.setRole({ role: 'closed' });
      phone.close(envelope.code, envelope.reason);
    }
  }

  onClose(socket: RelaySocket, code: number): void {
    const role = socket.role();
    if (role === null || role.role === 'closed') return;
    socket.setRole({ role: 'closed' });
    if (role.role === 'agent') {
      this.closePhones();
      return;
    }
    this.agent()?.send(
      encodeRelayEnvelope({
        kind: 'close',
        stream: role.stream,
        code: isSendableCloseCode(code) ? code : 1000,
        reason: '',
      }),
    );
  }

  onError(socket: RelaySocket): void {
    this.onClose(socket, 1000);
  }

  /**
   * Asked before any socket is accepted, so a refusal can be a plain HTTP 403: a socket closed
   * inside the upgrade leaves its TCP connection open and the client learns of it late.
   * Returns a ticket for connectAgent (the hash of the code), or null when the code may not
   * serve this room.
   */
  async admitAgent(code: string | null): Promise<string | null> {
    const issued = this.codes.issued().filter((entry) => entry !== '');
    if (code === null || code === '' || !issued.includes(code)) return null;
    const hash = await this.codes.fingerprint(code);
    const owner = await this.store.owner();
    if (owner === null || owner === hash) return hash;
    // The owner's code may have been withdrawn since; then the room is free to claim again.
    const hashes = await Promise.all(issued.map((entry) => this.codes.fingerprint(entry)));
    return hashes.includes(owner) ? null : hash;
  }

  private agent(): RelaySocket | null {
    return this.sockets.all().find((socket) => socket.role()?.role === 'agent') ?? null;
  }

  private phone(stream: number): RelaySocket | undefined {
    return this.sockets.all().find((socket) => {
      const role = socket.role();
      return role?.role === 'phone' && role.stream === stream;
    });
  }

  private closeAgent(socket: RelaySocket, code: number, reason: string): void {
    socket.setRole({ role: 'closed' });
    socket.close(code, reason);
    this.closePhones();
  }

  private closePhones(): void {
    for (const socket of this.sockets.all()) {
      if (socket.role()?.role !== 'phone') continue;
      socket.setRole({ role: 'closed' });
      socket.close(CLOSE_AGENT_OFFLINE, 'agent offline');
    }
  }

  /** The relay closes a phone on its own; the agent still has to forget the stream. */
  private dropPhone(socket: RelaySocket, stream: number, code: number, reason: string): void {
    socket.setRole({ role: 'closed' });
    socket.close(code, reason);
    this.agent()?.send(encodeRelayEnvelope({ kind: 'close', stream, code, reason: '' }));
  }
}
