'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { LayoutDashboard, ArrowLeftRight, PiggyBank, Menu, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { FiGrid, FiArrowRight, FiArrowLeft, FiMenu, FiX } from 'react-icons/fi';

const navItems = [
  { href: '/', label: 'Dashboard', icon: FiGrid },
  { href: '/pengeluaran', label: 'Pengeluaran', icon: FiArrowRight },
  { href: '/tabungan', label: 'Tabungan', icon: FiArrowLeft },
];

type NavLinkProps = { href: string; children: ReactNode };

const NavLink = ({ href, children }: NavLinkProps) => {
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
  return (
    <nav className="bg-gray-50 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4"><div className="flex items-center justify-between h-16">
        <Link href="/" className="text-xl font-bold text-[#5c2799]">Ramon's Vault</Link>
        <div className="hidden md:flex items-center space-x-4">
          {navItems.map(item => <NavLink key={item.href} href={item.href}>{item.label}</NavLink>)}
        </div>
        <div className="md:hidden">
          <button onClick={() => setIsOpen(!isOpen)} className="p-2 rounded-md text-slate-600 hover:bg-black/5">
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div></div>
      {isOpen && (
        <div className="md:hidden px-2 pt-2 pb-3 space-y-1 sm:px-3">
          {navItems.map(item => (<Link key={item.href} href={item.href} className="flex items-center px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-black/5"><item.icon className="mr-3 h-6 w-6 text-[#5c2799]" />{item.label}</Link>))}
        </div>
      )}
    </nav>
  );
}