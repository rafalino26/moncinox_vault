'use client';

import { useId, useState, useRef, ChangeEvent } from 'react';
import Image from 'next/image';
import { FiArrowUpRight, FiBookmark, FiCheck, FiCalendar } from 'react-icons/fi';
import { StitchActionLabel } from './StitchMotion';
import type { PendingInput } from '../lib/offline-queue';
import { calendarDateKey } from '../lib/dates';
import ComposeDialog from './ComposeDialog';

interface ComposeProps {
  onClose: () => void;
  onSave: (input: PendingInput) => Promise<void>;
  initial?: PendingInput;
  title?: string;
  subtitle?: string;
  submitLabel?: string;
  income?: boolean;
}

export default function TransactionCompose({ onClose, onSave, initial, title = 'Catat transaksi', subtitle = 'beli apa hari iniww', submitLabel = 'Simpan catatan', income = false }: ComposeProps) {
  const formId = useId();
  const [displayValue, setDisplayValue] = useState(initial ? new Intl.NumberFormat('id-ID').format(initial.jumlah) : '');
  const [realValue, setRealValue] = useState(initial ? String(initial.jumlah) : '');
  const [tipe, setTipe] = useState<'pengeluaran' | 'tabungan'>(initial?.tipe || 'pengeluaran');
  const [sumber, setSumber] = useState<'Saya' | 'Pacar_Saya'>(initial?.sumber || 'Saya');
  const [keterangan, setKeterangan] = useState(initial?.keterangan || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitLock = useRef(false);
  const [errorMessage, setErrorMessage] = useState('');

  const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [tanggal, setTanggal] = useState(initial ? calendarDateKey(initial.tanggal) : getTodayString());


  const handleAmountChange = (e: ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, '');
    setRealValue(rawValue);
    if (rawValue) {
      setDisplayValue(new Intl.NumberFormat('id-ID').format(parseInt(rawValue, 10)));
    } else {
      setDisplayValue('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitLock.current) return;
    if (!realValue || Number(realValue) <= 0) {
      setErrorMessage('Nominal wajib diisi!');
      return;
    }

    const note = income ? 'Uang saku' : keterangan.trim() || (tipe === 'tabungan' ? 'Tabungan' : '');
    if (!note) {
      setErrorMessage('Keterangan wajib diisi!');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);
    submitLock.current = true;

    try {
      await onSave({ jumlah: Number(realValue), tipe, sumber, keterangan: note, tanggal });
      onClose();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Catatan belum tersimpan. Jangan tutup form; coba lagi.');
    } finally {
      submitLock.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <ComposeDialog title={title} subtitle={subtitle} busy={isSubmitting} onClose={onClose}>
        <form onSubmit={handleSubmit} className="compose-form" aria-busy={isSubmitting}>
          <div className="compose-fields">
            {errorMessage && <p id={`${formId}-error`} role="alert" className="compose-error">{errorMessage}</p>}
            <div className="compose-amount">
              <div><span aria-hidden="true">Rp</span><input id={`${formId}-amount`} aria-label="Jumlah transaksi dalam rupiah" type="text" inputMode="numeric" placeholder="0" value={displayValue}
                onChange={handleAmountChange} disabled={isSubmitting} aria-describedby={errorMessage ? `${formId}-error` : undefined} autoFocus required /></div>
            </div>

            {!income && <fieldset className="compose-group" disabled={isSubmitting}>
              <legend>Jenis transaksi</legend>
              <div className="compose-choices">
                <button type="button" className="compose-kind" aria-pressed={tipe === 'pengeluaran'} onClick={() => setTipe('pengeluaran')}>
                  <span className="compose-kind-icon"><FiArrowUpRight aria-hidden="true" /></span><span><strong>Pengeluaran</strong><small>Pakai saldo</small></span>
                </button>
                <button type="button" className="compose-kind" aria-pressed={tipe === 'tabungan'} onClick={() => setTipe('tabungan')}>
                  <span className="compose-kind-icon"><FiBookmark aria-hidden="true" /></span><span><strong>Tabungan</strong><small>Sisihkan saldo</small></span>
                </button>
              </div>
            </fieldset>}

            {!income && <fieldset className="compose-group" disabled={isSubmitting}>
              <legend>Sumber saldo</legend>
              <div className="compose-choices">
                {([{ value: 'Saya', name: 'Puskasw', person: 'Rafa', avatar: '/rafa.png' },
                  { value: 'Pacar_Saya', name: 'Miskasw', person: 'Monik', avatar: '/monik.png' }] as const).map(person =>
                    <button type="button" key={person.value} className="compose-person" aria-pressed={sumber === person.value} onClick={() => setSumber(person.value)}>
                      <Image src={person.avatar} alt="" width={30} height={30} sizes="30px" />
                      <span><strong>{person.name}</strong><small>{person.person}</small></span>
                      <span className="compose-person-check" aria-hidden="true">{sumber === person.value && <FiCheck />}</span>
                    </button>)}
              </div>
            </fieldset>}

            {!income && <label className="compose-field" htmlFor={`${formId}-note`}><span>Keterangan</span>
              <input id={`${formId}-note`} type="text" placeholder={tipe === 'tabungan' ? 'Misalnya, tabungan liburan...' : 'Misalnya, makan bareng atau kopi sore...'}
                value={keterangan} onChange={event => setKeterangan(event.target.value)} disabled={isSubmitting} required={tipe !== 'tabungan'} maxLength={1000} />
            </label>}
            {!income && <label className="compose-field" htmlFor={`${formId}-date`}><span><FiCalendar aria-hidden="true" />Tanggal catatan</span>
              <input id={`${formId}-date`} type="date" value={tanggal} onChange={event => setTanggal(event.target.value)} disabled={isSubmitting} required />
            </label>}
          </div>
          <footer className="compose-footer">
            <button type="submit" className="compose-submit" disabled={isSubmitting} aria-busy={isSubmitting}>
              <StitchActionLabel pending={isSubmitting}>{submitLabel}</StitchActionLabel>
            </button>
            <p>{income ? 'mizukuzuw & puzukuzuw' : 'jangan borosw borosw'}</p>
          </footer>
        </form>
    </ComposeDialog>
  );
}
