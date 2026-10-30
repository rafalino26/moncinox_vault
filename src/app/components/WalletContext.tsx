'use client';

import { createContext, useContext, useEffect, useState, type ReactNode, type Dispatch, type SetStateAction } from 'react';
import type { Wallet, Transaction } from '@prisma/client';
import { replaceWallet, prependSavedTransaction, type WalletsState } from '../lib/wallet-state';

export type { WalletsState } from '../lib/wallet-state';

type WalletContextValue = {
  wallets: WalletsState;
  updateSavedWallet: (wallet: Wallet) => void;
  transactions: Transaction[];
  addSavedTransaction: (tx: Transaction, wallet: Wallet) => void;
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

  const updateSavedWallet = (wallet: Wallet) => {
    setWallets(prev => replaceWallet(prev, wallet));
  };

  const addSavedTransaction = (tx: Transaction, wallet: Wallet) => {
    updateSavedWallet(wallet);
    setTransactions(prev => prependSavedTransaction(prev, tx));
  };

  return (
    <WalletContext.Provider
      value={{ wallets, updateSavedWallet, transactions, addSavedTransaction, setTransactions }}
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
