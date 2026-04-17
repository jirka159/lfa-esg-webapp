"use client";

import { ReactNode, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { isBrowserAuthenticated } from '@/lib/auth-client';

type Props = {
  children: ReactNode;
};

export function AuthGuard({ children }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const ok = isBrowserAuthenticated();
    setAuthenticated(ok);
    setReady(true);

    if (!ok && pathname !== '/login') {
      router.replace('/login');
    }
  }, [pathname, router]);

  if (!ready) {
    return <main className="loginPage"><section className="loginCard"><p>Načítání…</p></section></main>;
  }

  if (!authenticated) {
    return null;
  }

  return <>{children}</>;
}
