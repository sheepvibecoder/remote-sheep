/** Where the phone learns the newest version of itself it could load. */
export interface UpdateSource {
  latestVersion(): Promise<string>;
}
