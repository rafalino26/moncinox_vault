import { StitchLoading } from './StitchMotion';

export default function DataStatus({ error, retry, loading = true, illustrated = true }: {
  error: string | null;
  retry: () => void;
  loading?: boolean;
  illustrated?: boolean;
}) {
  if (!error && !loading) return null;
  if (!error && illustrated) return <StitchLoading />;
  return (
    <div role={error ? 'alert' : 'status'} className="rounded-2xl border border-purple-100 bg-white/70 p-6 text-center text-sm text-purple-800">
      <p>{error || 'Memuat data...'}</p>
      {error && <button type="button" onClick={retry} className="mt-3 rounded-lg bg-purple-100 px-4 py-2 font-semibold">Coba lagi</button>}
    </div>
  );
}
