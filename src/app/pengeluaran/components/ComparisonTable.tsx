import type { ComparisonData } from '@/app/types';
import { rupiah } from '../../lib/ledger';
import { FiArrowUpRight } from 'react-icons/fi';

export default function ComparisonTable({ data, summary, onDetailClick }: {
  data: ComparisonData[]; summary?: { rafa: number; monik: number }; onDetailClick: (date: string) => void;
}) {
  return <>
    {summary && <div className="ledger-totals"><span>Puskasw<strong>{rupiah(summary.rafa)}</strong></span><span>Miskasw<strong>{rupiah(summary.monik)}</strong></span></div>}
    {data.length ? <ul className="ledger-rows">{data.map(row => <li key={row.dateKey} className="ledger-comparison-row">
      <div><h3>{row.tanggal}</h3><p>Puskasw <strong>{rupiah(row.rafa)}</strong></p><p>Miskasw <strong>{rupiah(row.monik)}</strong></p></div>
      <button type="button" className="ledger-detail-button" onClick={() => onDetailClick(row.dateKey)} aria-label={`Lihat detail ${row.tanggal}`}>Detail<FiArrowUpRight aria-hidden="true" /></button>
    </li>)}</ul> : <p className="ledger-empty">Belum ada catatan untuk dibandingkan di periode ini.</p>}
  </>;
}
