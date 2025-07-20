'use client';

import { useState, useEffect, useCallback } from "react";
import StatCard from "./StatCard";
import AddUangSakuModal from "./AddUangSakuModal";
import { getWallets } from "@/app/actions/transactionActions";
import { FiPlus } from 'react-icons/fi';
import type { Wallet } from "@prisma/client";

const formatRupiah = (amount: number | null | undefined) => `Rp${new Intl.NumberFormat('id-ID').format(amount || 0)}`;

export default function StatCards() {
    const [wallets, setWallets] = useState<{ rafaWallet: Wallet | null, monikWallet: Wallet | null }>({ rafaWallet: null, monikWallet: null });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPerson, setSelectedPerson] = useState<'Saya' | 'Pacar_Saya' | null>(null);

    const fetchWallets = useCallback(async () => {
        const data = await getWallets();
        setWallets(data);
    }, []);

    useEffect(() => {
        fetchWallets();
    }, [fetchWallets]);

    const handleCardClick = (person: 'Saya' | 'Pacar_Saya') => {
        setSelectedPerson(person);
        setIsModalOpen(true);
    };
    
    return (
        <>
            <div className="mb-8">
                <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => handleCardClick('Saya')} className="text-left">
                        <StatCard 
                            title="Rafa"
                            value={formatRupiah(wallets.rafaWallet?.balance)}
                            Icon="/rafa.png" // Path ke gambar
                            color="transparent"
                            
                        />
                    </button>
                    <button onClick={() => handleCardClick('Pacar_Saya')} className="text-left">
                        <StatCard 
                            title="Monik"
                            value={formatRupiah(wallets.monikWallet?.balance)}
                            Icon="/monik.png" // Path ke gambar
                            color="transparent"
                            
                        />
                    </button>
                </div>
            </div>

            {isModalOpen && selectedPerson && (
                <AddUangSakuModal 
                    person={selectedPerson}
                    personName={selectedPerson === 'Saya' ? 'Rafa' : 'Monik'}
                    onClose={() => setIsModalOpen(false)}
                />
            )}
        </>
    );
}