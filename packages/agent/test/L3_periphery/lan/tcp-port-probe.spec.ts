import { createServer, type AddressInfo, type Server } from 'node:net';
import { describe, expect, it } from 'vitest';
import { TcpPortProbe } from '../../../src/L3_periphery/lan/tcp-port-probe';

function listen(port: number): Promise<Server> {
  const server = createServer();
  return new Promise((resolve) => server.listen(port, '0.0.0.0', () => resolve(server)));
}

const close = (server: Server) => new Promise<void>((done) => server.close(() => done()));

describe('TcpPortProbe', () => {
  it('finds a busy port busy, a free one free, and lets it go after probing', async () => {
    const holder = await listen(0);
    const port = (holder.address() as AddressInfo).port;
    const probe = new TcpPortProbe();
    expect(await probe.isFree(port)).toBe(false);
    await close(holder);
    expect(await probe.isFree(port)).toBe(true);
    // The probe released the port: the agent can listen on it right after.
    await close(await listen(port));
  });
});
