import type { UploadResult } from '@remote-sheep/protocol';

/** Where photos from the phone are written so the session can open them. */
export interface UploadStore {
  save(media: string, bytes: Uint8Array): Promise<UploadResult>;
}
