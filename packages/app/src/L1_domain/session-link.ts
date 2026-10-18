/**
 * The session a notification asks the app to open, from the page's query string
 * (`/?session=<target>`, the address the service worker opens on a tap).
 */
export function sessionFromSearch(search: string): string | null {
  return new URLSearchParams(search).get('session') || null;
}

/**
 * The computer that notification came from (`&agent=<agent key id>`): pane ids
 * repeat between computers, so the session alone does not say whose it is.
 */
export function agentFromSearch(search: string): string | null {
  return new URLSearchParams(search).get('agent') || null;
}
