'use client';

import { createContext, useContext, useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import type { Wallet, Transaction, Pemasukan } from '@prisma/client';
import { createResource, fetchJson, type Resource } from '../lib/resource';
import { replaceWallet, prependSavedTransaction, type WalletsState } from '../lib/wallet-state';
import { StitchFeedbackProvider, useStitchFeedback } from './StitchFeedback';

export type { WalletsState } from '../lib/wallet-state';

function createFinanceStore() {
  return {
    wallets: createResource(() => fetchJson<WalletsState>('/api/web/wallets')),
    transactions: createResource(() => fetchJson<Transaction[]>('/api/web/transactions')),
    income: createResource(() => fetchJson<Pemasukan[]>('/api/web/income')),
  };
}

const WalletContext = createContext<ReturnType<typeof createFinanceStore> | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [store] = useState(createFinanceStore);
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
  return <WalletContext.Provider value={store}><StitchFeedbackProvider>{children}</StitchFeedbackProvider></WalletContext.Provider>;
}

function useFinanceStore() {
  const store = useContext(WalletContext);
  if (!store) throw new Error('Gunakan di dalam WalletProvider');
  return store;
}

function useResource<T>(resource: Resource<T>) {
  const snapshot = useSyncExternalStore(resource.subscribe, resource.getSnapshot, resource.getServerSnapshot);
  useEffect(() => { void resource.load(); }, [resource]);
  return { ...snapshot, isLoading: snapshot.data === undefined, retry: () => resource.load(true) };
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
