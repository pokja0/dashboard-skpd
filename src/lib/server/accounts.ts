import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync
} from 'node:fs';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import path from 'node:path';

export type Role = 'superadmin' | 'user';

export interface Account {
  username: string;
  role: Role;
  salt: string;
  hash: string;
  createdAt: string;
}

export interface PublicAccount {
  username: string;
  role: Role;
  createdAt: string;
}

const ACCOUNTS_FILE =
  process.env.ACCOUNTS_FILE ?? path.join(process.cwd(), 'data', 'accounts.json');
const IS_SERVERLESS = Boolean(process.env.VERCEL);
const ACCOUNTS_JSON = process.env.ACCOUNTS_JSON;

export const canCreateAccounts = !IS_SERVERLESS;

function hashPassword(password: string, salt: string): string {
  return scryptSync(password, salt, 64).toString('hex');
}

function writeAccounts(accounts: Account[]) {
  mkdirSync(path.dirname(ACCOUNTS_FILE), { recursive: true });
  writeFileSync(ACCOUNTS_FILE, JSON.stringify({ accounts }, null, 2), 'utf8');
}

function envAccount(): Account {
  const username = (process.env.SUPERADMIN_USERNAME ?? 'diskusidc6').trim();
  const password = process.env.SUPERADMIN_PASSWORD ?? 'Sulbar2026!';
  const salt = process.env.SUPERADMIN_SALT ?? 'sulbar-vercel-superadmin-v1';
  return {
    username,
    role: 'superadmin',
    salt,
    hash: hashPassword(password, salt),
    createdAt: process.env.SUPERADMIN_CREATED_AT ?? '2026-01-01T00:00:00.000Z'
  };
}

function seedAccounts(): Account[] {
  const account = envAccount();
  const localAccount: Account = {
    ...account,
    salt: randomBytes(16).toString('hex')
  };
  localAccount.hash = hashPassword(
    process.env.SUPERADMIN_PASSWORD ?? 'Sulbar2026!',
    localAccount.salt
  );
  writeAccounts([localAccount]);
  return [localAccount];
}

function readAccounts(): Account[] {
  if (ACCOUNTS_JSON) {
    try {
      const parsed = JSON.parse(ACCOUNTS_JSON) as Account[] | { accounts?: Account[] };
      const accounts = Array.isArray(parsed) ? parsed : parsed.accounts;
      if (Array.isArray(accounts) && accounts.length > 0) return accounts;
    } catch {
      // fall through to serverless/local storage
    }
  }

  if (IS_SERVERLESS) return [envAccount()];
  if (!existsSync(ACCOUNTS_FILE)) return seedAccounts();
  try {
    const parsed = JSON.parse(readFileSync(ACCOUNTS_FILE, 'utf8')) as {
      accounts?: Account[];
    };
    if (!Array.isArray(parsed.accounts)) return seedAccounts();
    return parsed.accounts;
  } catch {
    return seedAccounts();
  }
}

export function listAccounts(): PublicAccount[] {
  return readAccounts()
    .map(({ username, role, createdAt }) => ({ username, role, createdAt }))
    .sort((a, b) => a.username.localeCompare(b.username));
}

export function verifyAccount(username: string, password: string): PublicAccount | null {
  const account = readAccounts().find(
    (item) => item.username.toLowerCase() === username.trim().toLowerCase()
  );
  if (!account) return null;

  const expected = Buffer.from(account.hash, 'hex');
  const actual = Buffer.from(hashPassword(password, account.salt), 'hex');
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;

  return { username: account.username, role: account.role, createdAt: account.createdAt };
}

export function getAccount(username: string): PublicAccount | null {
  const account = readAccounts().find(
    (item) => item.username.toLowerCase() === username.trim().toLowerCase()
  );
  return account
    ? { username: account.username, role: account.role, createdAt: account.createdAt }
    : null;
}

export function createAccount(
  username: string,
  password: string,
  role: Role = 'user'
): { ok: true; account: PublicAccount } | { ok: false; error: string } {
  if (!canCreateAccounts) {
    return {
      ok: false,
      error:
        'Pembuatan akun tidak tersedia di deployment Vercel. Gunakan environment variable atau database.'
    };
  }

  const name = username.trim();
  if (!/^[a-zA-Z0-9._-]{3,32}$/.test(name)) {
    return {
      ok: false,
      error: 'Username 3–32 karakter, hanya huruf, angka, titik, garis bawah, atau tanda hubung.'
    };
  }
  if (password.length < 8) {
    return { ok: false, error: 'Kata sandi minimal 8 karakter.' };
  }

  const accounts = readAccounts();
  if (accounts.some((item) => item.username.toLowerCase() === name.toLowerCase())) {
    return { ok: false, error: 'Username sudah digunakan.' };
  }

  const salt = randomBytes(16).toString('hex');
  const account: Account = {
    username: name,
    role,
    salt,
    hash: hashPassword(password, salt),
    createdAt: new Date().toISOString()
  };
  accounts.push(account);
  writeAccounts(accounts);

  return {
    ok: true,
    account: { username: account.username, role: account.role, createdAt: account.createdAt }
  };
}
