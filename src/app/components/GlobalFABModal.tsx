'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import FloatingActionButton from './FloatingActionButton';
import AddTransactionModal from './AddTransactionModal';

export default function GlobalFABModal() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {pathname !== '/pemasukan' && <FloatingActionButton onClick={() => setIsOpen(true)} />}
      {isOpen && <AddTransactionModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />}
    </>
  );
}
