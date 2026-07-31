'use client';

import { ActivityGrid, type ActivityGridDay } from '@/components/home/activity-grid';
import { ActivityScoreboard } from '@/components/home/activity-scoreboard';
import { GITHUB_ACTIVITY_CLIENT_REFRESH_SECONDS } from '@/lib/github-activity-policy';
import { useEffect, useRef, useState } from 'react';

const REFRESH_INTERVAL_MS = GITHUB_ACTIVITY_CLIENT_REFRESH_SECONDS * 1_000;
const REQUEST_TIMEOUT_MS = 10_000;
const MAX_FAILURE_BACKOFF_MS = 5 * 60_000;
const STORED_SNAPSHOT_KEY = 'scrapbook:github-activity:last-success:v1';
const MAX_STORED_SNAPSHOT_AGE_MS = 24 * 60 * 60_000;

type ActivitySource = 'github-graphql' | 'public-profile' | 'unavailable';
type SuccessfulActivitySource = Exclude<ActivitySource, 'unavailable'>;

type SuccessfulActivitySnapshot = {
  source: SuccessfulActivitySource;
  today: number;
  weekTotal: number;
  yearTotal: number | null;
  days: ActivityGridDay[];
  unit: string;
  generatedAt: string;
};

type UnavailableActivitySnapshot = {
  source: 'unavailable';
  today: null;
  weekTotal: null;
  yearTotal: null;
  days: [];
  unit: string;
  generatedAt: string;
};

type ActivitySnapshot = SuccessfulActivitySnapshot | UnavailableActivitySnapshot;
type StoredActivitySnapshot = SuccessfulActivitySnapshot;

