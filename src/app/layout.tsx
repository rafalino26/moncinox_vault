import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import GlobalFABModal from './components/GlobalFABModal';
import { WalletProvider, FinanceCacheNotice } from './components/WalletContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'moncinox vaults',
  description: 'Shared financial vault for couple',
  applicationName: 'Moncinox Vault',
  appleWebApp: { capable: true, title: 'Moncinox', statusBarStyle: 'default' },
  icons: { icon: '/icons/icon-192.png', apple: '/icons/apple-touch-icon.png' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#f5efff',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className={`${inter.className} bg-gradient-to-b from-[#f5efff] via-[#ebe0fa] to-[#e2d0f7] min-h-screen overflow-x-hidden text-slate-800 antialiased`}>
        <WalletProvider>
          <Navbar />
          <main className="max-w-5xl mx-auto p-3 sm:p-6 lg:p-8 pb-[calc(7rem+env(safe-area-inset-bottom,0px))] md:pb-16 overflow-x-hidden">
            <FinanceCacheNotice />
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
