// Finds out whether a port is free: nothing may listen on it on any address, then it is let go.
//
// Listening on 0.0.0.0 for a moment is not enough on Windows: it succeeds while another program
// listens on 127.0.0.1 or ::1 only, and the agent would then share the port with it, so the PC's
// own browser (http://localhost:<port>) would reach that program instead. So the port must also
// bind on both loopback addresses, and nothing may answer a connection there. ::1 is skipped when
// this computer has no IPv6.

import { connect, createServer } from 'node:net';
import type { PortProbe } from '../../L1_domain/ports/port-probe';

const ADDRESSES = ['0.0.0.0', '127.0.0.1', '::1'];
/** Loopback answers at once; a connection still pending after this is nobody listening. */
const CONNECT_TIMEOUT_MS = 500;

type Bind = 'free' | 'busy' | 'absent';

function bind(port: number, host: string): Promise<Bind> {
  const server = createServer();
  return new Promise((resolve) => {
    server.once('error', (err: NodeJS.ErrnoException) => {
      // No such address here (IPv6 off) says nothing about the port.
      const absent = err.code === 'EADDRNOTAVAIL' || err.code === 'EAFNOSUPPORT';
      // EADDRINUSE, or EACCES for a port the system reserves: either way the agent cannot use it.
      resolve(absent ? 'absent' : 'busy');
    });
    server.listen({ port, host, exclusive: true }, () => server.close(() => resolve('free')));
  });
}

function answers(port: number, host: string): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = connect({ port, host });
    const done = (listening: boolean) => {
      socket.destroy();
      resolve(listening);
    };
    socket.setTimeout(CONNECT_TIMEOUT_MS, () => done(false));
    socket.once('connect', () => done(true));
    socket.once('error', () => done(false));
  });
}

export class TcpPortProbe implements PortProbe {
  async isFree(port: number): Promise<boolean> {
    for (const host of ADDRESSES) {
      if ((await bind(port, host)) === 'busy') return false;
    }
    for (const host of ['127.0.0.1', '::1']) {
      if (await answers(port, host)) return false;
    }
    return true;
  }
}
