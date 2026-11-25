'use client';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { FiX } from 'react-icons/fi';
import { useSwipeDismiss } from '../lib/use-swipe-dismiss';

export default function ComposeDialog({ title, subtitle, busy, onClose, children }: {
  title: string; subtitle: string; busy: boolean; onClose: () => void; children: ReactNode;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const locked = useRef(busy); locked.current = busy;
  const id = useId();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden'; setMounted(true);
    return () => { document.body.style.overflow = overflow; if (previous?.isConnected) previous.focus(); };
  }, []);
  useEffect(() => {
    if (mounted && !panel.current?.contains(document.activeElement)) panel.current?.querySelector<HTMLElement>('button, input')?.focus();
  }, [mounted]);
  const swipe = useSwipeDismiss({ panel, canDismiss: () => !locked.current, onDismiss: onClose });
  if (!mounted) return null;
  return createPortal(<div className="compose-backdrop" onClick={() => { if (!locked.current) onClose(); }}>
    <div ref={panel} className="transaction-compose" role="dialog" aria-modal="true" aria-labelledby={id}
      onClick={event => event.stopPropagation()} onKeyDown={event => {
        if (event.key === 'Escape' && !locked.current) { event.preventDefault(); onClose(); }
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
        <div className="compose-header-copy"><p className="compose-eyebrow">mizukuzuw &amp; puzukuzuw</p><h2 id={id}>{title}</h2><p>{subtitle}</p></div>
        <Image src="/stickers/stitchblue3.png" alt="" width={95} height={108} sizes="95px" className="compose-stitch" />
        <button type="button" className="compose-close" onClick={onClose} disabled={busy} aria-label="Tutup dialog"><FiX aria-hidden="true" /></button>
      </header>
      {children}
    </div>
  </div>, document.body);
}
