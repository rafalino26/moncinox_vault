'use client';

import { useState, useMemo } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import type { Transaction } from '@prisma/client';
import { deleteTransaction } from '../actions/transactionActions';
import { useTransactionsData, useWallet } from './WalletContext';
import { filterTransactions } from '../lib/transaction-filters';
import { groupTransactionsByDay } from '../lib/transaction-groups';
import { calendarDateKey, calendarDateLabel } from '../lib/dates';
import DataStatus from './DataStatus';
import FilterControls from '../pengeluaran/components/FilterControls';
import DataView from '../pengeluaran/components/DataView';
import ConfirmationModal from './ConfirmationModal';
import ComparisonTable from '../pengeluaran/components/ComparisonTable';
import ComparisonDetailModal from '../pengeluaran/components/ComparisonDetailModal';
import EditTransactionModal from './EditTransactionModal';

const ComparisonChart = dynamic(() => import('./ComparisonChart'), { ssr: false });

export default function TransactionView() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const transactionData = useTransactionsData();
  const { removeSavedTransaction } = useWallet();
  const [mutationError, setMutationError] = useState<string | null>(null);
  const filterKey = JSON.stringify(['rentang', 'urutkan', 'sumber', 'tipe', 'from', 'to'].map(key => [key, searchParams.get(key)]).filter(([, value]) => value !== null));
  const transactions = useMemo(() => {
    return filterTransactions(transactionData.data ?? [], Object.fromEntries(JSON.parse(filterKey)));
  }, [transactionData.data, filterKey]);
  const [query, setQuery] = useState('');
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
  const [viewMode, setViewMode] = useState<'semua' | 'perbandingan'>('semua');
  const [detailDate, setDetailDate] = useState<string | null>(null);
  const activeTipe = (searchParams.get('tipe') as 'pengeluaran' | 'tabungan' | null) || 'semua';

  const filteredTransactions = useMemo(() => {
    if (!query) return transactions;
    const queryLower = query.toLowerCase();
    return transactions.filter(
      (t) =>
        t.keterangan?.toLowerCase().includes(queryLower) ||
        new Date(t.tanggal)
          .toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
          .toLowerCase()
          .includes(queryLower)
    );
  }, [transactions, query]);

  const comparisonSummary = useMemo(() => {
    return filteredTransactions.reduce(
      (acc, t) => {
        if (t.sumber === 'Saya') acc.rafa += t.jumlah;
        else if (t.sumber === 'Pacar_Saya') acc.monik += t.jumlah;
        return acc;
      },
      { rafa: 0, monik: 0 }
    );
  }, [filteredTransactions]);

  const comparisonData = useMemo(() => groupTransactionsByDay(filteredTransactions).reverse(), [filteredTransactions]);

  const totalPengeluaran = filteredTransactions
    .filter((t) => t.tipe === 'pengeluaran')
    .reduce((sum, t) => sum + t.jumlah, 0);
  const totalTabungan = filteredTransactions
    .filter((t) => t.tipe === 'tabungan')
    .reduce((sum, t) => sum + t.jumlah, 0);

  const handleDeleteClick = (transaction: Transaction) => {
    setTransactionToDelete(transaction);
  };

  const handleConfirmDelete = async () => {
    if (!transactionToDelete) return;
    setMutationError(null);
    try {
      const result = await deleteTransaction(transactionToDelete.id);
      if (!result.success) {
        setMutationError(result.error ?? 'Gagal menghapus transaksi.');
      } else {
        removeSavedTransaction(transactionToDelete.id, result.wallet);
      }
    } catch {
      setMutationError('Gagal menghapus transaksi. Silakan coba lagi.');
    }
    setTransactionToDelete(null);
  };

  const handleEditClick = (transaction: Transaction) => {
    setTransactionToEdit(transaction);
  };

  const handleDetailClick = (date: string) => {
    setDetailDate(date);
  };

  const handleTipeChange = (tipe: 'semua' | 'pengeluaran' | 'tabungan') => {
    const params = new URLSearchParams(searchParams);
    if (tipe === 'semua') {
      params.delete('tipe');
    } else {
      params.set('tipe', tipe);
    }
    window.history.replaceState(null, '', `${pathname}?${params.toString()}`);
  };

  return (
    <>
      <div className="space-y-5">
        {mutationError && <p role="alert" className="text-sm text-red-700">{mutationError}</p>}
        {/* Filter Tipe Transaksi */}
        <div className="flex items-center justify-center p-1.5 bg-white/80 backdrop-blur-md rounded-2xl border border-purple-100 shadow-xs">
          <button
            onClick={() => handleTipeChange('semua')}
            className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTipe === 'semua'
                ? 'bg-[#5c2799] text-white shadow-sm'
                : 'text-slate-600 hover:text-[#5c2799]'
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => handleTipeChange('pengeluaran')}
            className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTipe === 'pengeluaran'
                ? 'bg-[#5c2799] text-white shadow-sm'
                : 'text-slate-600 hover:text-[#5c2799]'
            }`}
          >
            Pengeluaran
          </button>
          <button
            onClick={() => handleTipeChange('tabungan')}
            className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTipe === 'tabungan'
                ? 'bg-[#5c2799] text-white shadow-sm'
                : 'text-slate-600 hover:text-[#5c2799]'
            }`}
          >
            Tabungan
          </button>
        </div>

        <FilterControls onSearchChange={setQuery} />

        <DataStatus error={transactionData.error} retry={transactionData.retry} loading={transactionData.isLoading} />
        {transactionData.data && (
          <>
            <div className="flex items-center justify-center mb-2 border-b border-purple-200/60">
              <button
                onClick={() => setViewMode('semua')}
                className={`px-4 py-2.5 font-bold transition-all rounded-t-xl text-xs sm:text-sm ${
                  viewMode === 'semua'
                    ? 'border-b-2 border-[#5c2799] text-[#5c2799]'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Daftar Transaksi
              </button>
              <button
                onClick={() => setViewMode('perbandingan')}
                className={`px-4 py-2.5 font-bold transition-all rounded-t-xl text-xs sm:text-sm ${
                  viewMode === 'perbandingan'
                    ? 'border-b-2 border-[#5c2799] text-[#5c2799]'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Perbandingan Puskas & Miskas
              </button>
            </div>

            {viewMode === 'semua' ? (
              <DataView
                data={filteredTransactions}
                onDelete={handleDeleteClick}
                onEdit={handleEditClick}
                totalPengeluaran={totalPengeluaran}
                totalTabungan={totalTabungan}
              />
            ) : (
              <div className="space-y-6">
                <div className="bg-white/85 backdrop-blur-md p-4 sm:p-5 rounded-3xl border border-purple-100 shadow-sm">
                  <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-3 text-center">
                    Tabel Perbandingan (Puskas vs Miskas)
                  </h3>
                  <ComparisonTable
                    data={comparisonData}
                    summary={comparisonSummary}
                    onDetailClick={handleDetailClick}
                  />
                </div>
                <div className="bg-white/85 backdrop-blur-md p-4 sm:p-5 rounded-3xl border border-purple-100 shadow-sm">
                  <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-3 text-center">
                    Grafik Perbandingan
                  </h3>
                  <ComparisonChart data={comparisonData} />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {transactionToDelete && (
        <ConfirmationModal
          title="Hapus Transaksi?"
          message={`Yakin mau hapus transaksi "${transactionToDelete.keterangan}"? Saldo akan dikembalikan.`}
          onConfirm={handleConfirmDelete}
          onCancel={() => setTransactionToDelete(null)}
        />
      )}

      {transactionToEdit && (
        <EditTransactionModal
          transaction={transactionToEdit}
          onClose={() => setTransactionToEdit(null)}
          onSuccess={() => {
            setTransactionToEdit(null);
          }}
        />
      )}

      {detailDate && (
        <ComparisonDetailModal
          date={calendarDateLabel(detailDate)}
          transactions={filteredTransactions.filter(transaction => calendarDateKey(transaction.tanggal) === detailDate)}
          onClose={() => setDetailDate(null)}
        />
      )}
    </>
  );
}
