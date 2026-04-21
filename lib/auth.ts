import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getLfaUserById, type LFAUser } from '@/lib/lfa-users';

export const AUTH_COOKIE = 'lfa-esg-session';

function decodeSession(value: string | undefined) {
  if (!value) return null;

  try {
    const decoded = Buffer.from(value, 'base64url').toString('utf8');
    const parsed = JSON.parse(decoded) as { userId?: string };
    if (!parsed.userId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function createSessionValue(user: LFAUser) {
  return Buffer.from(JSON.stringify({ userId: user.id }), 'utf8').toString('base64url');
}

export async function getAuthenticatedUser() {
  const cookieStore = await cookies();
  const session = decodeSession(cookieStore.get(AUTH_COOKIE)?.value);
  if (!session?.userId) return null;
  return getLfaUserById(session.userId);
}

export async function isAuthenticated() {
  return Boolean(await getAuthenticatedUser());
}

export async function requireAuthenticatedUser() {
  const user = await getAuthenticatedUser();
  if (!user) redirect('/login');
  return user;
}
