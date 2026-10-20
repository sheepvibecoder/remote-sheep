import { mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { FileSavedPort } from '../../../src/L3_periphery/files/file-saved-port';

const fileIn = () => join(mkdtempSync(join(tmpdir(), 'sheep-port-')), 'home', 'port.json');

describe('FileSavedPort', () => {
  it('saves and loads the same port, leaving no temp file', async () => {
    const file = fileIn();
    const saved = new FileSavedPort(file);
    await saved.save(4001);
    expect(await saved.load()).toBe(4001);
    expect(await new FileSavedPort(file).load()).toBe(4001);
    expect(JSON.parse(readFileSync(file, 'utf8'))).toEqual({ port: 4001 });
    expect(readdirSync(dirname(file))).toEqual(['port.json']);
  });

  it('reads a missing file as no saved port', async () => {
    expect(await new FileSavedPort(fileIn()).load()).toBeNull();
  });

  it('reads a damaged file as no saved port, so the next start picks again', async () => {
    const file = fileIn();
    mkdirSync(dirname(file), { recursive: true });
    for (const text of ['not json', '[]', '{}', '{"port":"4001"}', '{"port":80}', '{"port":1.5}']) {
      writeFileSync(file, text);
      expect(await new FileSavedPort(file).load()).toBeNull();
    }
  });

  it('forgets the port and says whether one was saved', async () => {
    const file = fileIn();
    const saved = new FileSavedPort(file);
    expect(await saved.forget()).toBe(false);
    await saved.save(4001);
    expect(await saved.forget()).toBe(true);
    expect(await saved.load()).toBeNull();
  });
});
