import Image from 'next/image';

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
      <div className="stitch-rocket-launch"><div className="stitch-rocket">
        <span className="stitch-rocket-flame" /><span className="stitch-rocket-fin fin-left" /><span className="stitch-rocket-fin fin-right" />
        <span className="stitch-rocket-hull" />
        <Image src="/stickers/stitchblue3.png" alt="" width={80} height={96} sizes="80px" loading="eager" className="stitch-rocket-pilot" />
      </div></div>
    </div>
    <p>Memuat data<span className="stitch-rocket-ellipsis" aria-hidden="true">…</span></p>
  </div>;
}

export function StitchSaving() {
  return <span className="stitch-saving" role="status"><StitchFlight compact /><span>Menyimpan…</span></span>;
}
