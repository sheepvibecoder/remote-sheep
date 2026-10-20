/** How a page opened on this PC asks the agent that served it for a pairing, with no QR. */
export interface LocalPairing {
  /** The pairing link's fragment (`#pair=<invite>`); rejects when the agent refuses. */
  invite(): Promise<string>;
}
