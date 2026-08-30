'use client';

import { useSyncExternalStore } from 'react';

const subscribeToTimeZone = () => () => undefined;
const getServerTimeZone = () => 'UTC';
const getBrowserTimeZone = () =>
  Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

function formatTimestamp(value: string, timeZone: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone,
  }).format(new Date(value));
}

function formatRelativeAge(checkedAt: string, now: number) {
  const minutes = Math.max(
    0,
    Math.floor((now - Date.parse(checkedAt)) / 60_000)
  );
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

export function MachineHealthTimestamp({
  checkedAt,
  firstCheckedAt,
  sampleCount,
  now,
}: {
  checkedAt: string;
  firstCheckedAt?: string;
  sampleCount?: number;
  now: number;
}) {
  const browserTimeZone = useSyncExternalStore(
    subscribeToTimeZone,
    getBrowserTimeZone,
    getServerTimeZone
  );
  return (
    <>
      <span
        className="opacity-45 tabular-nums"
        title={`${formatTimestamp(checkedAt, browserTimeZone)} · ${browserTimeZone}`}
        suppressHydrationWarning
      >
        Updated {formatRelativeAge(checkedAt, now)}
      </span>
      {sampleCount !== undefined && firstCheckedAt ? (
        <span className="sr-only">
          {sampleCount} Big Red snapshots · history began{' '}
          {formatTimestamp(firstCheckedAt, browserTimeZone)}
        </span>
      ) : null}
    </>
  );
}
