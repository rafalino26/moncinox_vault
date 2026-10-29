'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiGrid, FiArrowUpRight, FiArrowDownLeft } from 'react-icons/fi';

const navItems = [
  { href: '/', label: 'Home', icon: FiGrid },
  { href: '/pengeluaran', label: 'Pengeluaran', icon: FiArrowUpRight },
  { href: '/pemasukan', label: 'Pemasukan', icon: FiArrowDownLeft },
];

export default function BottomNav() {
  const pathname = usePathname();
  const activeIndex = navItems.findIndex((item) => pathname === item.href);
  const safeIndex = Math.max(activeIndex, 0);

  return (
    <div className="md:hidden fixed bottom-6 inset-x-0 mx-auto w-auto max-w-[285px] z-40 pointer-events-none px-3">
      {/* Liquid Glass Floating Capsule (Ala WhatsApp iOS - Pas & Mengambang) */}
      <nav className="pointer-events-auto relative bg-[#181028]/85 backdrop-blur-2xl border border-white/20 rounded-full shadow-[0_12px_35px_rgba(0,0,0,0.38)] p-1.5 flex items-center justify-between">
        {/* Sliding Active Pill */}
        <span
          aria-hidden="true"
          className="absolute top-0 bottom-0 left-0 rounded-full bg-white/20 transition-transform duration-300 ease-out pointer-events-none"
          style={{
            width: `calc(100% / ${navItems.length})`,
            transform: `translateX(${safeIndex * 100}%)`,
          }}
        />

        {navItems.map((item, index) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative z-10 flex-1 py-1.5 px-3 rounded-full flex flex-col items-center justify-center transition-colors duration-300 ${
                isActive
                  ? 'text-white font-black'
                  : 'text-white/60 hover:text-white font-semibold'
              }`}
            >
              <Icon size={18} className={isActive ? 'stroke-[2.5]' : 'stroke-[2]'} />
              <span className="text-[10px] tracking-tight mt-0.5 leading-none font-bold">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
