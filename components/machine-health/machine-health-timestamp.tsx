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
    timeZoneName: 'short',
  }).format(new Date(value));
}

export function MachineHealthTimestamp({
  checkedAt,
  sampleCount,
}: {
  checkedAt: string;
  sampleCount: number;
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
      <div
        className="border-current/15 inline-flex rounded-full border bg-black/5 p-0.5 dark:bg-white/5"
        aria-label="Snapshot time zone"
      >
        {(['local', 'utc'] as const).map(option => (
          <button
            key={option}
            type="button"
            aria-pressed={mode === option}
            onClick={() => setMode(option)}
            className={`rounded-full px-2.5 py-1 font-bold uppercase tracking-[0.12em] transition-colors ${
              mode === option
                ? 'bg-[#a53b34] text-white shadow-sm'
                : 'opacity-55 hover:opacity-90'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
      <p className="mt-2 font-semibold tabular-nums">
        {formatTimestamp(checkedAt, timeZone)}
      </p>
      <p className="opacity-55 mt-0.5">{zoneLabel}</p>
      <p className="opacity-55 mt-2 font-mono">
        {sampleCount} observations · 30d loaded
      </p>
    </div>
  );
}
