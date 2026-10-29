'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import Image from 'next/image';

const navItems = [
  { href: '/', label: 'Dashboard' },
  { href: '/pengeluaran', label: 'Pengeluaran' },
  { href: '/pemasukan', label: 'Pemasukan' },
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
  return (
    <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-purple-100 shadow-xs">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo & Stitch Brand */}
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/ramonvault.png"
              alt="Ramon's Vault Logo"
              width={105}
              height={34}
              priority
              className="object-contain"
            />
            <div className="flex items-center">
              <Image
                src="/stickers/stitchblue.png"
                alt="Stitch"
                width={24}
                height={24}
                className="object-contain drop-shadow-xs"
              />
            </div>
          </Link>

          {/* Desktop Navigation (Layar Lebar) */}
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
  );
}
