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

  return (
    <div className="md:hidden fixed bottom-3 inset-x-0 mx-auto w-auto max-w-[250px] z-40 pointer-events-none px-2">
      {/* Liquid Glass Slim Floating Capsule (Ramping & Minimalis) */}
      <nav className="pointer-events-auto bg-[#181028]/85 backdrop-blur-2xl border border-white/20 rounded-full shadow-[0_8px_25px_rgba(0,0,0,0.35)] p-1 flex items-center justify-between">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 py-1 px-1.5 rounded-full flex flex-col items-center justify-center transition-all duration-150 ${
                isActive
                  ? 'bg-white/20 text-white font-black shadow-xs'
                  : 'text-white/60 hover:text-white font-medium'
              }`}
            >
              <Icon size={16} className={isActive ? 'stroke-[2.5]' : 'stroke-[2]'} />
              <span className="text-[9.5px] tracking-tight mt-0.5 leading-none">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
