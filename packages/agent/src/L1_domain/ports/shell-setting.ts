/**
 * Whether paired phones may list and start plain consoles. A console runs any command on this
 * computer, so the owner can turn it off from the app; it starts on.
 */
export interface ShellSetting {
  enabled(): boolean;
  /** Remembers the choice across restarts. */
  set(on: boolean): Promise<void>;
}
