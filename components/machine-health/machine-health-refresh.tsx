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
    <div className="flex items-center justify-end gap-2 px-1 pb-2 text-xs">
      <span className="opacity-50">Hourly while open</span>
      <button
        type="button"
        onClick={refresh}
        disabled={isPending}
        className="min-h-8 border-black/15 bg-white/55 disabled:opacity-55 dark:border-white/15 dark:hover:bg-black/35 inline-flex items-center gap-1.5 rounded-full border px-3 font-bold transition-colors hover:bg-white/80 disabled:cursor-wait dark:bg-black/20"
      >
        <RefreshCw
          aria-hidden="true"
          className={`size-3.5 ${isPending ? 'animate-spin' : ''}`}
        />
        {isPending ? 'Refreshing' : 'Refresh'}
      </button>
    </div>
  );
}
