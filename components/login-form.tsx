"use client";

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginWithCredentials, isBrowserAuthenticated } from '@/lib/auth-client';

export function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState('LFA Admin');
  const [password, setPassword] = useState('heslo');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');

    const ok = loginWithCredentials(username, password);

    if (!ok) {
      setError('Nesprávné uživatelské jméno nebo heslo');
      setLoading(false);
      return;
    }

    router.push('/planner');
  }

  if (isBrowserAuthenticated()) {
    router.replace('/planner');
    return null;
  }

  return (
    <form className="loginCard" onSubmit={handleSubmit}>
      <div>
        <span className="eyebrow">LFA ESG plánovač</span>
        <h1>Přihlášení</h1>
        <p className="muted">MVP přístup pro interní plánování. Použijte předpřipravené administrátorské údaje.</p>
      </div>

      <label className="field">
        <span>Uživatelské jméno</span>
        <input value={username} onChange={(event) => setUsername(event.target.value)} />
      </label>

      <label className="field">
        <span>Heslo</span>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </label>

      {error ? <div className="errorBox">{error}</div> : null}

      <button className="primaryButton" disabled={loading} type="submit">
        {loading ? 'Přihlašování…' : 'Vstoupit do plánovače'}
      </button>

      <div className="loginHint">
        <strong>Demo přihlášení pro MVP:</strong> LFA Admin / heslo
      </div>
    </form>
  );
}