type LiveActivityResponse = {
  source: SuccessfulActivitySource;
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isActivityGridDay(value: unknown): value is ActivityGridDay {
  return (
    isRecord(value) &&
    typeof value.date === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(value.date) &&
    isFiniteNumber(value.count) &&
    value.count >= 0
  );
}

function readStoredSnapshot(): StoredActivitySnapshot | null {
  try {
    const value = window.localStorage.getItem(STORED_SNAPSHOT_KEY);
    if (!value) return null;

    const parsed: unknown = JSON.parse(value);
    if (!isRecord(parsed)) return null;
    if (parsed.source !== 'github-graphql' && parsed.source !== 'public-profile') return null;
    if (!isFiniteNumber(parsed.today) || parsed.today < 0) return null;
    if (!isFiniteNumber(parsed.weekTotal) || parsed.weekTotal < 0) return null;
    if (parsed.yearTotal !== null && (!isFiniteNumber(parsed.yearTotal) || parsed.yearTotal < 0)) {
      return null;
    }
    if (!Array.isArray(parsed.days) || !parsed.days.every(isActivityGridDay)) return null;
    if (typeof parsed.generatedAt !== 'string') return null;
    const generatedAt = Date.parse(parsed.generatedAt);
    if (!Number.isFinite(generatedAt)) return null;
    if (generatedAt > Date.now() + 5 * 60_000) return null;
    if (Date.now() - generatedAt > MAX_STORED_SNAPSHOT_AGE_MS) return null;

    return {
      source: parsed.source,
      today: parsed.today,
      weekTotal: parsed.weekTotal,
      yearTotal: parsed.yearTotal,
      days: parsed.days,
      unit: 'contributions',
      generatedAt: parsed.generatedAt,
    };
  } catch {
    return null;
  }
}

function writeStoredSnapshot(snapshot: StoredActivitySnapshot) {
  try {
    window.localStorage.setItem(STORED_SNAPSHOT_KEY, JSON.stringify(snapshot));
  } catch {
    // Storage can be disabled or full. The live snapshot remains usable in memory.
  }
}

function ActivityUnavailableScoreboard({ updating }: { updating: boolean }) {
  return (
    <section
      className="flex h-full min-h-[15.5rem] flex-col overflow-hidden rounded-[1.25rem] border border-border/75 bg-card text-card-foreground shadow-[0_16px_38px_rgba(24,24,26,0.11)] dark:shadow-[0_16px_38px_rgba(0,0,0,0.3)] [@media(max-height:780px)]:min-h-[14.5rem]"
      data-activity-scoreboard
      data-activity-unavailable
    >
      <div className="border-b border-border/70 bg-muted/70 px-4 py-2.5 [@media(max-height:780px)]:py-2">
        <div className="flex items-center justify-between gap-3 font-mono text-[9px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          <span>Today</span>
          <span>{updating ? 'retrying' : 'GitHub'}</span>
        </div>
      </div>
      <div className="flex flex-1 flex-col justify-center gap-3 p-5 sm:p-6">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Activity unavailable
        </p>
        <p className="max-w-md text-lg font-semibold tracking-tight sm:text-xl">
          GitHub could not supply a contribution snapshot.
        </p>
        <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
          This page will retry while it remains open. A previous successful browser snapshot appears automatically when one exists.
        </p>
      </div>
    </section>
  );
}

export function ActivityDashboard({ initial }: { initial: ActivitySnapshot }) {
  const initialSnapshotAt = timestampOrNow(initial.generatedAt);
  const [activity, setActivity] = useState(initial);
  const [calendarGeneratedAt, setCalendarGeneratedAt] = useState(initial.generatedAt);
  const [restoredFromBrowser, setRestoredFromBrowser] = useState(false);
  const [updating, setUpdating] = useState(false);
  const inFlight = useRef<AbortController | null>(null);
  const newestSnapshotAt = useRef(initial.source === 'unavailable' ? 0 : initialSnapshotAt);
  const nextAllowedAt = useRef(
    initial.source === 'unavailable' ? Date.now() : initialSnapshotAt + REFRESH_INTERVAL_MS,
  );
  const consecutiveFailures = useRef(0);

  useEffect(() => {
    if (initial.source === 'unavailable') {
      const stored = readStoredSnapshot();
      if (!stored) return;

      newestSnapshotAt.current = timestampOrNow(stored.generatedAt);
      setActivity(stored);
      setRestoredFromBrowser(true);
      return;
    }

    writeStoredSnapshot(initial);
  }, [initial]);

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

        const nextSnapshot: StoredActivitySnapshot = {
          ...next,
          unit: 'contributions',
        };
        newestSnapshotAt.current = nextGeneratedAt;
        setActivity(nextSnapshot);
        setCalendarGeneratedAt(new Date().toISOString());
        setRestoredFromBrowser(false);
        writeStoredSnapshot(nextSnapshot);
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

  const successfulActivity =
    activity.source === 'unavailable' || activity.days.length === 0 ? null : activity;

  return (
    <div
      className="relative grid min-w-0 items-stretch gap-3.5 sm:gap-4"
      data-home-activity-dashboard
      data-home-activity-source={activity.source}
      data-home-activity-restored={restoredFromBrowser ? 'true' : 'false'}
      style={{
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 24rem), 1fr))',
      }}
    >
      <span className="sr-only" aria-live="polite">
        {updating ? 'Updating GitHub activity' : ''}
      </span>

      {restoredFromBrowser ? (
        <p
          className="col-span-full rounded-xl border border-border/65 bg-muted/45 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.13em] text-muted-foreground"
          data-home-activity-saved-snapshot
        >
          Showing the last successful browser snapshot while GitHub activity refreshes.
        </p>
      ) : null}

      {successfulActivity ? (
        <ActivityScoreboard
          today={successfulActivity.today}
          weekTotal={successfulActivity.weekTotal}
          yearTotal={successfulActivity.yearTotal}
          updating={updating}
        />
      ) : (
        <ActivityUnavailableScoreboard updating={updating} />
      )}

      <ActivityGrid
        days={successfulActivity?.days ?? []}
        unit={activity.unit}
        generatedAt={calendarGeneratedAt}
        unavailableMessage="GitHub activity is temporarily unavailable."
      />
    </div>
  );
}
