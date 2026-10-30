export type ResourceSnapshot<T> = {
  data: T | undefined;
  error: string | null;
  isRefreshing: boolean;
};

// One in-memory resource per provider, shared across routes. Never persisted to disk.
export function createResource<T>(fetcher: () => Promise<T>, staleMs = 30_000) {
  let snapshot: ResourceSnapshot<T> = { data: undefined, error: null, isRefreshing: false };
  const serverSnapshot = snapshot;
  const listeners = new Set<() => void>();
  let updatedAt = 0;
  let revision = 0;
  let inFlight: Promise<void> | undefined;

  const publish = (next: ResourceSnapshot<T>) => {
    snapshot = next;
    listeners.forEach(listener => listener());
  };

  const load = (force = false): Promise<void> => {
    if (inFlight) return inFlight;
    if (!force && snapshot.data !== undefined && Date.now() - updatedAt < staleMs) return Promise.resolve();
    const startedRevision = revision;
    publish({ ...snapshot, isRefreshing: true });
    inFlight = Promise.resolve().then(fetcher).then(data => {
      if (revision !== startedRevision) return;
      updatedAt = Date.now();
      publish({ data, error: null, isRefreshing: false });
    }).catch(error => {
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
    revalidateIfLoaded: () => {
      if (snapshot.data !== undefined) void load();
    },
    mutate: (update: (previous: T) => T) => {
      revision++;
      if (snapshot.data !== undefined) {
        updatedAt = Date.now();
        publish({ ...snapshot, data: update(snapshot.data), error: null });
      }
    },
  };
}

export type Resource<T> = ReturnType<typeof createResource<T>>;

export async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error('Gagal memuat data. Silakan coba lagi.');
  return response.json() as Promise<T>;
}
