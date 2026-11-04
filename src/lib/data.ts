import raw from './data/rekap.json';

export type AttendanceStatus =
  | 'Hadir'
  | 'Dinas Luar'
  | 'Diwakili'
  | 'Sakit'
  | 'Izin'
  | 'Tanpa Keterangan';

export interface RankInfo {
  rank: number;
  of: number;
}

export interface AttendanceRecord {
  d: string;
  status: AttendanceStatus;
  m: number;
}

export interface DispositionRecord {
  d: string;
  sender: string;
  subject: string;
  due: string;
  status: string;
  progress: string;
}

export interface TravelRecord {
  d: string;
  end: string;
  days: number;
  kind: string;
  dest: string;
  subject: string;
}

export interface Meeting {
  d: string;
  title: string;
}

export interface UnitRecords {
  attendance: AttendanceRecord[];
  dispositions: DispositionRecord[];
  travel: TravelRecord[];
}

export interface DestinationCount {
  name: string;
  count: number;
}

export interface AuditDuplicate {
  row: number;
  keptRow: number;
  date?: string;
  target?: string;
  name?: string;
  unit?: string;
  subject?: string;
  status?: string;
}

export interface AuditDateFix {
  row: number;
  column: string;
  raw: string;
  fixed: string;
}

export interface AuditMissingName {
  row: number;
  name: string;
  unit: string;
  date: string;
  subject: string;
}

export interface AuditExcludedRow {
  row: number;
  date: string;
  target: string;
  subject: string;
}

export interface Audit {
  duplicates: {
    dispositions: AuditDuplicate[];
    travel: AuditDuplicate[];
  };
  dateFixes: AuditDateFix[];
  missingNames: AuditMissingName[];
  excludedDispositions: {
    count: number;
    byTarget: Array<{ target: string; count: number }>;
    rows: AuditExcludedRow[];
  };
  rawLabelCount: number;
  unitCount: number;
  attendanceRows: number;
  dispositionRows: number;
  travelRows: number;
}

export interface MonthPoint {
  month: string;
  total: number;
  present?: number;
  done?: number;
  pending?: number;
  days?: number;
  inside?: number;
  outside?: number;
  meetings?: number;
  records?: number;
  [key: string]: number | string | undefined;
}

export interface DispositionItem {
  date: string;
  sender: string;
  subject: string;
  due: string;
  status: string;
  progress: string;
  target: string;
}

export interface TravelItem {
  name: string;
  unit: string;
  kind: string;
  subject: string;
  destination: string;
  days: number;
  start: string;
  end: string;
}

export interface Unit {
  id: string;
  short: string;
  name: string;
  head: string;
  group: 'Sekretariat Daerah' | 'Badan' | 'Dinas' | 'Lembaga';
  reward?: number;
  attendance: {
    total: number;
    present: number;
    pct: number;
    statuses: Record<AttendanceStatus, number>;
  };
  disposition: {
    total: number;
    done: number;
    pending: number;
    pct: number | null;
  };
  travel: {
    total: number;
    days: number;
    inside: number;
    outside: number;
    outsidePct: number;
    avgDays: number;
  };
  rank: {
    attendance: RankInfo;
    disposition: RankInfo;
    travel: RankInfo;
    reward: RankInfo;
  };
  monthly: {
    attendance: MonthPoint[];
    disposition: MonthPoint[];
    travel: MonthPoint[];
  };
  records: UnitRecords;
  destinations?: DestinationCount[];
}

export interface DashboardUnit extends Unit {
  destinations: DestinationCount[];
  reward: number;
  rewardAttendancePct: number;
  rewardDispositionPct: number;
}

export interface Dataset {
  meta: {
    title: string;
    subtitle: string;
    periodLabel: string;
    periodStart: string;
    periodEnd: string;
    generatedAt: string;
    source: string;
    sourceUrl: string;
    months: string[];
    monthLabels: string[];
    unitCount: number;
    meetingCount: number;
  };
  summary: {
    attendance: {
      total: number;
      present: number;
      pct: number;
      meetings: number;
      statuses: Record<AttendanceStatus, number>;
    };
    disposition: {
      total: number;
      done: number;
      pending: number;
      pct: number;
      units: number;
      pendingUnits: number;
    };
    travel: {
      total: number;
      days: number;
      inside: number;
      outside: number;
      outsidePct: number;
      avgDays: number;
    };
  };
  monthly: {
    attendance: MonthPoint[];
    disposition: MonthPoint[];
    travel: MonthPoint[];
  };
  meetings: Meeting[];
  audit: Audit;
  units: Unit[];
  insights: {
    pendingTop: Array<{
      id: string;
      short: string;
      pending: number;
      total: number;
      pct: number | null;
    }>;
    lowAttendance: Array<{
      id: string;
      short: string;
      pct: number;
      present: number;
      total: number;
    }>;
    topAttendance: Array<{
      id: string;
      short: string;
      present: number;
      total: number;
      pct: number;
    }>;
    topSenders: Array<{ name: string; count: number }>;
    topDestinations: Array<{ name: string; count: number }>;
  };
}

export const dataset = raw as unknown as Dataset;
export const units = dataset.units;
export const meetings = dataset.meetings;
export const unitById = new Map(units.map((unit) => [unit.id, unit]));

export const groupOrder: Unit['group'][] = [
  'Sekretariat Daerah',
  'Badan',
  'Dinas',
  'Lembaga'
];

export const statusColors: Record<AttendanceStatus, string> = {
  Hadir: 'var(--primary)',
  'Dinas Luar': 'var(--travel)',
  Diwakili: 'var(--gold)',
  Sakit: 'var(--danger)',
  Izin: 'var(--muted-2)',
  'Tanpa Keterangan': 'var(--line-strong)'
};

export const statusOrder: AttendanceStatus[] = [
  'Hadir',
  'Dinas Luar',
  'Diwakili',
  'Sakit',
  'Izin',
  'Tanpa Keterangan'
];

/** Status yang dihitung sebagai kehadiran pada indikator utama. */
export const presentStatuses: AttendanceStatus[] = [
  'Hadir',
  'Diwakili',
  'Dinas Luar',
  'Sakit'
];

export const presentLabel = 'Hadir, Diwakili, Dinas Luar, dan Sakit';

export function getUnit(slug: string): Unit | undefined {
  return unitById.get(slug);
}

export function unitInitials(name: string): string {
  const cleaned = name
    .replace(/\b(Dr|Drs|Dra|Hj|H|Ir|Prof|drg|dr)\.?\s*/gi, '')
    .replace(/[^A-Za-z\s]/g, ' ')
    .trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
}

export function unitMonogram(short: string): string {
  const words = short
    .replace(/&/g, ' ')
    .replace(/[^A-Za-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  if (words.length >= 2) {
    return words
      .slice(0, 2)
      .map((word) => word[0])
      .join('')
      .toUpperCase();
  }
  return (words[0] ?? '?').slice(0, 3).toUpperCase();
}
