'use client';

import { ActivityGrid, type ActivityGridDay } from '@/components/home/activity-grid';
import { ActivityScoreboard } from '@/components/home/activity-scoreboard';
import { GITHUB_ACTIVITY_CLIENT_REFRESH_SECONDS } from '@/lib/github-activity-policy';
import { useEffect, useRef, useState } from 'react';

const REFRESH_INTERVAL_MS = GITHUB_ACTIVITY_CLIENT_REFRESH_SECONDS * 1_000;
const REQUEST_TIMEOUT_MS = 10_000;
const MAX_FAILURE_BACKOFF_MS = 5 * 60_000;

type ActivitySnapshot = {
  today: number;
  weekTotal: number;
  yearTotal: number | null;
  days: ActivityGridDay[];
  unit: string;
  generatedAt: string;
};

type LiveActivityResponse = {
  source: 'github-graphql' | 'public-profile';
  today: number;
  weekTotal: number;
  yearTotal: number | null;
  days: ActivityGridDay[];
  generatedAt: string;
};

function timestampOrNow(value: string) {
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : Date.now();
}

export function ActivityDashboard({ initial }: { initial: ActivitySnapshot }) {
  const initialSnapshotAt = timestampOrNow(initial.generatedAt);
  const [activity, setActivity] = useState(initial);
  const [updating, setUpdating] = useState(false);
  const inFlight = useRef<AbortController | null>(null);
  const newestSnapshotAt = useRef(initialSnapshotAt);
  const nextAllowedAt = useRef(initialSnapshotAt + REFRESH_INTERVAL_MS);
  const consecutiveFailures = useRef(0);

  useEffect(() => {
    let mounted = true;
    let timer: number | null = null;

    const refresh = async () => {
      if (document.visibilityState !== 'visible' || inFlight.current) return;
      if (Date.now() < nextAllowedAt.current) return;

      const controller = new AbortController();
      let timeoutExpired = false;
      const requestTimeout = window.setTimeout(() => {
        timeoutExpired = true;
        controller.abort();
      }, REQUEST_TIMEOUT_MS);
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

        consecutiveFailures.current = 0;
        nextAllowedAt.current = Date.now() + REFRESH_INTERVAL_MS;

        const nextGeneratedAt = timestampOrNow(next.generatedAt);
        if (nextGeneratedAt < newestSnapshotAt.current) return;

        newestSnapshotAt.current = nextGeneratedAt;
        setActivity({
          ...next,
          unit: 'contributions',
        });
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError' && !timeoutExpired) return;
        consecutiveFailures.current += 1;
        const backoff = Math.min(
          REFRESH_INTERVAL_MS * 2 ** (consecutiveFailures.current - 1),
          MAX_FAILURE_BACKOFF_MS,
        );
        nextAllowedAt.current = Date.now() + backoff;
        console.error('Unable to update GitHub activity', error);
      } finally {
        window.clearTimeout(requestTimeout);
        if (inFlight.current === controller) inFlight.current = null;
        if (mounted) setUpdating(false);
      }
    };

    const scheduleNext = (minimumDelay = 1_000) => {
      if (timer !== null) window.clearTimeout(timer);
      const freshnessDelay = Math.max(0, nextAllowedAt.current - Date.now());
      const delay =
        document.visibilityState === 'visible'
          ? Math.max(minimumDelay, freshnessDelay)
          : REFRESH_INTERVAL_MS;

      timer = window.setTimeout(async () => {
        await refresh();
        if (mounted) scheduleNext();
      }, delay);
    };

    const onVisibilityChange = () => {
      if (document.visibilityState !== 'visible') {
        scheduleNext();
        return;
      }

      void refresh().finally(() => {
        if (mounted) scheduleNext();
      });
    };

    scheduleNext(3_000);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      mounted = false;
      if (timer !== null) window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      inFlight.current?.abort();
    };
  }, []);

  return (
    <div
      className="relative grid min-w-0 items-stretch gap-3.5 sm:gap-4"
      data-home-activity-dashboard
      style={{
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 24rem), 1fr))',
      }}
    >
      <span className="sr-only" aria-live="polite">
        {updating ? 'Updating GitHub activity' : ''}
      </span>
      <ActivityScoreboard
        today={activity.today}
        weekTotal={activity.weekTotal}
        yearTotal={activity.yearTotal}
        updating={updating}
      />
      <ActivityGrid days={activity.days} unit={activity.unit} />
    </div>
  );
}
