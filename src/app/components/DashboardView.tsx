'use client';

// Hapus useState, useEffect, useCallback, dan getWallets
import { Suspense, ReactNode } from 'react'; 
import type { Wallet } from '@prisma/client';

import StatCards from './StatCards';
import TransactionForm from './TransactionForm';
import CollapsibleSection from './CollapsibleSection';

export default function DashboardView({ charts, transactionList }: { charts: ReactNode, transactionList: ReactNode }) {
    // Hapus semua state dan fungsi refreshData dari sini

    return (
        <div className="space-y-8">
            {/* Panggil StatCards tanpa props */}
            <StatCards />
            
            {/* Panggil TransactionForm tanpa props */}
            <TransactionForm />
            
            <CollapsibleSection title="inii buat liatt grafikkk ayanggg">
                {charts}
            </CollapsibleSection>
            
            <CollapsibleSection title="terus ini buat liat historyy hehe">
                {transactionList}
            </CollapsibleSection>
        </div>
    );
}