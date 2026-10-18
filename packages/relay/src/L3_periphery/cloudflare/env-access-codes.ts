import type { AccessCodes } from '../../L1_domain/ports/access-codes';
import type { RelayEnv } from './cloudflare-types';
import { sha256Hex } from './sha256-hex';

/** `ACCESS_CODES` is a comma-separated secret; blanks around a code and empty entries are noise. */
export class EnvAccessCodes implements AccessCodes {
  constructor(private readonly env: RelayEnv) {}

  issued(): readonly string[] {
    return (this.env.ACCESS_CODES ?? '')
      .split(',')
      .map((code) => code.trim())
      .filter((code) => code !== '');
  }

  fingerprint(code: string): Promise<string> {
    return sha256Hex(code);
  }
}
