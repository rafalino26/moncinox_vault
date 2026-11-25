import { parseTransactionDate } from './dates';

export type PendingInput = { jumlah: number; sumber: 'Saya' | 'Pacar_Saya'; tipe: 'pengeluaran' | 'tabungan'; tanggal: string; keterangan: string };
export type QueuedTransaction = { id: string; transaction: PendingInput; createdAt: number; state: 'waiting' | 'blocked'; error?: string };
type Storage = { list(): Promise<QueuedTransaction[]>; add(item: QueuedTransaction): Promise<unknown>; put(item: QueuedTransaction): Promise<unknown>; remove(id: string): Promise<unknown> };
type Delivery = { ok: boolean; retryable: boolean; error?: string };
function normalizePending(input: unknown): PendingInput | null {
  if (!input || typeof input !== 'object') return null;
  const data = input as Partial<PendingInput>;
  const date = typeof data.tanggal === 'string' ? parseTransactionDate(data.tanggal) : null;
  if (typeof data.jumlah !== 'number' || !Number.isFinite(data.jumlah) || data.jumlah <= 0 || data.jumlah > Number.MAX_SAFE_INTEGER ||
      !['Saya', 'Pacar_Saya'].includes(data.sumber || '') || !['pengeluaran', 'tabungan'].includes(data.tipe || '') || !date ||
      typeof data.keterangan !== 'string' || !data.keterangan.trim() || data.keterangan.trim().length > 1000) return null;
  return { jumlah: data.jumlah, sumber: data.sumber!, tipe: data.tipe!, tanggal: date.toISOString(), keterangan: data.keterangan.trim() };
}
function validStored(item: QueuedTransaction) {
  return item && typeof item.id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(item.id) &&
    Number.isFinite(item.createdAt) && item.createdAt > 0 && ['waiting', 'blocked'].includes(item.state) &&
    (item.error === undefined || typeof item.error === 'string') && normalizePending(item.transaction) !== null;
}

export function createOfflineQueue(storage: Storage, send: (item: QueuedTransaction) => Promise<Delivery>, onDelivered: () => Promise<unknown>, online: () => boolean) {
  let snapshot = { items: [] as QueuedTransaction[], syncing: false, error: null as string | null, lastSynced: null as number | null };
  const serverSnapshot = snapshot;
  const listeners = new Set<() => void>();
  let running: Promise<void> | undefined;
  let addedDuringSync = false;
  const publish = (change: Partial<typeof snapshot>) => { snapshot = { ...snapshot, ...change }; listeners.forEach(listener => listener()); };
  const reload = async () => {
    try {
      const items = await storage.list();
      if (!items.every(validStored)) throw Error('Antrean tidak valid');
      publish({ items: items.sort((a, b) => a.createdAt - b.createdAt), error: null });
    }
    catch { publish({ error: 'Antrean di perangkat ini belum bisa dibaca. Coba lagi sebelum menutup aplikasi.' }); }
  };
  const sync = (): Promise<void> => {
    if (running) return running;
    running = (async () => {
      await reload();
      if (!online() || snapshot.error) return;
      publish({ syncing: true });
      let delivered = false;
      try {
        // Snapshot the batch; anything added during sync is picked up on the next pass.
        for (const item of snapshot.items) {
          if (!online()) break;
          if (item.state === 'blocked') continue;
          let result: Delivery;
          try { result = await send(item); }
          catch { result = { ok: false, retryable: true, error: 'Koneksi terputus. Akan dicoba lagi dengan ID yang sama.' }; }
          if (result.ok) {
            // Refresh committed server state before dropping the durable local receipt candidate.
            await onDelivered();
            await storage.remove(item.id);
            delivered = true;
          } else {
            await storage.put({ ...item, state: result.retryable ? 'waiting' : 'blocked', error: result.error || 'Pengiriman belum berhasil.' });
            if (result.retryable) break;
          }
        }
      } catch { publish({ error: 'Sinkronisasi belum selesai. Catatan tetap di antrean dan aman untuk dicoba ulang.' }); }
      finally {
        const error = snapshot.error;
        await reload();
        publish({ syncing: false, error: error || snapshot.error, ...(delivered ? { lastSynced: Date.now() } : {}) });
      }
    })().finally(() => {
      running = undefined;
      if (addedDuringSync) { addedDuringSync = false; if (online()) void sync(); }
    });
    return running;
  };
  return {
    getSnapshot: () => snapshot, getServerSnapshot: () => serverSnapshot,
    subscribe: (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; },
    reload, sync,
    async retryBlocked(id: string) {
      const item = (await storage.list()).find(item => item.id === id && item.state === 'blocked');
      if (item) await storage.put({ ...item, state: 'waiting', error: undefined });
      await sync();
    },
    async enqueue(input: PendingInput) {
      const transaction = normalizePending(input);
      if (!transaction) throw Error('Nominal, tanggal, atau keterangan tidak valid. Periksa form.');
      const item: QueuedTransaction = { id: crypto.randomUUID(), transaction, createdAt: Date.now(), state: 'waiting' };
      // Resolve only after IDB transaction commits. No false offline-success on quota errors.
      await storage.add(item);
      if (running) addedDuringSync = true;
      await reload();
      return item;
    },
  };
}
