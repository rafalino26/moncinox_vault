import Image from 'next/image';
import type { ReactNode } from 'react';

function StitchRocket({ compact = false }: { compact?: boolean }) {
  return <div className="stitch-rocket">
    <span className="stitch-rocket-flame" /><span className="stitch-rocket-fin fin-left" /><span className="stitch-rocket-fin fin-right" />
    <span className="stitch-rocket-hull" />
    <Image src="/stickers/stitchblue3.png" alt="" width={80} height={96} sizes={compact ? '28px' : '80px'} loading="eager" className="stitch-rocket-pilot" />
  </div>;
}

export function StitchSubmitRocket({ spinning }: { spinning: boolean }) {
  return <span className={`stitch-submit-rocket${spinning ? ' is-spinning' : ''}`} aria-hidden="true">
    <span className="stitch-submit-spinner"><span className="stitch-submit-scale"><StitchRocket compact /></span></span>
  </span>;
}

export function StitchPeek() {
  return <span className="stitch-peek" aria-hidden="true">
    <Image src="/stickers/stitchblue3.png" alt="" width={64} height={77} sizes="64px" className="stitch-peek-character" />
  </span>;
}

export function StitchFlight({ compact = false }: { compact?: boolean }) {
  return <span className={`stitch-flight${compact ? ' stitch-flight-compact' : ''}`} aria-hidden="true">
    <Image src="/stickers/stitchblue3.png" alt="" width={80} height={88} sizes={compact ? '36px' : '80px'} loading="eager" className="stitch-flight-character" />
    <span className="stitch-flight-dots"><i /><i /><i /></span>
  </span>;
}

export function StitchLoading({ centered = false }: { centered?: boolean }) {
  return <div className={`stitch-loading-scene${centered ? ' stitch-loading-centered' : ''}`} role="status" aria-live="polite">
    <div className="stitch-rocket-stage" aria-hidden="true">
      <span className="stitch-rocket-spark spark-one" /><span className="stitch-rocket-spark spark-two" />
      <span className="stitch-rocket-streak streak-one" /><span className="stitch-rocket-streak streak-two" /><span className="stitch-rocket-streak streak-three" />
      <div className="stitch-rocket-launch"><StitchRocket /></div>
    </div>
    <p>Memuat data<span className="stitch-rocket-ellipsis" aria-hidden="true">…</span></p>
  </div>;
}

export function StitchActionLabel({ pending, children, pendingLabel = 'Menyimpan…' }: {
  pending: boolean;
  children: ReactNode;
  pendingLabel?: string;
}) {
  return <span className="stitch-saving">
    <StitchSubmitRocket spinning={pending} />
    <span role={pending ? 'status' : undefined}>{pending ? pendingLabel : children}</span>
  </span>;
}
