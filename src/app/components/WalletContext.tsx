'use client';

import { createContext, useContext, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react';
import type { Wallet, Transaction, Pemasukan } from '@prisma/client';
import { createResource, fetchJson, type Resource } from '../lib/resource';
import { replaceWallet, prependSavedTransaction, type WalletsState } from '../lib/wallet-state';
import { StitchFeedbackProvider, useStitchFeedback } from './StitchFeedback';
import { createFinancePersistence } from '../../../public/offline-store';
import { createOfflineQueue } from '../lib/offline-queue';
import { queueStorage } from '../lib/offline-queue-storage';
import { mergeTransactionHistory } from '../lib/transaction-history';
import { usePathname } from 'next/navigation';

export type { WalletsState } from '../lib/wallet-state';

function createFinanceStore() {
  return {
    wallets: createResource(() => fetchJson<WalletsState>('/api/web/wallets'), 30_000, createFinancePersistence<WalletsState>('wallets')),
    transactions: createResource(() => fetchJson<Transaction[]>('/api/web/transactions'), 30_000, createFinancePersistence<Transaction[]>('transactions')),
    income: createResource(() => fetchJson<Pemasukan[]>('/api/web/income'), 30_000, createFinancePersistence<Pemasukan[]>('income')),
  };
}

const WalletContext = createContext<ReturnType<typeof createFinanceStore> | null>(null);
const OfflineQueueContext = createContext<ReturnType<typeof createOfflineQueue> | null>(null);

export function useOfflineTransactions() {
  const queue = useContext(OfflineQueueContext);
  if (!queue) throw Error('Antrean memerlukan WalletProvider');
  return queue;
}

export function useTransactionHistory(transactions: Transaction[]) {
  const queue = useOfflineTransactions();
  const snapshot = useSyncExternalStore(queue.subscribe, queue.getSnapshot, queue.getServerSnapshot);
  return useMemo(() => mergeTransactionHistory(transactions, snapshot.items), [transactions, snapshot.items]);
}

export function HistoryQueueError() {
  const queue = useOfflineTransactions();
  const snapshot = useSyncExternalStore(queue.subscribe, queue.getSnapshot, queue.getServerSnapshot);
  return snapshot.error ? <p className="ledger-help" role="alert">{snapshot.error}</p> : null;
}

function QueueFeedback() {
  const queue = useOfflineTransactions();
  const status = useSyncExternalStore(queue.subscribe, queue.getSnapshot, queue.getServerSnapshot);
  const celebrate = useStitchFeedback();
  useEffect(() => { if (status.lastSynced) celebrate('Catatan sudah tersinkron!'); }, [status.lastSynced, celebrate]);
  return null;
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [store] = useState(createFinanceStore);
  const [queue] = useState(() => createOfflineQueue(queueStorage, async item => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch('/api/web/offline-transactions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, transaction: item.transaction }), signal: controller.signal,
      });
      const body = await response.json();
      // A redirected/proxy HTML response or malformed success must never acknowledge the queue.
      const ok = response.ok && body.id === item.id && [200, 201].includes(body.status);
      return { ok, retryable: response.status !== 400 && response.status !== 409, error: body.error || 'Server belum mengonfirmasi pengiriman.' };
    } finally { clearTimeout(timeout); }
  }, async () => {
    await Promise.all([store.wallets.refreshAfterWrite(), store.transactions.refreshAfterWrite()]);
    if (store.wallets.getSnapshot().error || store.transactions.getSnapshot().error) throw Error('Refresh belum berhasil');
  }, () => navigator.onLine !== false));
  useEffect(() => {
    const retry = () => { if (document.visibilityState === 'visible') void queue.sync(); };
    let channel: BroadcastChannel | null = null;
    try { if (typeof BroadcastChannel !== 'undefined') channel = new BroadcastChannel('moncinox-outbox'); } catch { /* Polling still recovers queue changes. */ }
    if (channel) channel.onmessage = () => { void queue.reload(); };
    void queue.sync();
    window.addEventListener('online', retry);
    window.addEventListener('focus', retry);
    document.addEventListener('visibilitychange', retry);
    const timer = window.setInterval(retry, 30000);
    return () => {
      window.removeEventListener('online', retry); window.removeEventListener('focus', retry);
      document.removeEventListener('visibilitychange', retry); window.clearInterval(timer); channel?.close();
    };
  }, [queue]);
  useEffect(() => {
    const revalidate = () => {
      if (document.visibilityState !== 'visible') return;
      Object.values(store).forEach(resource => resource.revalidateIfLoaded());
    };
    window.addEventListener('focus', revalidate);
    window.addEventListener('online', revalidate);
    document.addEventListener('visibilitychange', revalidate);
    const timer = window.setInterval(revalidate, 60_000);
    return () => {
      window.removeEventListener('focus', revalidate);
      window.removeEventListener('online', revalidate);
      document.removeEventListener('visibilitychange', revalidate);
      window.clearInterval(timer);
    };
  }, [store]);
  return <WalletContext.Provider value={store}><OfflineQueueContext.Provider value={queue}><StitchFeedbackProvider><QueueFeedback />{children}</StitchFeedbackProvider></OfflineQueueContext.Provider></WalletContext.Provider>;
}

