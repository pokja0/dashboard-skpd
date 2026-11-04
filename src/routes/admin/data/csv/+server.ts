import { getRawCsv } from '#lib/server/raw';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = () => {
  const csv = getRawCsv();
  return new Response(csv, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': 'attachment; filename="rekap-tim-staf-sekda.csv"'
    }
  });
};
