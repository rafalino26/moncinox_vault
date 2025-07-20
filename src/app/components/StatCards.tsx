'use client'; // <-- JADIKAN CLIENT COMPONENT

import { useState, useEffect } from "react";
import StatCard from "./StatCard";
import AddUangSakuModal from "./AddUangSakuModal";
import { getWallets } from "@/app/actions/transactionActions";
import { FiPlus, FiPocket } from 'react-icons/fi';
import type { Wallet } from "@prisma/client";

const formatRupiah = (amount: number | null | undefined) => `Rp${new Intl.NumberFormat('id-ID').format(amount || 0)}`;

export default function StatCards() {
    const [wallets, setWallets] = useState<{ rafaWallet: Wallet | null, monikWallet: Wallet | null }>({ rafaWallet: null, monikWallet: null });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPerson, setSelectedPerson] = useState<'Saya' | 'Pacar_Saya' | null>(null);

    // Ambil data wallet saat komponen dimuat
    useEffect(() => {
        getWallets().then(data => setWallets(data));
    }, []);

    const handleCardClick = (person: 'Saya' | 'Pacar_Saya') => {
        setSelectedPerson(person);
        setIsModalOpen(true);
    };
    
    return (
        <>
            <div className="mb-8">
                <h2 className="text-xl font-bold text-slate-800 mb-4">Ringkasan Saat Ini</h2>
                <div className="grid grid-cols-2 gap-4">
                    {/* Kartu Sisa Uang Rafa */}
                    <button onClick={() => handleCardClick('Saya')} className="text-left">
                        <StatCard 
                            title="Rafa"
                            value={formatRupiah(wallets.rafaWallet?.balance)}
                            Icon={FiPocket}
                            color="bg-blue-500"
                            ActionIcon={FiPlus}
                        />
                    </button>

                    {/* Kartu Sisa Uang Monik */}
                    <button onClick={() => handleCardClick('Pacar_Saya')} className="text-left">
                        <StatCard 
                            title="Monik"
                            value={formatRupiah(wallets.monikWallet?.balance)}
                            Icon={FiPocket}
                            color="bg-pink-500"
                            ActionIcon={FiPlus}
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