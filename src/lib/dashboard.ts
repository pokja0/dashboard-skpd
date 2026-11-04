import { derived, get, writable } from 'svelte/store';
import {
  dataset,
  presentStatuses,
  statusOrder,
  units as baseUnits,
  type AttendanceStatus,
  type DashboardUnit,
  type Dataset,
  type DestinationCount,
  type MonthPoint,
  type RankInfo
} from './data';
import { MONTHS_LONG, MONTHS_SHORT } from './format';

export interface Range {
  from: string;
  to: string;
}

export const DATA_MIN = dataset.meta.periodStart;
export const DATA_MAX = dataset.meta.periodEnd;
export const RANGE_STORAGE_KEY = 'dashboard-range-v3';

export const CURRENT_MONTH = DATA_MAX.slice(0, 7);
export const DEFAULT_MONTH = CURRENT_MONTH;

export function rangeForMonth(month: string): Range {
  const [year, monthNumber] = month.split('-').map(Number);
  const lastDay = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  return {
    from: clampDate(`${month}-01`),
    to: clampDate(`${month}-${String(lastDay).padStart(2, '0')}`)
  };
}

export function monthForRange(value: Range): string | null {
  for (const month of dataset.meta.months) {
    const bounds = rangeForMonth(month);
    if (bounds.from === value.from && bounds.to === value.to) return month;
  }
  return null;
}

export const defaultRange: Range = rangeForMonth(DEFAULT_MONTH);
export const fullRange: Range = { from: DATA_MIN, to: DATA_MAX };

export const range = writable<Range>({ ...defaultRange });

export const monthOptions = [...dataset.meta.months].reverse().map((month) => {
  const index = Number(month.slice(5, 7)) - 1;
  const label = `${MONTHS_LONG[index] ?? month} ${month.slice(0, 4)}`;
  return {
    value: month,
    label: month === CURRENT_MONTH ? `${label} (berjalan)` : label
  };
});

function persistRange(value: Range) {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(RANGE_STORAGE_KEY, JSON.stringify(value));
  } catch {
    // storage may be unavailable
  }
}

function applyRange(value: Range) {
  range.set(value);
  persistRange(value);
}

