/* Shared by the React app and the independent offline reader. No network or write queue. */
(function (root) {
  const DB = 'moncinox-offline';
  const STORE = 'snapshots';
  const person = value => value === 'Saya' || value === 'Pacar_Saya';
  const date = value => (typeof value === 'string' || value instanceof Date) && Number.isFinite(new Date(value).getTime());
  const amount = value => typeof value === 'number' && Number.isFinite(value);
  function validData(key, data) {
    if (!data || typeof data !== 'object') return false;
    if (key === 'wallets') return ['rafaWallet', 'monikWallet'].every((field, index) => {
      const wallet = data[field];
      return wallet === null || (wallet && typeof wallet.id === 'string' && wallet.person === ['Saya', 'Pacar_Saya'][index] && amount(wallet.balance));
    });
    if (!['transactions', 'income'].includes(key) || !Array.isArray(data)) return false;
    return data.every(row => row && typeof row.id === 'string' && person(row.sumber) && amount(row.jumlah) && row.jumlah > 0 && date(row.createdAt) &&
      (key !== 'transactions' || (date(row.tanggal) && typeof row.keterangan === 'string' && ['pengeluaran', 'tabungan'].includes(row.tipe))));
  }
  function validRecord(key, record) {
    return Boolean(record && record.version === 1 && Number.isFinite(record.updatedAt) && record.updatedAt > 0 && record.updatedAt <= Date.now() + 300000 && validData(key, record.data));
  }
  function createFinancePersistence(key) {
    function open() {
      return new Promise((resolve, reject) => {
        if (!root.indexedDB) { reject(new Error('Penyimpanan offline tidak tersedia.')); return; }
        const request = root.indexedDB.open(DB, 1);
        let expired = false;
        const timeout = setTimeout(() => { expired = true; reject(new Error('Penyimpanan offline tidak merespons.')); }, 2500);
        request.onblocked = () => { expired = true; clearTimeout(timeout); reject(new Error('Penyimpanan offline sedang digunakan.')); };
        request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE); };
        request.onerror = () => { clearTimeout(timeout); reject(request.error); };
        request.onsuccess = () => {
          clearTimeout(timeout);
          request.result.onversionchange = () => request.result.close();
          if (expired) request.result.close(); else resolve(request.result);
        };
      });
    }
    async function access(mode, operation) {
      const db = await open();
      try {
        return await new Promise((resolve, reject) => {
          const transaction = db.transaction(STORE, mode);
          const request = operation(transaction.objectStore(STORE));
          transaction.oncomplete = () => resolve(request.result);
          transaction.onerror = transaction.onabort = () => reject(transaction.error || new Error('Penyimpanan offline gagal.'));
        });
      } finally { db.close(); }
    }
    let writes = Promise.resolve();
    return {
      async read() {
        const record = await access('readonly', store => store.get(key));
        return validRecord(key, record) ? record : undefined;
      },
      async write(record) {
        if (!validRecord(key, record)) throw new Error('Data offline tidak valid.');
        // Serialize saves so a slow earlier write cannot overwrite a committed mutation.
        const copy = structuredClone(record);
        writes = writes.catch(() => {}).then(() => access('readwrite', store => {
          const existing = store.get(key);
          existing.onsuccess = () => {
            if (!validRecord(key, existing.result) || existing.result.updatedAt <= copy.updatedAt) store.put(copy, key);
          };
          return existing;
        }));
        return writes;
      },
      clear() { return access('readwrite', store => store.delete(key)); },
    };
  }
  const api = { createFinancePersistence, validRecord };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.MoncinoxOfflineStore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
