export const dynamic = 'force-dynamic';

import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import GlobalFABModal from './components/GlobalFABModal';
import { WalletProvider } from './components/WalletContext';
import { getWallets, getFilteredTransactions } from './actions/transactionActions';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'moncinox vaults',
  description: 'Shared financial vault for couple',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Ambil dompet awal dari server (sudah terjamin via getWallets)
  const wallets = await getWallets();

  // Ambil riwayat transaksi awal dari server (dipakai sebagai seed state awal)
  // @ts-ignore
  const allTransactions = await getFilteredTransactions({
    tipe: undefined,
    rentang: 'semua',
    urutkan: 'terbaru',
  });

  return (
    <html lang="en">
      <body className={`${inter.className} bg-gradient-to-b from-[#f5efff] via-[#ebe0fa] to-[#e2d0f7] min-h-screen overflow-x-hidden text-slate-800 antialiased`}>
        <WalletProvider initialWallets={wallets} initialTransactions={allTransactions}>
          <Navbar />
          <main className="max-w-5xl mx-auto p-3 sm:p-6 lg:p-8 pb-28 sm:pb-16 overflow-x-hidden">
            {children}
          </main>

          {/* Floating Liquid Glass Navigation (Mobile) */}
          <BottomNav />

          {/* Global Floating Action Button (+) & Modal Transaksi (Ada di semua halaman) */}
          <GlobalFABModal />
        </WalletProvider>
      </body>
    </html>
  );
}
