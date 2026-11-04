const numberFormat = new Intl.NumberFormat('id-ID');
const decimalFormat = new Intl.NumberFormat('id-ID', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1
});

export const MONTHS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des'
];

export const MONTHS_LONG = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember'
];

export function num(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return numberFormat.format(value);
}

export function decimal(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return decimalFormat.format(value);
}

export function pct(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return `${decimal(value)}%`;
}

export function monthFromKey(key: string): string {
  const index = Number(key.slice(5, 7)) - 1;
  return MONTHS_SHORT[index] ?? key;
}

export function dateShort(value: string): string {
  if (!value) return '—';
  const [day, month, year] = value.split('/').map(Number);
  if (!day || !month || !year) return value;
  return `${day} ${MONTHS_SHORT[month - 1]} ${year}`;
}

export function dateISO(value: string): string {
  if (!value) return '—';
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return value;
  return `${day} ${MONTHS_SHORT[month - 1]} ${year}`;
}

export function truncate(value: string, length = 90): string {
  if (!value) return '';
  return value.length > length ? `${value.slice(0, length - 1)}…` : value;
}

export function titleCase(value: string): string {
  return value
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .replace(/\bDan\b/g, 'dan')
    .replace(/\bDi\b/g, 'di');
}

export function safePercent(part: number, total: number): number {
  return total ? (part / total) * 100 : 0;
}
