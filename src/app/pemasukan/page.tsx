import { Suspense } from 'react';
import PemasukanClientView from './components/PemasukanClientView';
import { StitchLoading } from '../components/StitchMotion';
export default function PemasukanPage() {
  return <Suspense fallback={<StitchLoading centered />}><PemasukanClientView /></Suspense>;
}
