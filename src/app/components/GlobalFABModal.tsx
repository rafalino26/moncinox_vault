'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import FloatingActionButton from './FloatingActionButton';
import AddTransactionModal from './AddTransactionModal';

export default function GlobalFABModal() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <FloatingActionButton onClick={() => setIsOpen(true)} />
      <AddTransactionModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSuccess={() => {
          router.refresh();
        }}
      />
    </>
  );
}