function parseISO(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function clampDate(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return DATA_MIN;
  if (value < DATA_MIN) return DATA_MIN;
  if (value > DATA_MAX) return DATA_MAX;
  return value;
}

export function setRange(from: string, to: string) {
  const f = clampDate(from);
  const t = clampDate(to);
  applyRange(f > t ? { from: f, to: f } : { from: f, to: t });
}

export function setFrom(value: string) {
  const current = get(range);
  const f = clampDate(value);
  applyRange({ from: f, to: f > current.to ? f : current.to });
}

export function setTo(value: string) {
  const current = get(range);
  const t = clampDate(value);
  applyRange({ from: t < current.from ? t : current.from, to: t });
}

export function resetRange() {
  applyRange({ ...defaultRange });
}

export function setFullRange() {
  applyRange({ ...fullRange });
}

export function setMonth(month: string) {
  if (!/^\d{4}-\d{2}$/.test(month)) return;
  applyRange(rangeForMonth(month));
}

function inRange(date: string, from: string, to: string): boolean {
  return !!date && date >= from && date <= to;
}

function percent(part: number, total: number): number {
  return total ? Math.round((part / total) * 1000) / 10 : 0;
}

export function formatRange(from: string, to: string): string {
  const f = parseISO(from);
  const t = parseISO(to);
  const sameYear = f.getUTCFullYear() === t.getUTCFullYear();
  if (from === to) {
    return `${f.getUTCDate()} ${MONTHS_SHORT[f.getUTCMonth()]} ${f.getUTCFullYear()}`;
  }

  const lastDay = new Date(Date.UTC(f.getUTCFullYear(), f.getUTCMonth() + 1, 0)).getUTCDate();
  const fullMonth =
    f.getUTCFullYear() === t.getUTCFullYear() &&
    f.getUTCMonth() === t.getUTCMonth() &&
    f.getUTCDate() === 1 &&
    t.getUTCDate() === lastDay;

  if (fullMonth) {
    return `${MONTHS_LONG[f.getUTCMonth()]} ${f.getUTCFullYear()}`;
  }

  return `${f.getUTCDate()} ${MONTHS_SHORT[f.getUTCMonth()]}${sameYear ? '' : ` ${f.getUTCFullYear()}`}–${t.getUTCDate()} ${MONTHS_SHORT[t.getUTCMonth()]} ${t.getUTCFullYear()}`;
}

export function daysInRange(from: string, to: string): number {
  const diff = parseISO(to).getTime() - parseISO(from).getTime();
  return Math.round(diff / 86_400_000) + 1;
}

export const availableLabel = formatRange(DATA_MIN, DATA_MAX);

export type DashboardMeta = Dataset['meta'] & {
  from: string;
  to: string;
  days: number;
  availableFrom: string;
  availableTo: string;
};

export interface Dashboard {
  meta: DashboardMeta;
  summary: Dataset['summary'];
  monthly: Dataset['monthly'];
  units: DashboardUnit[];
  insights: Dataset['insights'];
  destinations: DestinationCount[];
}

function rankBy(
  entries: Array<{ id: string; value: number }>
): Map<string, RankInfo> {
  const sorted = [...entries].sort((a, b) => b.value - a.value || a.id.localeCompare(b.id));
  const result = new Map<string, RankInfo>();
  let lastValue: number | null = null;
  let lastRank = 0;

  sorted.forEach((entry, index) => {
    if (entry.value !== lastValue) {
      lastRank = index + 1;
      lastValue = entry.value;
    }
    result.set(entry.id, { rank: lastRank, of: sorted.length });
  });

  return result;
}

function emptyStatuses(): Record<AttendanceStatus, number> {
  return Object.fromEntries(statusOrder.map((status) => [status, 0])) as Record<
    AttendanceStatus,
    number
  >;
}

function topDestinations(
  records: Array<{ dest: string }>,
  limit = 12
): DestinationCount[] {
  const counts = new Map<string, number>();
  records.forEach((record) => {
    const name = record.dest || 'Tidak dicatat';
    counts.set(name, (counts.get(name) ?? 0) + 1);
  });
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, limit);
}

