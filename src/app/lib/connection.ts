export function offlineWriteError(): string | null {
  return typeof navigator !== 'undefined' && navigator.onLine === false
    ? 'Sedang offline. Data hanya bisa dibaca; hubungkan internet untuk menyimpan perubahan.'
    : null;
}
