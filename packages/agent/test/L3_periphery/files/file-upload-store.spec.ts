import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { FileUploadStore } from '../../../src/L3_periphery/files/file-upload-store';

describe('FileUploadStore', () => {
  const dir = mkdtempSync(join(tmpdir(), 'sheep-up-'));
  const store = new FileUploadStore(dir, 1024);

  it('writes the photo with an extension taken from its type', async () => {
    const saved = await store.save('image/jpeg', Buffer.from('jpeg'));
    expect(saved.name).toMatch(/^\d{8}-\d{6}-[0-9a-f]{6}\.jpg$/);
    expect(saved.path).toBe(join(dir, saved.name));
    expect(saved.bytes).toBe(4);
    expect(readFileSync(saved.path, 'utf8')).toBe('jpeg');
  });

  it('refuses types that are not images, empty files and oversized files', async () => {
    await expect(store.save('application/x-msdownload', Buffer.from('MZ'))).rejects.toThrow(
      'unsupported image type',
    );
    await expect(store.save('image/png', Buffer.alloc(0))).rejects.toThrow('empty image');
    await expect(store.save('image/png', Buffer.alloc(2048))).rejects.toThrow('image larger than');
  });
});
