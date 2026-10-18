/** Wall-clock time, so the pairing rules can be tested at exact instants. */
export interface Clock {
  /** Epoch milliseconds. */
  now(): number;
}
