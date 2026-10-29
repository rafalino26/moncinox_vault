export const dynamic = 'force-dynamic';

import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from './components/Navbar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'moncinox vaults',
  description: 'doi doi doi doi',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#d9b3ff] min-h-screen overflow-x-hidden text-slate-800 antialiased`}>
        <Navbar />
        <main className="max-w-5xl mx-auto p-3 sm:p-6 lg:p-8 pb-16 overflow-x-hidden">
          {children}
        </main>
      </body>
    </html>
  );
}