export function buildDashboard(from: string, to: string): Dashboard {
  const safeFrom = clampDate(from);
  const safeTo = clampDate(to);
  const months = dataset.meta.months
    .map((month, index) => ({ month, label: dataset.meta.monthLabels[index] }))
    .filter(({ month }) => month >= safeFrom.slice(0, 7) && month <= safeTo.slice(0, 7));

  const globalMeetingsByMonth = new Map<string, Set<number>>();
  months.forEach(({ month }) => globalMeetingsByMonth.set(month, new Set()));
  const allAttendance: Array<{ d: string; status: AttendanceStatus; m: number }> = [];
  const allDispositions: Array<{ d: string; status: string }> = [];
  const allTravel: Array<{ d: string; days: number; kind: string; dest: string }> = [];

  const units = baseUnits.map((base) => {
    const attendance = base.records.attendance
      .filter((record) => inRange(record.d, safeFrom, safeTo))
      .sort((a, b) => b.d.localeCompare(a.d));
    const dispositions = base.records.dispositions
      .filter((record) => inRange(record.d, safeFrom, safeTo))
      .sort((a, b) => b.d.localeCompare(a.d));
    const travel = base.records.travel
      .filter((record) => inRange(record.d, safeFrom, safeTo))
      .sort((a, b) => b.d.localeCompare(a.d));

    allAttendance.push(...attendance);
    allDispositions.push(...dispositions);
    allTravel.push(...travel);

    const statuses = emptyStatuses();
    attendance.forEach((record) => {
      statuses[record.status] += 1;
    });

    const present = presentStatuses.reduce((sum, status) => sum + statuses[status], 0);
    const attTotal = attendance.length;
    const dispDone = dispositions.filter((record) => record.status === 'Selesai').length;
    const dispTotal = dispositions.length;
    const travelDays = travel.reduce((sum, record) => sum + record.days, 0);
    const outside = travel.filter((record) => record.kind === 'Luar Daerah').length;
    const inside = travel.length - outside;
    const attPct = percent(present, attTotal);
    const dispPct = dispTotal ? percent(dispDone, dispTotal) : null;
    // Komponen yang tidak memiliki catatan dianggap 100% agar nilai R&P tetap ada.
    const rewardAttendancePct = attTotal ? attPct : 100;
    const rewardDispositionPct = dispTotal ? (dispPct ?? 100) : 100;
    const reward =
      Math.round(
        (((rewardAttendancePct + rewardDispositionPct) / 2) * 30 / 100) * 10
      ) / 10;

    const monthly = {
      attendance: months.map(({ month }) => {
        const records = attendance.filter((record) => record.d.slice(0, 7) === month);
        return {
          month,
          total: records.length,
          present: records.filter((record) => presentStatuses.includes(record.status)).length,
          meetings: new Set(records.map((record) => record.m)).size
        } satisfies MonthPoint;
      }),
      disposition: months.map(({ month }) => {
        const records = dispositions.filter((record) => record.d.slice(0, 7) === month);
        const done = records.filter((record) => record.status === 'Selesai').length;
        return {
          month,
          total: records.length,
          done,
          pending: records.length - done
        } satisfies MonthPoint;
      }),
      travel: months.map(({ month }) => {
        const records = travel.filter((record) => record.d.slice(0, 7) === month);
        const out = records.filter((record) => record.kind === 'Luar Daerah').length;
        return {
          month,
          total: records.length,
          days: records.reduce((sum, record) => sum + record.days, 0),
          inside: records.length - out,
          outside: out
        } satisfies MonthPoint;
      })
    };

    return {
      ...base,
      attendance: {
        total: attTotal,
        present,
        pct: attPct,
        statuses
      },
      disposition: {
        total: dispTotal,
        done: dispDone,
        pending: dispTotal - dispDone,
        pct: dispPct
      },
      reward,
      rewardAttendancePct,
      rewardDispositionPct,
      travel: {
        total: travel.length,
        days: travelDays,
        inside,
        outside,
        outsidePct: percent(outside, travel.length),
        avgDays: travel.length ? Math.round((travelDays / travel.length) * 10) / 10 : 0
      },
      monthly,
      records: { attendance, dispositions, travel },
      destinations: topDestinations(travel, 100)
    } satisfies DashboardUnit;
  });

  const attEntries = units
    .filter((unit) => unit.attendance.total > 0)
    .map((unit) => ({ id: unit.id, value: unit.attendance.pct }));
  const dispEntries = units
    .filter((unit) => unit.disposition.total > 0)
    .map((unit) => ({ id: unit.id, value: unit.disposition.pct ?? 0 }));
  const travelEntries = units
    .filter((unit) => unit.travel.total > 0)
    .map((unit) => ({ id: unit.id, value: unit.travel.total }));

  const rewardEntries = units.map((unit) => ({ id: unit.id, value: unit.reward }));

  const attRank = rankBy(attEntries);
  const dispRank = rankBy(dispEntries);
  const travelRank = rankBy(travelEntries);
  const rewardRank = rankBy(rewardEntries);

  units.forEach((unit) => {
    unit.rank = {
      attendance: attRank.get(unit.id) ?? { rank: 0, of: attEntries.length },
      disposition: dispRank.get(unit.id) ?? { rank: 0, of: dispEntries.length },
      travel: travelRank.get(unit.id) ?? { rank: 0, of: travelEntries.length },
      reward: rewardRank.get(unit.id) ?? { rank: 0, of: rewardEntries.length }
    };
  });

  const statuses = emptyStatuses();
  allAttendance.forEach((record) => {
    statuses[record.status] += 1;
  });
  const present = presentStatuses.reduce((sum, status) => sum + statuses[status], 0);
  const attendanceTotal = allAttendance.length;
  const uniqueMeetings = new Set(allAttendance.map((record) => record.m)).size;

  const done = allDispositions.filter((record) => record.status === 'Selesai').length;
  const dispositionTotal = allDispositions.length;
  const travelDays = allTravel.reduce((sum, record) => sum + record.days, 0);
  const outside = allTravel.filter((record) => record.kind === 'Luar Daerah').length;
  const inside = allTravel.length - outside;

  allAttendance.forEach((record) => {
    const month = record.d.slice(0, 7);
    const set = globalMeetingsByMonth.get(month);
    if (set) set.add(record.m);
  });

  const monthly = {
    attendance: months.map(({ month }) => {
      const records = allAttendance.filter((record) => record.d.slice(0, 7) === month);
      return {
        month,
        meetings: globalMeetingsByMonth.get(month)?.size ?? 0,
        total: records.length,
        records: records.length,
        present: records.filter((record) => presentStatuses.includes(record.status)).length
      } satisfies MonthPoint;
    }),
    disposition: months.map(({ month }) => {
      const records = allDispositions.filter((record) => record.d.slice(0, 7) === month);
      const monthDone = records.filter((record) => record.status === 'Selesai').length;
      return {
        month,
        total: records.length,
        done: monthDone,
        pending: records.length - monthDone
      } satisfies MonthPoint;
    }),
    travel: months.map(({ month }) => {
      const records = allTravel.filter((record) => record.d.slice(0, 7) === month);
      const monthOutside = records.filter((record) => record.kind === 'Luar Daerah').length;
      return {
        month,
        total: records.length,
        days: records.reduce((sum, record) => sum + record.days, 0),
        inside: records.length - monthOutside,
        outside: monthOutside
      } satisfies MonthPoint;
    })
  };

  const pendingUnits = units.filter((unit) => unit.disposition.pending > 0);
  const lowAttendance = [...units]
    .filter((unit) => unit.attendance.total > 0)
    .sort((a, b) => a.attendance.pct - b.attendance.pct || a.short.localeCompare(b.short))
    .slice(0, 5);
  const topAttendance = [...units]
    .filter((unit) => unit.attendance.total > 0)
    .sort((a, b) => b.attendance.present - a.attendance.present || a.short.localeCompare(b.short))
    .slice(0, 5);
  const pendingTop = [...pendingUnits]
    .sort((a, b) => b.disposition.pending - a.disposition.pending || a.short.localeCompare(b.short))
    .slice(0, 5);
  const destinations = topDestinations(allTravel, 8);

  return {
    meta: {
      ...dataset.meta,
      from: safeFrom,
      to: safeTo,
      days: daysInRange(safeFrom, safeTo),
      availableFrom: DATA_MIN,
      availableTo: DATA_MAX,
      periodLabel: formatRange(safeFrom, safeTo),
      meetingCount: uniqueMeetings
    },
    summary: {
      attendance: {
        total: attendanceTotal,
        present,
        pct: percent(present, attendanceTotal),
        meetings: uniqueMeetings,
        statuses
      },
      disposition: {
        total: dispositionTotal,
        done,
        pending: dispositionTotal - done,
        pct: percent(done, dispositionTotal),
        units: units.filter((unit) => unit.disposition.total > 0).length,
        pendingUnits: pendingUnits.length
      },
      travel: {
        total: allTravel.length,
        days: travelDays,
        inside,
        outside,
        outsidePct: percent(outside, allTravel.length),
        avgDays: allTravel.length ? Math.round((travelDays / allTravel.length) * 10) / 10 : 0
      }
    },
    monthly,
    units,
    insights: {
      pendingTop: pendingTop.map((unit) => ({
        id: unit.id,
        short: unit.short,
        pending: unit.disposition.pending,
        total: unit.disposition.total,
        pct: unit.disposition.pct
      })),
      lowAttendance: lowAttendance.map((unit) => ({
        id: unit.id,
        short: unit.short,
        pct: unit.attendance.pct,
        present: unit.attendance.present,
        total: unit.attendance.total
      })),
      topAttendance: topAttendance.map((unit) => ({
        id: unit.id,
        short: unit.short,
        present: unit.attendance.present,
        total: unit.attendance.total,
        pct: unit.attendance.pct
      })),
      topSenders: [],
      topDestinations: destinations
    },
    destinations
  };
}

export const dashboard = derived(range, ($range) => buildDashboard($range.from, $range.to));
