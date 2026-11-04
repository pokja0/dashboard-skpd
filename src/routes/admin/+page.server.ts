import { fail } from '@sveltejs/kit';
import { canCreateAccounts, createAccount, listAccounts } from '#lib/server/accounts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => ({
  accounts: listAccounts(),
  canCreateAccounts
});

export const actions: Actions = {
  create: async ({ request }) => {
    const form = await request.formData();
    const username = String(form.get('username') ?? '').trim();
    const password = String(form.get('password') ?? '');

    const result = createAccount(username, password, 'user');
    if (!result.ok) {
      return fail(400, { username, error: result.error });
    }

    return {
      success: `Akun "${result.account.username}" berhasil dibuat.`,
      username: ''
    };
  }
};
