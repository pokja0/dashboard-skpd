import { error } from '@sveltejs/kit';
import { unitById } from '#lib/data';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => {
  const unit = unitById.get(params.slug);
  if (!unit) {
    error(404, 'Perangkat daerah tidak ditemukan');
  }
  return { unit };
};
