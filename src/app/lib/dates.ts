const calendarPattern = /^(\d{4})-(\d{2})-(\d{2})$/;

// Reject rollover dates such as February 30 instead of silently moving to March.
export function parseCalendarDate(value: string, utc = false): Date | null {
  const match = calendarPattern.exec(value);
  if (!match) return null;
  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText), month = Number(monthText) - 1, day = Number(dayText);
  const date = new Date(0);
  if (utc) {
    date.setUTCFullYear(year, month, day);
    date.setUTCHours(0, 0, 0, 0);
    if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month || date.getUTCDate() !== day) return null;
  } else {
    date.setFullYear(year, month, day);
    date.setHours(0, 0, 0, 0);
    if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) return null;
  }
  return date;
}

export function parseTransactionDate(value: unknown): Date | null {
  if (value instanceof Date) return Number.isFinite(value.getTime()) ? value : null;
  if (typeof value !== 'string') return null;
  if (calendarPattern.test(value)) return parseCalendarDate(value, true);
  // Android sends ISO timestamps; accept those alongside the web date input.
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?$/.test(value)) return null;
  if (!parseCalendarDate(value.slice(0, 10), true)) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

export function calendarDateKey(value: Date | string): string {
  const date = new Date(value);
  return `${String(date.getFullYear()).padStart(4, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

const dayFormatter = new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
export function calendarDateLabel(key: string): string {
  const date = parseCalendarDate(key);
  return date ? dayFormatter.format(date) : key;
}
