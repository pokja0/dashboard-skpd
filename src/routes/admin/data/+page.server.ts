import { getRawData } from '#lib/server/raw';
import type { PageServerLoad } from './$types';

const PAGE_SIZE = 50;

export const load: PageServerLoad = ({ url }) => {
  const q = (url.searchParams.get('q') ?? '').trim();
  const requested = Number(url.searchParams.get('page') ?? '1');
  const page = Number.isFinite(requested) ? Math.max(1, Math.floor(requested)) : 1;

  const raw = getRawData();
  const needle = q.toLowerCase();
  const filtered = needle
    ? raw.rows.filter((item) => item.cells.some((cell) => cell.toLowerCase().includes(needle)))
    : raw.rows;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const start = (current - 1) * PAGE_SIZE;

  return {
    header: raw.header,
    columns: raw.header.length,
    rows: filtered.slice(start, start + PAGE_SIZE),
    q,
    page: current,
    totalPages,
    total: filtered.length,
    pageSize: PAGE_SIZE
  };
};
