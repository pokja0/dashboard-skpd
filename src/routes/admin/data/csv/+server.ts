import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = () => {
  const file = process.env.REKAP_CSV ?? path.join(process.cwd(), 'data', 'rekap-tim-staf-sekda.csv');
  const csv = readFileSync(file);
  return new Response(csv, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': 'attachment; filename="rekap-tim-staf-sekda.csv"'
    }
  });
};
