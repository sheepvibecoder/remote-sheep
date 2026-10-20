// The relay a running agent was told to use, kept in relay.json (owner-only, written atomically)
// exactly as `remote-sheep relay set` keeps it, so the next start dials the same relay.

import type { RelaySetting } from '@remote-sheep/protocol';
import type { SavedRelay } from '../../L1_domain/ports/relay';
import { removeRelaySettingsFile, saveRelaySettingsFile } from './relay-settings-file';

export class FileSavedRelay implements SavedRelay {
  constructor(private readonly file: string) {}

  async save(setting: RelaySetting): Promise<void> {
    await saveRelaySettingsFile(this.file, setting.url, setting.code);
  }

  async forget(): Promise<void> {
    await removeRelaySettingsFile(this.file);
  }
}
