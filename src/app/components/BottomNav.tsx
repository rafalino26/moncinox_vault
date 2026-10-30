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

  return (
    <div className="glass-nav-dock md:hidden">
      <nav aria-label="Navigasi utama" className="glass-nav glass-nav-mobile">
        {activeIndex >= 0 && <span
          aria-hidden="true"
          className="glass-nav-indicator"
          style={{
            transform: `translateX(${activeIndex * 100}%)`,
          }}
        />}

        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className="glass-nav-link flex-col gap-1"
            >
              <Icon aria-hidden="true" size={23} className={isActive ? 'stroke-[2.3]' : 'stroke-[1.8]'} />
              <span className="text-[11px] leading-tight font-semibold tracking-tight">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
