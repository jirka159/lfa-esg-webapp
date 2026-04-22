import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { canUserAccessTeam, getAccessibleUsers, getLfaUserById, type LFAUser } from '@/lib/lfa-users';

export const AUTH_COOKIE = 'lfa-esg-session';

type SessionPayload = {
  userId?: string;
  activeTeamUserId?: string;
};

export type AuthSessionContext = {
  user: LFAUser;
  activeTeam: LFAUser;
  availableTeams: LFAUser[];
};

function decodeSession(value: string | undefined) {
  if (!value) return null;

  try {
    const decoded = Buffer.from(value, 'base64url').toString('utf8');
    const parsed = JSON.parse(decoded) as SessionPayload;
    if (!parsed.userId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function createSessionValue(user: LFAUser, activeTeamUserId?: string) {
  const nextActiveTeamUserId = activeTeamUserId && canUserAccessTeam(user, activeTeamUserId) ? activeTeamUserId : user.id;
  return Buffer.from(JSON.stringify({ userId: user.id, activeTeamUserId: nextActiveTeamUserId }), 'utf8').toString('base64url');
}

export async function getAuthSessionContext(): Promise<AuthSessionContext | null> {
  const cookieStore = await cookies();
  const session = decodeSession(cookieStore.get(AUTH_COOKIE)?.value);
  if (!session?.userId) return null;

  const user = getLfaUserById(session.userId);
  if (!user) return null;

  const availableTeams = getAccessibleUsers(user);
  const activeTeam =
    (session.activeTeamUserId && canUserAccessTeam(user, session.activeTeamUserId)
      ? getLfaUserById(session.activeTeamUserId)
      : null) ?? user;

  return {
    user,
    activeTeam,
    availableTeams
  };
}

export async function getAuthenticatedUser() {
  return (await getAuthSessionContext())?.user ?? null;
}

export async function getActiveTeamUser() {
  return (await getAuthSessionContext())?.activeTeam ?? null;
}

export async function isAuthenticated() {
  return Boolean(await getAuthenticatedUser());
}

export async function requireAuthenticatedUser() {
  const user = await getAuthenticatedUser();
  if (!user) redirect('/login');
  return user;
}

export async function requireAuthSessionContext() {
  const session = await getAuthSessionContext();
  if (!session) redirect('/login');
  return session;
}
