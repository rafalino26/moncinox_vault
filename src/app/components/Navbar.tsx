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

  return (
    <header className="bg-white/65 sticky top-0 z-40 border-b border-white/60">
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
          <nav aria-label="Navigasi utama" className="glass-nav glass-nav-desktop hidden md:grid">
            {activeIndex >= 0 && <span
              aria-hidden="true"
              className="glass-nav-indicator"
              style={{
                transform: `translateX(${activeIndex * 100}%)`,
              }}
            />}

            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className="glass-nav-link px-4 text-xs font-semibold"
                >
                  <span className="block">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
