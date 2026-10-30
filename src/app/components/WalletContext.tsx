'use client';

import { createContext, useContext, useEffect, useState, type ReactNode, type Dispatch, type SetStateAction } from 'react';
import type { Wallet, Transaction } from '@prisma/client';

export type WalletsState = {
  rafaWallet: Wallet | null;
  monikWallet: Wallet | null;
};

type WalletContextValue = {
  wallets: WalletsState;
  applyOptimisticDelta: (person: 'Saya' | 'Pacar_Saya', delta: number) => void;
  transactions: Transaction[];
  addOptimisticTransaction: (tx: Transaction) => void;
  setTransactions: Dispatch<SetStateAction<Transaction[]>>;
};

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({
  initialWallets,
  initialTransactions = [],
  children,
}: {
  initialWallets: WalletsState;
  initialTransactions?: Transaction[];
  children: ReactNode;
}) {
  const [wallets, setWallets] = useState<WalletsState>(initialWallets);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);

  useEffect(() => {
    setWallets(initialWallets);
  }, [initialWallets]);

  useEffect(() => {
    setTransactions(initialTransactions);
  }, [initialTransactions]);

  const applyOptimisticDelta = (person: 'Saya' | 'Pacar_Saya', delta: number) => {
    setWallets((prev) => {
      const wallet = person === 'Saya' ? prev.rafaWallet : prev.monikWallet;
      if (!wallet) return prev;
      return {
        ...prev,
        [person]: { ...wallet, balance: wallet.balance + delta },
      };
    });
  };

  const addOptimisticTransaction = (tx: Transaction) => {
    setTransactions((prev) => [tx, ...prev]);
  };

  return (
    <WalletContext.Provider
      value={{ wallets, applyOptimisticDelta, transactions, addOptimisticTransaction, setTransactions }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) {
    throw new Error('useWallet harus digunakan di dalam WalletProvider');
  }
  return ctx;
}
