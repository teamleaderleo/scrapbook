'use client';

import { RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useTransition } from 'react';

const REFRESH_INTERVAL_MS = 60 * 60_000;
const CHECK_INTERVAL_MS = 60_000;

export function MachineHealthRefresh() {
  const router = useRouter();
  const lastRefreshAt = useRef<number | null>(null);
  const [isPending, startTransition] = useTransition();

  const refresh = useCallback(() => {
    lastRefreshAt.current = Date.now();
    startTransition(() => router.refresh());
  }, [router]);

  useEffect(() => {
    lastRefreshAt.current = Date.now();
    const refreshIfDue = () => {
      if (
        document.visibilityState === 'visible' &&
        lastRefreshAt.current !== null &&
        Date.now() - lastRefreshAt.current >= REFRESH_INTERVAL_MS
      )
        refresh();
    };

    const interval = window.setInterval(refreshIfDue, CHECK_INTERVAL_MS);
    document.addEventListener('visibilitychange', refreshIfDue);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', refreshIfDue);
    };
  }, [refresh]);

  return (
    <button
      type="button"
      onClick={refresh}
      disabled={isPending}
      aria-label={isPending ? 'Refreshing Big Red' : 'Refresh Big Red'}
      title="Refresh"
      className="size-10 opacity-45 grid shrink-0 place-items-center transition-opacity hover:opacity-90 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-[#a53b34] disabled:cursor-wait disabled:opacity-30"
    >
      <RefreshCw
        aria-hidden="true"
        strokeWidth={1.7}
        className={`size-[1.1rem] ${isPending ? 'animate-spin' : ''}`}
      />
    </button>
  );
}