function useFinanceStore() {
  const store = useContext(WalletContext);
  if (!store) throw new Error('Gunakan di dalam WalletProvider');
  return store;
}

export function FinanceCacheNotice() {
  const store = useFinanceStore();
  const pathname = usePathname();
  const wallets = useSyncExternalStore(store.wallets.subscribe, store.wallets.getSnapshot, store.wallets.getServerSnapshot);
  const transactions = useSyncExternalStore(store.transactions.subscribe, store.transactions.getSnapshot, store.transactions.getServerSnapshot);
  const income = useSyncExternalStore(store.income.subscribe, store.income.getSnapshot, store.income.getServerSnapshot);
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update); };
  }, []);
  const resources = (pathname === '/pemasukan' ? [income] : pathname === '/pengeluaran' ? [transactions] : [wallets, transactions]).filter(item => item.data !== undefined);
  if (!offline && !resources.some(item => item.fromCache)) return null;
  const dates = resources.flatMap(item => item.lastUpdated ? [item.lastUpdated] : []);
  const oldest = dates.length ? Math.min(...dates) : null;
  return <aside className="finance-cache-notice" role="status">
    <strong>{offline ? 'Sedang offline' : 'Menampilkan data tersimpan'}</strong>
    <span>{oldest ? `Data terakhir diperbarui ${new Date(oldest).toLocaleString('id-ID')}` : 'Belum ada data tersimpan'}</span>
  </aside>;
}

function useResource<T>(resource: Resource<T>) {
  const snapshot = useSyncExternalStore(resource.subscribe, resource.getSnapshot, resource.getServerSnapshot);
  useEffect(() => { void resource.load(); }, [resource]);
  // Saved data is the expected offline state; the shared notice already explains it.
  const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
  const error = offline ? (snapshot.data !== undefined ? null : snapshot.error
    ? 'Belum ada data tersimpan untuk halaman ini. Buka halaman ini saat online terlebih dahulu.' : null) : snapshot.error;
  return { ...snapshot, error, isLoading: snapshot.data === undefined, retry: () => resource.load(true) };
}

export function useWalletsData() { return useResource(useFinanceStore().wallets); }
export function useTransactionsData() { return useResource(useFinanceStore().transactions); }
export function useIncomeData() { return useResource(useFinanceStore().income); }

// Mutation responses update every mounted route without a full router refresh.
export function useWallet() {
  const store = useFinanceStore();
  const celebrate = useStitchFeedback();
  const updateSavedWallet = (wallet: Wallet) => {
    store.wallets.mutate(previous => replaceWallet(previous, wallet));
  };
  return {
    updateSavedWallet,
    addSavedTransaction: (transaction: Transaction, wallet: Wallet) => {
      updateSavedWallet(wallet);
      store.transactions.mutate(previous => prependSavedTransaction(previous, transaction));
      celebrate('Catatan tersimpan!');
    },
    removeSavedTransaction: (id: string, wallet: Wallet) => {
      updateSavedWallet(wallet);
      store.transactions.mutate(previous => previous.filter(transaction => transaction.id !== id));
    },
    updateSavedTransaction: (transaction: Transaction, wallets: Wallet[]) => {
      wallets.forEach(updateSavedWallet);
      store.transactions.mutate(previous => prependSavedTransaction(previous, transaction)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      celebrate('Catatan diperbarui!');
    },
    addSavedIncome: (income: Pemasukan, wallet: Wallet) => {
      updateSavedWallet(wallet);
      store.income.mutate(previous => [income, ...previous.filter(item => item.id !== income.id)]);
      celebrate('Uang saku sudah masuk!');
    },
    removeSavedIncome: (id: string, wallet: Wallet) => {
      updateSavedWallet(wallet);
      store.income.mutate(previous => previous.filter(item => item.id !== id));
    },
  };
}
