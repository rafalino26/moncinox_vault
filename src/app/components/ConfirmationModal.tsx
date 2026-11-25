'use client';
import { useState, useRef } from 'react';
import ComposeDialog from './ComposeDialog';
import { StitchActionLabel } from './StitchMotion';
import { offlineWriteError } from '../lib/connection';

interface ModalProps {
  title: string; message: string; onConfirm: () => Promise<void>; onCancel: () => void;
  tone?: 'default' | 'violet'; allowOffline?: boolean; confirmLabel?: string; pendingLabel?: string;
}

export default function ConfirmationModal({ title, message, onConfirm, onCancel, allowOffline = false, confirmLabel = 'Ya, hapus', pendingLabel = 'Menghapus…' }: ModalProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lock = useRef(false);
  const confirm = async () => {
    if (lock.current) return;
    const offlineError = !allowOffline && offlineWriteError();
    if (offlineError) { setError(offlineError); return; }
    lock.current = true; setBusy(true); setError(null);
    try { await onConfirm(); }
    catch (error) { setError(error instanceof Error ? error.message : 'Proses gagal. Silakan coba lagi.'); }
    finally { lock.current = false; setBusy(false); }
  };
  return <ComposeDialog title={title} subtitle="mizukuzuw & puzukuzuw" busy={busy} onClose={onCancel}>
    <div className="compose-form">
      <div className="compose-fields"><p className="compose-confirm-message">{message}</p>{error && <p role="alert" className="compose-error">{error}</p>}</div>
      <footer className="compose-footer compose-confirm-actions">
        <button type="button" className="compose-secondary" disabled={busy} onClick={onCancel}>Kembali</button>
        <button type="button" className="compose-submit" disabled={busy} aria-busy={busy} onClick={() => { void confirm(); }}>
          <StitchActionLabel pending={busy} pendingLabel={pendingLabel}>{confirmLabel}</StitchActionLabel>
        </button>
      </footer>
    </div>
  </ComposeDialog>;
}
