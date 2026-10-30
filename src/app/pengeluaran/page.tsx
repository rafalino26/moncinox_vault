import { Suspense } from 'react';
import TransactionView from '../components/TransactionView';
import { StitchLoading } from '../components/StitchMotion';
export default function PengeluaranPage() {
  return <Suspense fallback={<StitchLoading centered />}><TransactionView /></Suspense>;
}
