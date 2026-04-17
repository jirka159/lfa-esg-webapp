export const MVP_USERNAME = 'LFA Admin';
export const MVP_PASSWORD = 'heslo';
export const AUTH_STORAGE_KEY = 'lfa-esg-auth';

export function isBrowserAuthenticated() {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(AUTH_STORAGE_KEY) === 'authenticated';
}

export function loginWithCredentials(username: string, password: string) {
  const ok = username === MVP_USERNAME && password === MVP_PASSWORD;

  if (ok && typeof window !== 'undefined') {
    window.localStorage.setItem(AUTH_STORAGE_KEY, 'authenticated');
  }

  return ok;
}

export function logout() {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  }
}
