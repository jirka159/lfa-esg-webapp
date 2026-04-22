"use client";

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isBrowserAuthenticated, loginWithCredentials } from '@/lib/auth-client';
import { LFA_USERS } from '@/lib/lfa-users';

export function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState('JSE');
  const [password, setPassword] = useState('heslo');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');

    const result = await loginWithCredentials(username, password);

    if (!result.ok) {
      setError(result.error ?? 'Nesprávné uživatelské jméno nebo heslo.');
      setLoading(false);
      return;
    }

    router.push('/planner');
    router.refresh();
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
        <p className="muted">Přihlaste se do svého týmového planneru. Admin účet může z UI přepínat aktivní tým.</p>
      </div>

      <label className="field">
        <span>Uživatelské jméno</span>
        <input value={username} onChange={(event) => setUsername(event.target.value.toUpperCase())} />
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
        {loading ? 'Přihlašování…' : 'Vstoupit do planneru'}
      </button>

      <div className="loginHint">
        <strong>Dostupné účty:</strong>
        <ul className="loginAccountsList">
          {LFA_USERS.map((user) => (
            <li key={user.id}>
              <code>{user.username}</code> — {user.displayName} · {user.teamName}
              {user.isAdmin ? ' · admin' : ''}
            </li>
          ))}
        </ul>
        <div>Heslo pro všechny účty: <code>heslo</code></div>
      </div>
    </form>
  );
}
