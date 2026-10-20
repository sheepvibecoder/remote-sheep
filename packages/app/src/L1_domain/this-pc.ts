// Whether the page was opened in a browser on the computer that runs the agent.
//
// Only then may it pair itself with no QR (the agent checks the same thing on its side), and only
// then does it move to the new address after the agent changes its port: phones keep theirs.

const THIS_PC_HOSTS: readonly string[] = ['localhost', '127.0.0.1'];

export function isThisPcHost(hostname: string): boolean {
  return THIS_PC_HOSTS.includes(hostname);
}

/** The same page on another port: where it lives once the agent moved there. */
export function addressOnPort(page: { protocol: string; hostname: string }, port: number): string {
  return page.protocol + '//' + page.hostname + ':' + String(port) + '/';
}
