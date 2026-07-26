'use client';

import { ActivityGrid, type ActivityGridDay } from '@/components/home/activity-grid';
import { ActivityScoreboard } from '@/components/home/activity-scoreboard';
import { useEffect, useRef, useState } from 'react';

const REFRESH_INTERVAL_MS = 60_000;

type ActivitySnapshot = {
  today: number;
  weekTotal: number;
  yearTotal: number | null;
  days: ActivityGridDay[];
  unit: string;
  generatedAt: string;
};

type LiveActivityResponse = {
  today: number;
  weekTotal: number;
  yearTotal: number;
  days: ActivityGridDay[];
  generatedAt: string;
};

function timestampOrNow(value: string) {
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : Date.now();
}

export function ActivityDashboard({ initial }: { initial: ActivitySnapshot }) {
  const [activity, setActivity] = useState(initial);
  const [updating, setUpdating] = useState(false);
  const inFlight = useRef<AbortController | null>(null);
  const lastSuccessAt = useRef(timestampOrNow(initial.generatedAt));

  useEffect(() => {
    let mounted = true;

    const refresh = async () => {
      if (document.visibilityState !== 'visible' || inFlight.current) return;
      if (Date.now() - lastSuccessAt.current < REFRESH_INTERVAL_MS - 1_000) return;

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
        lastSuccessAt.current = timestampOrNow(next.generatedAt);
        setActivity({ ...next, unit: 'contributions' });
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        console.error('Unable to update GitHub activity', error);
      } finally {
        if (inFlight.current === controller) inFlight.current = null;
        if (mounted) setUpdating(false);
      }
    };

    const age = Math.max(0, Date.now() - lastSuccessAt.current);
    const firstDelay = Math.max(3_000, REFRESH_INTERVAL_MS - age);
    const initialRefresh = window.setTimeout(() => void refresh(), firstDelay);
    const interval = window.setInterval(() => void refresh(), REFRESH_INTERVAL_MS);
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
    <div className="relative min-w-0">
      <div className="pointer-events-none absolute right-2 top-2 z-10 min-h-4" aria-live="polite">
        {updating ? (
          <span className="flex items-center gap-1.5 rounded-full border border-black/10 bg-[#f4f1ea] px-2 py-1 font-mono text-[8px] font-semibold uppercase tracking-[0.12em] text-black/50 shadow-sm dark:border-white/10 dark:bg-[#202126] dark:text-white/50">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current motion-reduce:animate-none" />
            Updating
          </span>
        ) : null}
      </div>

      <div className="grid min-w-0 items-stretch gap-3 lg:grid-cols-[minmax(19rem,0.9fr)_minmax(20rem,1.1fr)]">
        <ActivityScoreboard
          today={activity.today}
          weekTotal={activity.weekTotal}
          yearTotal={activity.yearTotal}
        />
        <ActivityGrid days={activity.days} unit={activity.unit} />
      </div>
    </div>
  );
}
