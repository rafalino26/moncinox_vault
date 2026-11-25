import type { QueuedTransaction } from './offline-queue';

const DB = 'moncinox-outbox';
const STORE = 'transactions';

async function access<T>(mode: IDBTransactionMode, operation: (store: IDBObjectStore, tx: IDBTransaction) => IDBRequest<T>): Promise<T> {
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB, 1);
    let expired = false;
    const timer = setTimeout(() => { expired = true; reject(Error('Penyimpanan antrean tidak merespons.')); }, 3000);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: 'id' });
    request.onblocked = request.onerror = () => { clearTimeout(timer); expired = true; reject(Error('Antrean belum bisa dibuka. Catatan belum disimpan.')); };
    request.onsuccess = () => {
      clearTimeout(timer);
      request.result.onversionchange = () => request.result.close();
      if (expired) request.result.close(); else resolve(request.result);
    };
  });
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const request = operation(tx.objectStore(STORE), tx);
      tx.oncomplete = () => {
        if (mode === 'readwrite' && typeof BroadcastChannel !== 'undefined') {
          try {
            const channel = new BroadcastChannel('moncinox-outbox');
            channel.postMessage('changed'); channel.close();
          } catch { /* A tab notification is optional; the durable write already succeeded. */ }
        }
        resolve(request.result);
      };
      tx.onerror = tx.onabort = () => reject(Error('Antrean gagal disimpan. Jangan tutup form; coba lagi.'));
    });
  } finally { db.close(); }
}

export const queueStorage = {
  list: () => access('readonly', store => store.getAll()) as Promise<QueuedTransaction[]>,
  add: (item: QueuedTransaction) => access('readwrite', store => store.add(item)),
  put: (item: QueuedTransaction) => access('readwrite', store => store.put(item)),
  remove: (id: string) => access('readwrite', store => store.delete(id)),
  async change(id: string, update: (item: QueuedTransaction | undefined) => QueuedTransaction | null | undefined) {
    let result: QueuedTransaction | null | undefined;
    let failure: unknown;
    try {
      await access('readwrite', (store, tx) => {
        const request = store.get(id);
        request.onsuccess = () => {
          try {
            result = update(request.result);
            if (result === null) store.delete(id);
            else if (result !== undefined) store.put(result);
          } catch (error) { failure = error; tx.abort(); }
        };
        return request;
      });
    } catch (error) { throw failure || error; }
    return result;
  },
};
