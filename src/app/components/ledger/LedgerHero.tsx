import Image from 'next/image';
import { rupiah } from '../../lib/ledger';

export default function LedgerHero({ title, subtitle, total, label, period, count, sticker }: {
  title: string; subtitle?: string; total: number | null; label: string; period: string; count: number; sticker: string;
}) {
  return <section className="ledger-hero" aria-label={`Ringkasan ${title.toLowerCase()}`}>
    <div className="ledger-hero-content">
      <h1>{title}</h1>
      {subtitle && <p className="ledger-hero-subtitle">{subtitle}</p>}
      <div className="ledger-hero-total"><p>{label}</p><strong>{total === null ? '—' : rupiah(total)}</strong></div>
      <p className="ledger-hero-footnote">{period}<span>·</span>{total === null ? 'Memuat catatan' : `${count} transaksi`}</p>
    </div>
    <div className="ledger-hero-orbit" aria-hidden="true" />
    <Image src={sticker} alt="" width={170} height={180} sizes="(max-width: 640px) 120px, 170px" className="ledger-hero-stitch" />
  </section>;
}
