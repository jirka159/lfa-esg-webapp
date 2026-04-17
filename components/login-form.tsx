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
      setError('Wrong username or password');
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
        <span className="eyebrow">LFA ESG planner</span>
        <h1>Sign in</h1>
        <p className="muted">MVP access for internal planning. Use the predefined admin credentials.</p>
      </div>

      <label className="field">
        <span>Username</span>
        <input value={username} onChange={(event) => setUsername(event.target.value)} />
      </label>

      <label className="field">
        <span>Password</span>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </label>

      {error ? <div className="errorBox">{error}</div> : null}

      <button className="primaryButton" disabled={loading} type="submit">
        {loading ? 'Signing in…' : 'Enter planner'}
      </button>

      <div className="loginHint">
        <strong>MVP demo login:</strong> LFA Admin / heslo
      </div>
    </form>
  );
}
