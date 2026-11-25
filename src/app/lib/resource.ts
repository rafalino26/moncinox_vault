import type { FinancePersistence } from '../../../public/offline-store';

export type ResourceSnapshot<T> = {
  data: T | undefined;
  error: string | null;
  isRefreshing: boolean;
  lastUpdated: number | null;
  fromCache: boolean;
};

// Disk restore runs alongside the network, never in front of it.
export function createResource<T>(fetcher: () => Promise<T>, staleMs = 30_000, persistence?: FinancePersistence<T>) {
  let snapshot: ResourceSnapshot<T> = { data: undefined, error: null, isRefreshing: false, lastUpdated: null, fromCache: false };
  const serverSnapshot = snapshot;
  const listeners = new Set<() => void>();
  let updatedAt = 0;
  let revision = 0;
  let inFlight: Promise<void> | undefined;
  let restored: Promise<void> | undefined;

  const publish = (next: ResourceSnapshot<T>) => {
    snapshot = next;
    listeners.forEach(listener => listener());
  };

  const persist = () => {
    if (persistence && snapshot.data !== undefined && snapshot.lastUpdated !== null) {
      // Persist only successful reads/committed writes, never empty error fallbacks.
      void persistence.write({ version: 1, data: snapshot.data, updatedAt: snapshot.lastUpdated }).catch(() => {});
    }
  };
  const restore = () => {
    if (!restored) {
      const startedRevision = revision;
      restored = (persistence?.read() ?? Promise.resolve(undefined)).then(record => {
        if (record && snapshot.data === undefined && revision === startedRevision) {
          publish({ ...snapshot, data: record.data, lastUpdated: record.updatedAt, fromCache: true });
        }
      }).catch(() => {});
    }
    return restored;
  };

  const load = (force = false): Promise<void> => {
    if (inFlight) return inFlight;
    if (!force && snapshot.data !== undefined && Date.now() - updatedAt < staleMs) return Promise.resolve();
    const startedRevision = revision;
    publish({ ...snapshot, isRefreshing: true });
    void restore();
    inFlight = Promise.resolve().then(fetcher).then(data => {
      if (revision !== startedRevision) return;
      updatedAt = Date.now();
      publish({ data, error: null, isRefreshing: false, lastUpdated: updatedAt, fromCache: false });
      persist();
    }).catch(async error => {
      await restore();
      if (revision !== startedRevision) return;
      publish({ ...snapshot, error: error instanceof Error ? error.message : 'Gagal memuat data.', isRefreshing: false });
    }).finally(() => {
      inFlight = undefined;
      // A read started before a successful write must never undo that write.
      if (revision !== startedRevision) void load(true);
    });
    return inFlight;
  };

  return {
    getSnapshot: () => snapshot,
    getServerSnapshot: () => serverSnapshot,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    load,
    refreshAfterWrite: async () => {
      // A GET already in flight may predate the committed queued write.
      revision++;
      updatedAt = 0;
      if (inFlight) await inFlight;
      await load(true);
    },
    revalidateIfLoaded: () => {
      if (snapshot.data !== undefined || snapshot.error !== null) void load(snapshot.error !== null);
    },
    mutate: (update: (previous: T) => T) => {
      revision++;
      if (snapshot.data !== undefined) {
        updatedAt = Date.now();
        publish({ ...snapshot, data: update(snapshot.data), error: null, lastUpdated: updatedAt });
        persist();
      }
    },
  };
}

export type Resource<T> = ReturnType<typeof createResource<T>>;

export async function fetchJson<T>(url: string): Promise<T> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) throw new Error('Sedang offline. Menampilkan data tersimpan jika tersedia.');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(url, { cache: 'no-store', signal: controller.signal });
    if (!response.ok) throw new Error('Gagal memuat data. Silakan coba lagi.');
    return await response.json() as T;
  } catch (error) {
    if (controller.signal.aborted) throw new Error('Koneksi terlalu lama. Silakan coba lagi.');
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
