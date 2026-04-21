export const AUTH_STORAGE_KEY = 'lfa-esg-auth';

export type AuthenticatedUser = {
  id: string;
  username: string;
  teamName: string;
  clubId: string;
  planId: string;
};

export function getStoredAuthMarker() {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(AUTH_STORAGE_KEY);
}

export function isBrowserAuthenticated() {
  return getStoredAuthMarker() === 'authenticated';
}

export async function loginWithCredentials(username: string, password: string) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  const json = (await response.json().catch(() => ({}))) as { error?: string; user?: AuthenticatedUser };

  if (!response.ok || !json.user) {
    return {
      ok: false,
      error: json.error || 'Nesprávné uživatelské jméno nebo heslo.'
    };
  }

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(AUTH_STORAGE_KEY, 'authenticated');
  }

  return {
    ok: true,
    user: json.user
  };
}

export async function fetchCurrentSession() {
  const response = await fetch('/api/auth/session', {
    method: 'GET',
    cache: 'no-store'
  });

  const json = (await response.json().catch(() => ({}))) as { authenticated?: boolean; user?: AuthenticatedUser };

  return {
    authenticated: Boolean(response.ok && json.authenticated && json.user),
    user: json.user ?? null
  };
}

export async function logout() {
  await fetch('/api/auth/logout', { method: 'POST' }).catch(() => undefined);

  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  }
}
