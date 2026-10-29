'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

const navItems = [
  { href: '/', label: 'Dashboard' },
  { href: '/pengeluaran', label: 'Pengeluaran' },
  { href: '/pemasukan', label: 'Pemasukan' },
];

export default function Navbar() {
  const pathname = usePathname();
  const activeIndex = navItems.findIndex((item) => pathname === item.href);
  const safeIndex = Math.max(activeIndex, 0);

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

          {/* Desktop Navigation (Layar Lebih Besar) */}
          <div className="relative hidden md:flex w-max items-center">
            {/* Sliding Active Pill */}
            <span
              aria-hidden="true"
              className="absolute top-0 bottom-0 left-0 rounded-full bg-[#5c2799] shadow-md shadow-purple-900/20 transition-transform duration-300 ease-out pointer-events-none"
              style={{
                width: `calc(100% / ${navItems.length})`,
                transform: `translateX(${safeIndex * 100}%)`,
              }}
            />

            {navItems.map((item, index) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative z-10 flex-1 px-4 text-left text-sm font-bold rounded-full py-2 transition-colors duration-200 focus:outline-none ${
                    isActive
                      ? 'text-white'
                      : 'text-slate-600 hover:text-[#5c2799] hover:bg-purple-50'
                  }`}
                >
                  <span className="block">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
