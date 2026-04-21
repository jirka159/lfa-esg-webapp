"use client";

import { ReactNode, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { fetchCurrentSession } from '@/lib/auth-client';

type Props = {
  children: ReactNode;
};

export function AuthGuard({ children }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    let active = true;

    async function validateSession() {
      const session = await fetchCurrentSession();
      if (!active) return;

      setAuthenticated(session.authenticated);
      setReady(true);

      if (!session.authenticated && pathname !== '/login') {
        router.replace('/login');
      }
    }

    void validateSession();

    return () => {
      active = false;
    };
  }, [pathname, router]);

  if (!ready) {
    return <main className="loginPage"><section className="loginCard"><p>Načítání…</p></section></main>;
  }

  if (!authenticated) {
    return null;
  }

  return <>{children}</>;
}
