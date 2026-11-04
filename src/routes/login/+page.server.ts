import { fail, redirect } from '@sveltejs/kit';
import { verifyAccount } from '#lib/server/accounts';
import { createSession, sessionCookie } from '#lib/server/session';
import type { Actions, PageServerLoad } from './$types';

function safeRedirect(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/login')) {
    return '/perangkat-daerah';
  }
  return value;
}

export const load: PageServerLoad = ({ locals, url }) => {
  const target = safeRedirect(url.searchParams.get('redirect'));
  if (locals.user) redirect(303, target);
  return { redirectTo: target };
};

export const actions: Actions = {
  login: async ({ request, cookies, url }) => {
    const form = await request.formData();
    const username = String(form.get('username') ?? '').trim();
    const password = String(form.get('password') ?? '');
    const redirectTo = safeRedirect(
      String(form.get('redirect') ?? url.searchParams.get('redirect') ?? '')
    );

    if (!username || !password) {
      return fail(400, { username, redirectTo, error: 'Isi username dan kata sandi.' });
    }

    const account = verifyAccount(username, password);
    if (!account) {
      return fail(400, { username, redirectTo, error: 'Username atau kata sandi salah.' });
    }

    cookies.set(sessionCookie.name, createSession(account), sessionCookie.options);
    redirect(303, redirectTo);
  }
};
