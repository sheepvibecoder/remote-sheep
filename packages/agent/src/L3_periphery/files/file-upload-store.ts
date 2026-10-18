// Photos taken on the phone are written here, and the order that follows names
// the path so the session can open the file itself.

import { randomBytes } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { UploadResult } from '@remote-sheep/protocol';
import type { UploadStore } from '../../L1_domain/ports/upload-store';

// The extension comes from the declared type, never from a name the phone
// sent, so nothing can steer the file anywhere or make it executable.
const EXTENSIONS: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/heic': '.heic',
};

function stamp(now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    now.getFullYear() +
    pad(now.getMonth() + 1) +
    pad(now.getDate()) +
    '-' +
    pad(now.getHours()) +
    pad(now.getMinutes()) +
    pad(now.getSeconds())
  );
}

export class FileUploadStore implements UploadStore {
  constructor(
    private readonly dir: string,
    private readonly maxBytes: number,
  ) {}

  async save(media: string, bytes: Uint8Array): Promise<UploadResult> {
    const extension = EXTENSIONS[(media.split(';')[0] ?? '').trim().toLowerCase()];
    if (!extension) throw new Error('unsupported image type: ' + media);
    if (!bytes.length) throw new Error('empty image');
    if (bytes.length > this.maxBytes) {
      throw new Error('image larger than ' + Math.round(this.maxBytes / 1024 / 1024) + ' MB');
    }

    await mkdir(this.dir, { recursive: true });
    const name = stamp() + '-' + randomBytes(3).toString('hex') + extension;
    const path = join(this.dir, name);
    await writeFile(path, bytes);
    return { path, name, bytes: bytes.length };
  }
}
