// Finds out whether a port is free by listening on it for a moment, on the same address the LAN
// transport uses, then letting it go.

import { createServer } from 'node:net';
import type { PortProbe } from '../../L1_domain/ports/port-probe';

export class TcpPortProbe implements PortProbe {
  isFree(port: number): Promise<boolean> {
    const server = createServer();
    return new Promise((resolve) => {
      // EADDRINUSE, or EACCES for a port the system reserves: either way the agent cannot use it.
      server.once('error', () => resolve(false));
      server.listen(port, '0.0.0.0', () => server.close(() => resolve(true)));
    });
  }
}
