import { createServer, type AddressInfo, type Server } from 'node:net';
import { describe, expect, it } from 'vitest';
import { TcpPortProbe } from '../../../src/L3_periphery/lan/tcp-port-probe';

function listen(port: number, host = '0.0.0.0'): Promise<Server> {
  const server = createServer();
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, () => resolve(server));
  });
}

/** Whether this computer can listen on ::1 at all (IPv6 may be off). */
async function hasIpv6Loopback(): Promise<boolean> {
  try {
    await close(await listen(0, '::1'));
    return true;
  } catch {
    return false;
  }
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

  it('finds busy a port another program holds on 127.0.0.1 only, which 0.0.0.0 would not see', async () => {
    const holder = await listen(0, '127.0.0.1');
    const port = (holder.address() as AddressInfo).port;
    expect(await new TcpPortProbe().isFree(port)).toBe(false);
    await close(holder);
    expect(await new TcpPortProbe().isFree(port)).toBe(true);
  });

  it('finds busy a port another program holds on ::1 only, when IPv6 is on', async () => {
    if (!(await hasIpv6Loopback())) return;
    const holder = await listen(0, '::1');
    const port = (holder.address() as AddressInfo).port;
    expect(await new TcpPortProbe().isFree(port)).toBe(false);
    await close(holder);
  });
});
