'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import Image from 'next/image';

const FeedbackContext = createContext<((message: string) => void) | null>(null);

export function StitchFeedbackProvider({ children }: { children: ReactNode }) {
  const [notice, setNotice] = useState<{ id: number; message: string } | null>(null);
  const sequence = useRef(0);
  const celebrate = useCallback((message: string) => setNotice({ id: ++sequence.current, message }), []);
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(current => current?.id === notice.id ? null : current), 2400);
    return () => window.clearTimeout(timer);
  }, [notice]);

  return <FeedbackContext.Provider value={celebrate}>
    {children}
    <div className="stitch-notice-host" role="status" aria-live="polite" aria-atomic="true">
      {notice && <div className="stitch-notice" key={notice.id}>
        <Image src="/stickers/stitchblue3.png" alt="" width={64} height={72} sizes="64px" loading="eager" className="stitch-notice-character" />
        <div><strong>{notice.message}</strong><span>sudah tercatatww</span></div>
        <svg className="stitch-success-check" viewBox="0 0 32 32" fill="none" aria-hidden="true"><circle cx="16" cy="16" r="14" /><path d="m10 16 4 4 8-9" /></svg>
      </div>}
    </div>
  </FeedbackContext.Provider>;
}

export function useStitchFeedback() {
  const celebrate = useContext(FeedbackContext);
  if (!celebrate) throw new Error('Gunakan di dalam StitchFeedbackProvider');
  return celebrate;
}
