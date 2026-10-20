// What the agent hands out to pair a device, shared by the control channel, the terminal and
// the QR pane.

/** Where a pairing link works from: the relay anywhere, the LAN, or a browser on this PC. */
export type PairingPlace = 'relay' | 'network' | 'this-pc';

export interface PairingLink {
  readonly where: PairingPlace;
  readonly url: string;
}

/** One new invite as the person sees it: the links that carry it and when it stops working. */
export interface Pairing {
  /** Relay first, then the LAN, then this PC: the first one goes in the QR code. */
  readonly links: readonly PairingLink[];
  /** Epoch milliseconds. */
  readonly expiresAt: number;
}
