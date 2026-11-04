import { readFileSync } from 'node:fs';
import path from 'node:path';
import { parse } from 'csv-parse/sync';

export interface RawRow {
  row: number;
  cells: string[];
}

interface RawData {
  header: string[];
  rows: RawRow[];
}

let cache: RawData | null = null;

export function getRawData(): RawData {
  if (cache) return cache;

  const file = process.env.REKAP_CSV ?? path.join(process.cwd(), 'data', 'rekap-tim-staf-sekda.csv');
  const parsed = parse(readFileSync(file, 'utf8'), {
    columns: false,
    skip_empty_lines: true,
    relax_column_count: true
  }) as string[][];

  const [header, ...rows] = parsed;
  cache = {
    header,
    rows: rows.map((cells, index) => ({ row: index + 2, cells }))
  };
  return cache;
}
