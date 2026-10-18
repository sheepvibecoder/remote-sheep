// The wire version, in its own module so the handshake can bind it into the
// transcript without importing the message codecs that re-export the handshake.

/**
 * Wire version. Bump it on any change an older peer would misread; the agent
 * closes a phone that speaks another one instead of guessing.
 */
export const PROTOCOL = 2;
