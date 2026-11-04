import { error, redirect } from '@sveltejs/kit';
import type { Handle } from '@sveltejs/kit/hooks';
import { getUserFromToken, sessionCookie } from '#lib/server/session';

export const handle: Handle = async ({ event, resolve }) => {
  event.locals.user = getUserFromToken(event.cookies.get(sessionCookie.name));

  const path = event.url.pathname;

  if (path.startsWith('/perangkat-daerah') || path.startsWith('/admin')) {
    if (!event.locals.user) {
      const target = `${path}${event.url.search}`;
      throw redirect(303, `/login?redirect=${encodeURIComponent(target)}`);
    }
    if (path.startsWith('/admin') && event.locals.user.role !== 'superadmin') {
      throw error(403, 'Halaman ini hanya dapat diakses superadmin.');
    }
  }

  return resolve(event);
};
