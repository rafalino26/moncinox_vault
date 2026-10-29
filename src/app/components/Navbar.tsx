'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { FiGrid, FiArrowRight, FiArrowLeft, FiMenu, FiX } from 'react-icons/fi';
import type { ReactNode } from 'react';
import Image from 'next/image';

const navItems = [
  { href: '/', label: 'Dashboard', icon: FiGrid },
  { href: '/pengeluaran', label: 'Pengeluaran', icon: FiArrowRight },
  { href: '/pemasukan', label: 'pemasukan', icon: FiArrowLeft },
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
      <nav className="bg-gray-50/90 backdrop-blur-md sticky top-0 z-40 shadow-sm border-b border-black/5">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            
            {/* Bagian Kiri: Tombol Menu & Judul */}
            <div className="flex items-center gap-3 sm:gap-4">
              <button 
                onClick={() => setIsOpen(!isOpen)} 
                className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-black/5 active:bg-black/10 focus:outline-none"
                aria-label="Buka menu navigasi"
              >
                <FiMenu size={24} />
              </button>
              <Link href="/" className="flex items-center z-50">
                <Image
                  src="/ramonvault.png"
                  alt="Ramon's Vault Logo"
                  width={110}
                  height={36}
                  priority
                  className="object-contain"
                />
              </Link>
            </div>

            {/* Bagian Kanan: Navigasi Desktop */}
            <div className="hidden md:flex items-center space-x-2 lg:space-x-4">
              {navItems.map(item => <NavLinkDesktop key={item.href} href={item.href}>{item.label}</NavLinkDesktop>)}
            </div>
          </div>
        </div>
      </nav>

      {/* --- Sidebar Mobile --- */}
      {/* Overlay */}
      <div 
        onClick={() => setIsOpen(false)}
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300 md:hidden ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />
      
      {/* Konten Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-gray-100 shadow-2xl z-50 transition-transform duration-300 ease-in-out md:hidden ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-5 flex flex-col h-full">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-bold text-[#5c2799] text-lg">Menu</h2>
            <button 
              onClick={() => setIsOpen(false)} 
              className="p-2 rounded-lg hover:bg-black/5 active:bg-black/10 text-slate-600"
              aria-label="Tutup menu"
            >
              <FiX size={22} />
            </button>
          </div>
          <nav className="flex flex-col space-y-2">
            {navItems.map(item => {
              const isActive = pathname === item.href;
              return (
                <Link 
                  key={item.href} 
                  href={item.href} 
                  className={`flex items-center px-4 py-3 rounded-xl text-base font-medium transition-colors ${
                    isActive ? 'bg-[#d9b3ff] text-[#4e1292] font-semibold' : 'text-slate-700 hover:bg-black/5'
                  }`}
                >
                  <item.icon className="mr-3 h-5 w-5 text-[#5c2799]" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
}
