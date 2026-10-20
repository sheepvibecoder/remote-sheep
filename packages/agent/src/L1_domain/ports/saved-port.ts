/**
 * The port kept between starts, so the address a phone saved keeps working after a restart.
 * Chosen by the first start or by the owner with `remote-sheep port <n>`.
 */
export interface SavedPort {
  /** null when none is saved. */
  load(): Promise<number | null>;
  save(port: number): Promise<void>;
}
