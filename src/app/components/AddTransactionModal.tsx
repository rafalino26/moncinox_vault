'use client';

import { useId, useState, useRef, ChangeEvent } from 'react';
import Image from 'next/image';
import { FiX, FiArrowUpRight, FiBookmark, FiCheck, FiCalendar } from 'react-icons/fi';
import { StitchActionLabel } from './StitchMotion';
import { addTransaction } from '@/app/actions/transactionActions';
import { useWallet } from './WalletContext';
import { useSwipeDismiss } from '../lib/use-swipe-dismiss';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddTransactionModal({ isOpen, onClose }: AddTransactionModalProps) {
  const { addSavedTransaction } = useWallet();
  const formId = useId();
  const panel = useRef<HTMLDivElement>(null);
  const [displayValue, setDisplayValue] = useState('');
  const [realValue, setRealValue] = useState('');
  const [tipe, setTipe] = useState<'pengeluaran' | 'tabungan'>('pengeluaran');
  const [sumber, setSumber] = useState<'Saya' | 'Pacar_Saya'>('Saya');
  const [keterangan, setKeterangan] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitLock = useRef(false);
  const [errorMessage, setErrorMessage] = useState('');
  const swipe = useSwipeDismiss({ panel, canDismiss: () => !submitLock.current, onDismiss: onClose });

  const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [tanggal, setTanggal] = useState(getTodayString());

  if (!isOpen) return null;

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

    const note = keterangan.trim() || (tipe === 'tabungan' ? 'Tabungan' : '');
    if (!note) {
      setErrorMessage('Keterangan wajib diisi!');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);
    submitLock.current = true;

    try {
      const formData = new FormData();
      formData.set('jumlah', realValue);
      formData.set('tipe', tipe);
      formData.set('sumber', sumber);
      formData.set('keterangan', note);
      formData.set('tanggal', tanggal);

      const result = await addTransaction(formData);

      if (!result.success) {
        setErrorMessage(result.error ?? 'Gagal menyimpan transaksi.');
        setIsSubmitting(false);
      } else {
        // The write response already contains the committed balance and real ID.
        addSavedTransaction(result.transaction, result.wallet);

        // Reset state
        setDisplayValue('');
        setRealValue('');
        setKeterangan('');
        setTipe('pengeluaran');
        setSumber('Saya');
        setIsSubmitting(false);
        
        // Wallet, summary, and history update together before closing.
        onClose();
      }
    } catch (err) {
      setErrorMessage('Terjadi kesalahan saat menyimpan transaksi.');
    } finally {
      submitLock.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <div className="compose-backdrop" onClick={() => { if (!submitLock.current) onClose(); }}>
      <div ref={panel} className="transaction-compose" role="dialog" aria-modal="true" aria-labelledby={`${formId}-title`}
        onClick={event => event.stopPropagation()}
        onKeyDown={event => {
          if (event.key === 'Escape' && !submitLock.current) { event.preventDefault(); onClose(); }
          if (event.key === 'Tab') {
            const elements = panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled)');
            if (!elements?.length) { event.preventDefault(); return; }
            const first = elements[0], last = elements[elements.length - 1];
            if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
            else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
          }
        }}>
        <header className="compose-header" {...swipe}>
          <div className="compose-handle" aria-hidden="true" />
          <div className="compose-header-copy">
            <p className="compose-eyebrow">mizukuzuw &amp; puzukuzuw</p>
            <h2 id={`${formId}-title`}>Catat transaksi</h2>
            <p>beli apa hari iniww</p>
          </div>
          <Image src="/stickers/stitchblue3.png" alt="" width={95} height={108} sizes="95px" className="compose-stitch" />
          <button type="button" className="compose-close" onClick={onClose} disabled={isSubmitting} aria-label="Tutup form transaksi"><FiX aria-hidden="true" /></button>
        </header>

        <form onSubmit={handleSubmit} className="compose-form" aria-busy={isSubmitting}>
          <div className="compose-fields">
            {errorMessage && <p id={`${formId}-error`} role="alert" className="compose-error">{errorMessage}</p>}
            <div className="compose-amount">
              <div><span aria-hidden="true">Rp</span><input id={`${formId}-amount`} aria-label="Jumlah transaksi dalam rupiah" type="text" inputMode="numeric" placeholder="0" value={displayValue}
                onChange={handleAmountChange} disabled={isSubmitting} aria-describedby={errorMessage ? `${formId}-error` : undefined} autoFocus required /></div>
            </div>

            <fieldset className="compose-group" disabled={isSubmitting}>
              <legend>Jenis transaksi</legend>
              <div className="compose-choices">
                <button type="button" className="compose-kind" aria-pressed={tipe === 'pengeluaran'} onClick={() => setTipe('pengeluaran')}>
                  <span className="compose-kind-icon"><FiArrowUpRight aria-hidden="true" /></span><span><strong>Pengeluaran</strong><small>Pakai saldo</small></span>
                </button>
                <button type="button" className="compose-kind" aria-pressed={tipe === 'tabungan'} onClick={() => setTipe('tabungan')}>
                  <span className="compose-kind-icon"><FiBookmark aria-hidden="true" /></span><span><strong>Tabungan</strong><small>Sisihkan saldo</small></span>
                </button>
              </div>
            </fieldset>

            <fieldset className="compose-group" disabled={isSubmitting}>
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
            </fieldset>

            <label className="compose-field" htmlFor={`${formId}-note`}><span>Keterangan</span>
              <input id={`${formId}-note`} type="text" placeholder={tipe === 'tabungan' ? 'Misalnya, tabungan liburan...' : 'Misalnya, makan bareng atau kopi sore...'}
                value={keterangan} onChange={event => setKeterangan(event.target.value)} disabled={isSubmitting} required={tipe !== 'tabungan'} maxLength={1000} />
            </label>
            <label className="compose-field" htmlFor={`${formId}-date`}><span><FiCalendar aria-hidden="true" />Tanggal catatan</span>
              <input id={`${formId}-date`} type="date" value={tanggal} onChange={event => setTanggal(event.target.value)} disabled={isSubmitting} required />
            </label>
          </div>
          <footer className="compose-footer">
            <button type="submit" className="compose-submit" disabled={isSubmitting} aria-busy={isSubmitting}>
              <StitchActionLabel pending={isSubmitting}>Simpan catatan</StitchActionLabel>
            </button>
            <p>jangan borosw borosw</p>
          </footer>
        </form>
      </div>
    </div>
  );
}
