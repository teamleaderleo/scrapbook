'use client';

import { ActivityGrid, type ActivityGridDay } from '@/components/home/activity-grid';
import { ActivityScoreboard } from '@/components/home/activity-scoreboard';
import { useEffect, useRef, useState } from 'react';

type ActivitySnapshot = {
  today: number;
  weekTotal: number;
  yearTotal: number | null;
  days: ActivityGridDay[];
  unit: string;
};

type LiveActivityResponse = {
  today: number;
  weekTotal: number;
  yearTotal: number;
  days: ActivityGridDay[];
};

export function ActivityDashboard({ initial }: { initial: ActivitySnapshot }) {
  const [activity, setActivity] = useState(initial);
  const [updating, setUpdating] = useState(false);
  const inFlight = useRef<AbortController | null>(null);

  useEffect(() => {
    let mounted = true;

    const refresh = async () => {
      if (document.visibilityState !== 'visible' || inFlight.current) return;

      const controller = new AbortController();
      inFlight.current = controller;
      setUpdating(true);

      try {
        const response = await fetch('/api/github-activity', {
          cache: 'no-store',
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`GitHub activity returned ${response.status}`);

        const next = (await response.json()) as LiveActivityResponse;
        if (!mounted) return;
        setActivity({ ...next, unit: 'contributions' });
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        console.error('Unable to update GitHub activity', error);
      } finally {
        if (inFlight.current === controller) inFlight.current = null;
        if (mounted) setUpdating(false);
      }
    };

    const initialRefresh = window.setTimeout(() => void refresh(), 2_500);
    const interval = window.setInterval(() => void refresh(), 75_000);
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') void refresh();
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      mounted = false;
      window.clearTimeout(initialRefresh);
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      inFlight.current?.abort();
    };
  }, []);

  return (
    <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
      <div className="flex h-4 items-center justify-end" aria-live="polite">
        {updating ? (
          <span className="flex items-center gap-1.5 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-black/50 dark:text-white/50">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current motion-reduce:animate-none" />
            Updating activity
          </span>
        ) : null}
      </div>
      <ActivityScoreboard
        today={activity.today}
        weekTotal={activity.weekTotal}
        yearTotal={activity.yearTotal}
      />
      <ActivityGrid days={activity.days} unit={activity.unit} />
    </div>
  );
}
