import type { Transaction, Wallet } from '@prisma/client';

export type WalletsState = {
  rafaWallet: Wallet | null;
  monikWallet: Wallet | null;
};

// Use the saved balance, including any changes made by another client.
export function replaceWallet(wallets: WalletsState, wallet: Wallet): WalletsState {
  if (wallet.person === 'Saya') return { ...wallets, rafaWallet: wallet };
  if (wallet.person === 'Pacar_Saya') return { ...wallets, monikWallet: wallet };
  return wallets;
}

export function prependSavedTransaction(transactions: Transaction[], saved: Transaction): Transaction[] {
  return [saved, ...transactions.filter(transaction => transaction.id !== saved.id)];
}
