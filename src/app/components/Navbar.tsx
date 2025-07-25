'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react'; // <-- Tambahkan useEffect
import { FiGrid, FiArrowRight, FiArrowLeft, FiMenu, FiX } from 'react-icons/fi';
import type { ReactNode } from 'react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: FiGrid },
  { href: '/pengeluaran', label: 'Pengeluaran', icon: FiArrowRight },
  { href: '/tabungan', label: 'Tabungan', icon: FiArrowLeft },
];

const NavLinkDesktop = ({ href, children }: { href: string, children: ReactNode }) => {
  const pathname = usePathname();
  const isActive = pathname === href;
  return (
    <Link href={href} className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-[#d9b3ff] text-[#4e1292]' : 'text-slate-700 hover:bg-black/5'}`}>
      {children}
    </Link>
  );
};

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Efek untuk menutup sidebar setiap kali pindah halaman
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Top Bar Utama */}
      <nav className="bg-gray-50 sticky top-0 z-40 shadow-sm">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            
            {/* Bagian Kiri: Tombol Menu & Judul */}
            <div className="flex items-center gap-4">
              <button onClick={() => setIsOpen(!isOpen)} className="md:hidden p-2 rounded-md text-slate-600 hover:bg-black/5">
                <FiMenu size={24} />
              </button>
              <Link href="/" className="text-xl font-bold text-[#5c2799]">
                Ramon's Vault
              </Link>
            </div>

            {/* Bagian Kanan: Navigasi Desktop */}
            <div className="hidden md:flex items-center space-x-4">
              {navItems.map(item => <NavLinkDesktop key={item.href} href={item.href}>{item.label}</NavLinkDesktop>)}
            </div>
          </div>
        </div>
      </nav>

      {/* --- Sidebar Mobile --- */}
      {/* Overlay (Latar Belakang Gelap) */}
      <div 
        onClick={() => setIsOpen(false)}
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 md:hidden ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />
      
      {/* Konten Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-gray-100 shadow-xl z-50 transition-transform duration-300 ease-in-out md:hidden ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-bold text-[#5c2799]">Menu</h2>
            <button onClick={() => setIsOpen(false)} className="p-2 rounded-md hover:bg-black/5">
                <FiX size={22} />
            </button>
          </div>
          <nav className="flex flex-col space-y-2">
            {navItems.map(item => (
              <Link key={item.href} href={item.href} className="flex items-center px-3 py-3 rounded-md text-base font-medium text-slate-700 hover:bg-black/5">
                <item.icon className="mr-3 h-6 w-6 text-[#5c2799]" />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
}