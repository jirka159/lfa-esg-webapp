import { cookies } from 'next/headers';

export const AUTH_COOKIE = 'lfa-esg-session';
export const MVP_USERNAME = 'LFA Admin';
export const MVP_PASSWORD = 'heslo';

export async function isAuthenticated() {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_COOKIE)?.value === 'authenticated';
}
