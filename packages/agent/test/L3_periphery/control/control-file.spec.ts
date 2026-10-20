import { mkdtempSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  loadControlFile,
  removeControlFile,
  saveControlFile,
} from '../../../src/L3_periphery/control/control-file';

const fileIn = () => join(mkdtempSync(join(tmpdir(), 'sheep-control-')), 'home', 'control.json');

describe('control file', () => {
  it('saves and loads the address, owner-only, leaving no temp file', async () => {
    const file = fileIn();
    await saveControlFile(file, { port: 50123, secret: 'abc' });
    expect(loadControlFile(file)).toEqual({ port: 50123, secret: 'abc' });
    expect(JSON.parse(readFileSync(file, 'utf8'))).toEqual({ port: 50123, secret: 'abc' });
    expect(readdirSync(dirname(file))).toEqual(['control.json']);
    if (process.platform !== 'win32') {
      expect(statSync(file).mode & 0o777).toBe(0o600);
      expect(statSync(dirname(file)).mode & 0o777).toBe(0o700);
    }
  });

  it('reads a missing or damaged file as no agent', async () => {
    const file = fileIn();
    expect(loadControlFile(file)).toBeNull();
    await saveControlFile(file, { port: 1, secret: 'x' });
    for (const text of ['not json', '[]', '{"port":0,"secret":"x"}', '{"port":80,"secret":""}']) {
      writeFileSync(file, text);
      expect(loadControlFile(file)).toBeNull();
    }
  });

  it('removes the file only while it still holds this agent', async () => {
    const file = fileIn();
    await saveControlFile(file, { port: 50123, secret: 'mine' });
    await removeControlFile(file, 'another');
    expect(loadControlFile(file)).not.toBeNull();
    await removeControlFile(file, 'mine');
    expect(loadControlFile(file)).toBeNull();
    await removeControlFile(file, 'mine');
  });
});
