let until = 0;
export const isAppUpdating = () => Date.now() < until;
export const holdAppUpdate = () => { until = Date.now() + 10000; };
export const releaseAppUpdate = () => { until = 0; };
export function assertAppWritable() {
  if (isAppUpdating()) throw Error('Aplikasi sedang diperbarui sebentar. Coba lagi setelah selesai.');
}
