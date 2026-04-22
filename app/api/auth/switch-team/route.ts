import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AUTH_COOKIE, createSessionValue, getAuthSessionContext } from '@/lib/auth';
import { canUserAccessTeam } from '@/lib/lfa-users';

function serializeUser(user: NonNullable<Awaited<ReturnType<typeof getAuthSessionContext>>>['user']) {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    teamName: user.teamName,
    clubId: user.clubId,
    planId: user.planId,
    isAdmin: Boolean(user.isAdmin)
  };
}

export async function POST(request: Request) {
  const session = await getAuthSessionContext();
  if (!session) {
    return NextResponse.json({ error: 'Nejste přihlášeni.' }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as { teamUserId?: string } | null;
  const teamUserId = payload?.teamUserId?.trim()?.toUpperCase();

  if (!teamUserId) {
    return NextResponse.json({ error: 'Chybí cílový tým.' }, { status: 400 });
  }

  if (!canUserAccessTeam(session.user, teamUserId)) {
    return NextResponse.json({ error: 'Tento tým nemáte oprávnění otevřít.' }, { status: 403 });
  }

  const nextActiveTeam = session.availableTeams.find((team) => team.id === teamUserId);
  if (!nextActiveTeam) {
    return NextResponse.json({ error: 'Vybraný tým neexistuje.' }, { status: 404 });
  }

  const cookieStore = await cookies();
  cookieStore.set({
    name: AUTH_COOKIE,
    value: createSessionValue(session.user, nextActiveTeam.id),
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 14
  });

  return NextResponse.json({
    ok: true,
    activeTeam: serializeUser(nextActiveTeam),
    availableTeams: session.availableTeams.map(serializeUser)
  });
}
