'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { FiGrid, FiArrowUpRight, FiArrowDownLeft, FiMenu, FiX } from 'react-icons/fi';
import type { ReactNode } from 'react';
import Image from 'next/image';

const navItems = [
  { href: '/', label: 'Dashboard', icon: FiGrid },
  { href: '/pengeluaran', label: 'Pengeluaran', icon: FiArrowUpRight },
  { href: '/pemasukan', label: 'Pemasukan', icon: FiArrowDownLeft },
];

const NavLinkDesktop = ({ href, children }: { href: string; children: ReactNode }) => {
  const pathname = usePathname();
  const isActive = pathname === href;
  return (
    <Link
      href={href}
      className={`px-4 py-2 rounded-full text-sm font-bold transition-all duration-200 ${
        isActive
          ? 'bg-[#5c2799] text-white shadow-md shadow-purple-900/20'
          : 'text-slate-600 hover:text-[#5c2799] hover:bg-purple-50'
      }`}
    >
      {children}
    </Link>
  );
};

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Top Bar Utama */}
      <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-purple-100 shadow-xs">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Bagian Kiri: Tombol Menu & Logo */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-purple-50 active:bg-purple-100 focus:outline-none"
                aria-label="Buka menu navigasi"
              >
                <FiMenu size={22} />
              </button>

              <Link href="/" className="flex items-center gap-2">
                <Image
                  src="/ramonvault.png"
                  alt="Ramon's Vault Logo"
                  width={110}
                  height={36}
                  priority
                  className="object-contain"
                />
                <div className="hidden sm:block">
                  <Image
                    src="/stickers/stitchblue.png"
                    alt="Stitch"
                    width={26}
                    height={26}
                    className="object-contain drop-shadow-xs"
                  />
                </div>
              </Link>
            </div>

            {/* Bagian Kanan: Navigasi Desktop */}
            <div className="hidden md:flex items-center space-x-2">
              {navItems.map((item) => (
                <NavLinkDesktop key={item.href} href={item.href}>
                  {item.label}
                </NavLinkDesktop>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* --- Sidebar Mobile --- */}
      <div
        onClick={() => setIsOpen(false)}
        className={`fixed inset-0 bg-black/40 backdrop-blur-xs z-50 transition-opacity duration-300 md:hidden ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />

      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-white shadow-2xl z-50 transition-transform duration-300 ease-in-out md:hidden border-r border-purple-100 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-5 flex flex-col h-full">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-purple-100">
            <div className="flex items-center gap-2">
              <Image
                src="/stickers/stitchbareng.png"
                alt="Stitch & Angel"
                width={36}
                height={36}
                className="object-contain"
              />
              <div>
                <h2 className="font-extrabold text-[#5c2799] text-base">Moncinox Vault</h2>
                <p className="text-[11px] text-slate-400 font-medium">shared budget tracker</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-xl hover:bg-slate-100 active:bg-slate-200 text-slate-500"
              aria-label="Tutup menu"
            >
              <FiX size={20} />
            </button>
          </div>

          <nav className="flex flex-col space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                    isActive
                      ? 'bg-[#5c2799] text-white shadow-md shadow-purple-900/20'
                      : 'text-slate-700 hover:bg-purple-50 active:bg-purple-100'
                  }`}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto pt-6 border-t border-purple-100 flex items-center justify-between text-xs text-purple-800 font-semibold">
            <span>puskas & miskas 💜</span>
            <span>v2.0</span>
          </div>
        </div>
      </aside>
    </>
  );
}
