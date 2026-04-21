import { NextResponse } from 'next/server';
import { AUTH_COOKIE, createSessionValue } from '@/lib/auth';
import { findLfaUser } from '@/lib/lfa-users';

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as { username?: string; password?: string } | null;
  const username = payload?.username?.trim() ?? '';
  const password = payload?.password ?? '';

  const user = findLfaUser(username, password);
  if (!user) {
    return NextResponse.json({ error: 'Nesprávné uživatelské jméno nebo heslo.' }, { status: 401 });
  }

  const response = NextResponse.json({
    ok: true,
    user: {
      id: user.id,
      username: user.username,
      teamName: user.teamName,
      clubId: user.clubId,
      planId: user.planId
    }
  });

  response.cookies.set({
    name: AUTH_COOKIE,
    value: createSessionValue(user),
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 14
  });

  return response;
}
