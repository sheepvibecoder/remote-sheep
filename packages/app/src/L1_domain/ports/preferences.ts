/** Small values the phone remembers between visits: localStorage in the browser. */
export interface Preferences {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}
