'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useTransition } from 'react';

const REFRESH_INTERVAL_MS = 60_000;

export function ProxyLiveRefresh() {
  const router = useRouter();
  const [, startTransition] = useTransition();

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState !== 'visible') return;
      startTransition(() => router.refresh());
    };

    const interval = window.setInterval(refresh, REFRESH_INTERVAL_MS);
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') refresh();
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [router]);

  return null;
}
