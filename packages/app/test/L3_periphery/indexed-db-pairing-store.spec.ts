import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { generateKeyPair, publicKeyId } from '@remote-sheep/protocol';
import { IndexedDbPairingStore } from '../../src/L3_periphery/indexed-db-pairing-store';

let databases = 0;
const uniqueName = () => 'pairing-test-' + String(databases++);

const pairing = (device: string, name = 'Office') => {
  const agentKey = generateKeyPair().publicKey;
  return { id: publicKeyId(agentKey), name, phone: generateKeyPair(), agentKey, device };
};

/** Writes a record behind the adapter's back, as an older version or a damaged database would. */
function writeRaw(name: string, key: string, value: unknown): Promise<void> {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open(name, 1);
    open.onupgradeneeded = () => {
      open.result.createObjectStore('pairing');
    };
    open.onsuccess = () => {
      const tx = open.result.transaction('pairing', 'readwrite');
      tx.objectStore('pairing').put(value, key);
      tx.oncomplete = () => {
        open.result.close();
        resolve();
      };
      tx.onerror = () => {
        reject(new Error('write failed'));
      };
    };
  });
}

function readKeys(name: string): Promise<IDBValidKey[]> {
  return new Promise((resolve) => {
    const open = indexedDB.open(name, 1);
    open.onsuccess = () => {
      const request = open.result.transaction('pairing').objectStore('pairing').getAllKeys();
      request.onsuccess = () => {
        open.result.close();
        resolve(request.result);
      };
    };
  });
}

describe('IndexedDbPairingStore', () => {
  it('has nothing stored on a phone that never paired', async () => {
    await expect(new IndexedDbPairingStore(indexedDB, uniqueName()).list()).resolves.toEqual([]);
  });

  it('keeps the key pair, agent key, device id and name as raw bytes across instances', async () => {
    const name = uniqueName();
    const saved = pairing('0123456789abcdef');
    await new IndexedDbPairingStore(indexedDB, name).save(saved);
    const [loaded] = await new IndexedDbPairingStore(indexedDB, name).list();
    expect(loaded?.id).toBe(saved.id);
    expect(loaded?.name).toBe('Office');
    expect(loaded?.device).toBe(saved.device);
    expect(loaded?.phone.secretKey).toBeInstanceOf(Uint8Array);
    expect([...(loaded?.phone.secretKey ?? [])]).toEqual([...saved.phone.secretKey]);
    expect([...(loaded?.phone.publicKey ?? [])]).toEqual([...saved.phone.publicKey]);
    expect([...(loaded?.agentKey ?? [])]).toEqual([...saved.agentKey]);
  });

  it('keeps one pairing per computer, in the order they were first saved', async () => {
    let clock = 100;
    const store = new IndexedDbPairingStore(indexedDB, uniqueName(), () => clock++);
    const office = pairing('a', 'Office');
    const home = pairing('b', 'Home');
    await store.save(office);
    await store.save(home);
    // Saving the office again (a rename, a new device) keeps its place.
    await store.save({ ...office, name: 'Work', device: 'c' });
    const listed = await store.list();
    expect(listed.map((p) => [p.name, p.device])).toEqual([
      ['Work', 'c'],
      ['Home', 'b'],
    ]);
  });

  it('removes only the pairing asked for', async () => {
    const store = new IndexedDbPairingStore(indexedDB, uniqueName());
    const office = pairing('a');
    const home = pairing('b');
    await store.save(office);
    await store.save(home);
    await store.remove(office.id);
    expect((await store.list()).map((p) => p.id)).toEqual([home.id]);
  });

  it('moves the single pairing of an older version to its profile id', async () => {
    const name = uniqueName();
    const old = pairing('dev1');
    await writeRaw(name, 'current', {
      secretKey: old.phone.secretKey,
      publicKey: old.phone.publicKey,
      agentKey: old.agentKey,
      device: 'dev1',
    });
    const store = new IndexedDbPairingStore(indexedDB, name);
    const [migrated, ...rest] = await store.list();
    expect(rest).toEqual([]);
    expect(migrated?.id).toBe(old.id);
    expect(migrated?.name).toBe('Computer');
    expect(migrated?.device).toBe('dev1');
    expect([...(migrated?.phone.secretKey ?? [])]).toEqual([...old.phone.secretKey]);
    expect(await readKeys(name)).toEqual([old.id]);
    // A pairing added after the move lists after it.
    await store.save(pairing('dev2', 'Home'));
    expect((await store.list()).map((p) => p.name)).toEqual(['Computer', 'Home']);
  });

  it('treats a damaged record as no pairing and drops a damaged legacy one', async () => {
    const name = uniqueName();
    const store = new IndexedDbPairingStore(indexedDB, name);
    const good = pairing('x');
    await store.save(good);
    const key = new Uint8Array(32);
    await writeRaw(name, 'broken', {
      secretKey: new Uint8Array(3),
      publicKey: key,
      agentKey: key,
      device: 'x',
    });
    await writeRaw(name, 'current', 'not a record');
    expect((await store.list()).map((p) => p.id)).toEqual([good.id]);
    expect(await readKeys(name)).not.toContain('current');
  });
});
