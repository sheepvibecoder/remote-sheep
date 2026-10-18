/**
 * Where the line to the computer stands. `unauthorized`, `outdated` and
 * `expired` are final: retrying does not fix them. `outdated` needs a reload;
 * `unauthorized` (the agent does not accept this phone, or the line was
 * tampered with) and `expired` (the pairing ran out or was revoked) need a new QR.
 */
export type LinkState = 'connecting' | 'open' | 'closed' | 'unauthorized' | 'outdated' | 'expired';
