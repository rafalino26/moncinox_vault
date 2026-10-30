'use client';

import { useState } from 'react';
import FloatingActionButton from './FloatingActionButton';
import AddTransactionModal from './AddTransactionModal';

export default function GlobalFABModal() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <FloatingActionButton onClick={() => setIsOpen(true)} />
      <AddTransactionModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
