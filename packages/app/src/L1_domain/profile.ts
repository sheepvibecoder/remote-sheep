import { publicKeyId } from '@remote-sheep/protocol';

/**
 * A profile is named by the agent it talks to, so pairing the same computer
 * again replaces its profile instead of adding a second one.
 */
export const profileIdOf = (agentKey: Uint8Array): string => publicKeyId(agentKey);
