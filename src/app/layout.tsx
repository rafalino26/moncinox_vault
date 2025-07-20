import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from './components/Navbar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'moncinox vaults',
  description: 'doi doi doi doi',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#d9b3ff]`}>
        <Navbar />
        <main className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
            {children}
        </main>
      </body>
    </html>
  );
}