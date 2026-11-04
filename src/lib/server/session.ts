import { createHmac, timingSafeEqual } from 'node:crypto';
import { getAccount, type PublicAccount } from './accounts';

const COOKIE_NAME = 'sulbar_session';
const MAX_AGE = 60 * 60 * 8;
const SECRET = process.env.AUTH_SECRET ?? 'sulbar-dashboard-dev-secret-change-me';

interface SessionPayload {
  username: string;
  exp: number;
}

function sign(payload: string): string {
  return createHmac('sha256', SECRET).update(payload).digest('base64url');
}

function encode(payload: SessionPayload): string {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${data}.${sign(data)}`;
}

function decode(token: string): SessionPayload | null {
  const [data, signature] = token.split('.');
  if (!data || !signature) return null;
  const expected = Buffer.from(sign(data));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8')) as SessionPayload;
    if (!payload.username || !payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function createSession(account: PublicAccount): string {
  return encode({ username: account.username, exp: Date.now() + MAX_AGE * 1000 });
}

export function getUserFromToken(token: string | undefined): PublicAccount | null {
  if (!token) return null;
  const payload = decode(token);
  if (!payload) return null;
  return getAccount(payload.username);
}

export const sessionCookie = {
  name: COOKIE_NAME,
  options: {
    path: '/',
    httpOnly: true,
    sameSite: 'lax' as const,
    maxAge: MAX_AGE,
    secure: process.env.NODE_ENV === 'production'
  }
};
