'use client';

import { useEffect, useRef, useState } from 'react';
import { FiDownload, FiX } from 'react-icons/fi';

interface InstallPrompt extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PwaControls() {
  const [ready, setReady] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [offline, setOffline] = useState(false);
  const [ios, setIos] = useState(false);
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [installing, setInstalling] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)');
    const checkInstalled = () => setInstalled(standalone.matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
    const checkConnection = () => setOffline(!navigator.onLine);
    const onPrompt = (event: Event) => { event.preventDefault(); setPrompt(event as InstallPrompt); };
    const onInstalled = () => { setInstalled(true); setPrompt(null); dialog.current?.close(); };
    checkInstalled();
    checkConnection();
    setIos(/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));
    setReady(true);
    standalone.addEventListener('change', checkInstalled);
    window.addEventListener('online', checkConnection);
    window.addEventListener('offline', checkConnection);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);

    if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator && window.isSecureContext) {
      // Best effort: a registration failure must not interfere with financial operations.
      void navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' }).catch(() => {});
    }
    return () => {
      standalone.removeEventListener('change', checkInstalled);
      window.removeEventListener('online', checkConnection);
      window.removeEventListener('offline', checkConnection);
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const install = async () => {
    if (!prompt) { dialog.current?.showModal(); return; }
    setInstalling(true);
    try {
      await prompt.prompt();
      await prompt.userChoice;
    } catch { dialog.current?.showModal(); }
    finally { setPrompt(null); setInstalling(false); }
  };

  return <>
    {ready && !installed && <button type="button" className="pwa-install-button" onClick={install} disabled={installing}>
      <FiDownload aria-hidden="true" /><span>{installing ? 'Memasang…' : 'Pasang app'}</span>
    </button>}
    {offline && <div className="pwa-offline-notice" role="status">Sedang offline · Hubungkan internet untuk menyimpan perubahan.</div>}
    <dialog ref={dialog} className="pwa-install-dialog" aria-labelledby="pwa-install-title" onClick={event => { if (event.target === event.currentTarget) dialog.current?.close(); }}>
      <div className="pwa-install-heading"><h2 id="pwa-install-title">Pasang Moncinox</h2><button type="button" onClick={() => dialog.current?.close()} aria-label="Tutup panduan pemasangan"><FiX aria-hidden="true" /></button></div>
      <p>Buka langsung dari layar utama HP.</p>
      {ios ? <ol><li>Buka web ini di Safari.</li><li>Ketuk Bagikan, lalu <strong>Add to Home Screen</strong> / Tambah ke Layar Utama.</li><li>Aktifkan <strong>Open as Web App</strong> jika tersedia, lalu ketuk Tambah.</li></ol>
        : <ol><li>Buka web ini di Chrome atau Edge.</li><li>Buka menu browser, lalu pilih <strong>Install app</strong> / Pasang aplikasi atau Tambah ke Layar Utama.</li><li>Ikuti petunjuk pemasangan. Nama menu bisa berbeda sesuai browser.</li></ol>}
      <p className="pwa-install-footnote">Kalau dibuka dari aplikasi chat, buka dulu tautannya di browser. Transaksi tetap membutuhkan internet.</p>
    </dialog>
  </>;
}
