import type { RelaySocket, SocketRole } from '../../L1_domain/ports/relay-socket';
import type { WebSocketLike } from './cloudflare-types';

const ROLES = new Set(['agent', 'phone', 'closed']);

/** A hibernatable WebSocket as a room socket; its role lives in the socket's attachment. */
export class CloudflareSocket implements RelaySocket {
  constructor(private readonly socket: WebSocketLike) {}

  send(data: Uint8Array): void {
    // A peer that already left throws here; its close event does the cleanup.
    try {
      this.socket.send(data);
    } catch {
      // Nothing to deliver to.
    }
  }

  close(code: number, reason: string): void {
    // Closing a socket the peer already closed throws; the goal is reached either way.
    try {
      this.socket.close(code, reason);
    } catch {
      // Already closed.
    }
  }

  role(): SocketRole | null {
    const value = this.socket.deserializeAttachment();
    if (typeof value !== 'object' || value === null) return null;
    const role = (value as { role?: unknown }).role;
    return typeof role === 'string' && ROLES.has(role) ? (value as SocketRole) : null;
  }

  setRole(role: SocketRole): void {
    this.socket.serializeAttachment(role);
  }
}
