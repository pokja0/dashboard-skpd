import { readFileSync } from 'node:fs';
import { parse } from 'csv-parse/sync';
import rawCsv from '../../../data/rekap-tim-staf-sekda.csv?raw';

export interface RawRow {
  row: number;
  cells: string[];
}

interface RawData {
  header: string[];
  rows: RawRow[];
}

let cache: RawData | null = null;

function csvText(): string {
  if (process.env.REKAP_CSV) {
    try {
      return readFileSync(process.env.REKAP_CSV, 'utf8');
    } catch {
      // fall back to the CSV bundled at build time
    }
  }
  return rawCsv;
}

export function getRawCsv(): string {
  return csvText();
}

export function getRawData(): RawData {
  if (cache) return cache;

  const parsed = parse(csvText(), {
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
