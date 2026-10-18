/** The invitation list the relay's owner maintains. */
export interface AccessCodes {
  /** Codes in force right now; read on every use so a change applies without a redeploy. */
  issued(): readonly string[];
  /** SHA-256 hex; the room stores this, never the code. */
  fingerprint(code: string): Promise<string>;
}
