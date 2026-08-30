'use client';

import { useState, useSyncExternalStore } from 'react';

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
  firstCheckedAt: string;
  sampleCount: number;
  now: number;
}) {
  const browserTimeZone = useSyncExternalStore(
    subscribeToTimeZone,
    getBrowserTimeZone,
    getServerTimeZone
  );
  const [mode, setMode] = useState<'local' | 'utc'>('local');

  const timeZone = mode === 'utc' ? 'UTC' : browserTimeZone;
  const zoneLabel = mode === 'utc' ? 'UTC' : browserTimeZone;

  return (
    <div className="shrink-0 text-left text-xs sm:text-right">
      <p className="font-semibold tabular-nums">
        Updated {formatRelativeAge(checkedAt, now)}
      </p>
      <p className="mt-1 tabular-nums opacity-60">
        {formatTimestamp(checkedAt, timeZone)} · {zoneLabel}
      </p>
      <div
        className="mt-2 flex items-center gap-2 sm:justify-end"
        role="group"
        aria-label="Snapshot time zone"
      >
        {(['local', 'utc'] as const).map(option => (
          <button
            key={option}
            type="button"
            aria-pressed={mode === option}
            onClick={() => setMode(option)}
            className={`border-b px-0.5 py-1 font-bold uppercase tracking-[0.12em] transition-colors ${
              mode === option
                ? 'border-current opacity-90'
                : 'border-transparent opacity-40 hover:opacity-75'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
      <p className="opacity-55 mt-3 font-mono text-[0.68rem]">
        {sampleCount} Big Red snapshot{sampleCount === 1 ? '' : 's'} · history
        began {formatTimestamp(firstCheckedAt, timeZone)}
      </p>
    </div>
  );
}
