// The phone's pairings in IndexedDB: one record per profile, keyed by its id.
//
// Keys are kept as raw bytes. WebCrypto's non-extractable keys would be
// stronger, but `crypto.subtle` exists only over HTTPS and the LAN agent serves
// this page over plain HTTP (see the stage 2 log, L4).
//
// Before profiles a phone kept a single pairing under the key `current`; the
// first read moves it to its profile id, so an update does not ask for a new QR.

import type { PairingStore, StoredPairing } from '../L1_domain/ports/pairing-store';
import { profileIdOf } from '../L1_domain/profile';

const VERSION = 1;
const STORE = 'pairing';
const LEGACY_KEY = 'current';
const LEGACY_NAME = 'Computer';
const KEY_BYTES = 32;

interface PairingRecord {
  id: string;
  name: string;
  /** When the profile was first saved: the order the phone lists them in. */
  addedAt: number;
  secretKey: Uint8Array;
  publicKey: Uint8Array;
  agentKey: Uint8Array;
  device: string;
}

const isKey = (value: unknown): value is Uint8Array =>
  value instanceof Uint8Array && value.length === KEY_BYTES;

/** Anything else (a damaged record) counts as no pairing: that profile scans again. */
function parse(value: unknown): PairingRecord | null {
  if (typeof value !== 'object' || value === null) return null;
  const record = value as Partial<Record<keyof PairingRecord, unknown>>;
  const { secretKey, publicKey, agentKey, device, name, addedAt } = record;
  if (!isKey(secretKey) || !isKey(publicKey) || !isKey(agentKey)) return null;
  if (typeof device !== 'string' || !device) return null;
  // Only the legacy record lacks these; its id follows from the agent key.
  const id = profileIdOf(agentKey);
  return {
    id,
    name: typeof name === 'string' && name ? name : LEGACY_NAME,
    addedAt: typeof addedAt === 'number' ? addedAt : 0,
    secretKey,
    publicKey,
    agentKey,
    device,
  };
}

const toPairing = (record: PairingRecord): StoredPairing => ({
  id: record.id,
  name: record.name,
  phone: { secretKey: record.secretKey, publicKey: record.publicKey },
  agentKey: record.agentKey,
  device: record.device,
});

function done<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      resolve(request.result);
    };
    request.onerror = () => {
      reject(request.error ?? new Error('IndexedDB request failed'));
    };
  });
}

export class IndexedDbPairingStore implements PairingStore {
  constructor(
    private readonly factory: IDBFactory,
    private readonly name = 'remote-sheep',
    private readonly now: () => number = Date.now,
  ) {}

  async list(): Promise<StoredPairing[]> {
    await this.migrate();
    const values = await this.run('readonly', (store) => store.getAll());
    return values
      .map(parse)
      .filter((record): record is PairingRecord => record !== null)
      .sort((a, b) => a.addedAt - b.addedAt)
      .map(toPairing);
  }

  async save(pairing: StoredPairing): Promise<void> {
    const previous = parse(await this.run('readonly', (store) => store.get(pairing.id)));
    const record: PairingRecord = {
      id: pairing.id,
      name: pairing.name,
      addedAt: previous?.addedAt ?? this.now(),
      secretKey: pairing.phone.secretKey,
      publicKey: pairing.phone.publicKey,
      agentKey: pairing.agentKey,
      device: pairing.device,
    };
    await this.run('readwrite', (store) => store.put(record, record.id));
  }

  async remove(id: string): Promise<void> {
    await this.run('readwrite', (store) => store.delete(id));
  }

  /** Moves the single pairing of an older version to its profile id; a damaged one is dropped. */
  private async migrate(): Promise<void> {
    const legacy: unknown = await this.run('readonly', (store) => store.get(LEGACY_KEY));
    if (legacy === undefined) return;
    const record = parse(legacy);
    await this.run('readwrite', (store) => {
      if (record) store.put(record, record.id);
      return store.delete(LEGACY_KEY);
    });
  }

  /** Opens the database for one request and closes it, so a page never holds it open. */
  private async run<T>(
    mode: IDBTransactionMode,
    action: (store: IDBObjectStore) => IDBRequest<T>,
  ): Promise<T> {
    const opening = this.factory.open(this.name, VERSION);
    opening.onupgradeneeded = () => {
      opening.result.createObjectStore(STORE);
    };
    const database = await done(opening);
    try {
      const transaction = database.transaction(STORE, mode);
      // Listen before the request runs: a write counts only once its transaction commits.
      const committed = new Promise<void>((resolve, reject) => {
        transaction.oncomplete = () => {
          resolve();
        };
        transaction.onabort = () => {
          reject(transaction.error ?? new Error('IndexedDB transaction aborted'));
        };
      });
      const [result] = await Promise.all([done(action(transaction.objectStore(STORE))), committed]);
      return result;
    } finally {
      database.close();
    }
  }
}
