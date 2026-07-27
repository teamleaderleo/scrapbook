import { useEffect, useState } from 'react';
import { detectCurrentTimezoneDST } from '@/app/lib/dst-utils';
import {
  formatClockTime,
  formatUtcOffset,
  parseTimeInput,
} from '@/lib/time-conversion';

interface CurrentTimeDisplayProps {
  selectedMinutes: number;
  onSelectedTimeChange: (minutes: number) => void;
}

export default function CurrentTimeDisplay({
  selectedMinutes,
  onSelectedTimeChange,
}: CurrentTimeDisplayProps) {
  const [currentTime, setCurrentTime] = useState(0);
  const [userTimezone, setUserTimezone] = useState('');
  const [utcOffsetMinutes, setUtcOffsetMinutes] = useState(0);
  const [isDST, setIsDST] = useState(false);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;

    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.getHours() * 60 + now.getMinutes());
      setUserTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
      setUtcOffsetMinutes(-now.getTimezoneOffset());
      setIsDST(detectCurrentTimezoneDST().isDSTActive);
    };

    updateTime();

    const now = new Date();
    const msUntilNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
    const initialTimeout = setTimeout(() => {
      updateTime();
      interval = setInterval(updateTime, 60_000);
    }, msUntilNextMinute);

    return () => {
      clearTimeout(initialTimeout);
      if (interval) clearInterval(interval);
    };
  }, []);

  const selectedHours = Math.floor(selectedMinutes / 60);
  const selectedMinute = selectedMinutes % 60;
  const selectedValue = formatClockTime(selectedHours, selectedMinute);

  return (
    <section
      aria-labelledby="time-converter-heading"
      className="grid min-w-0 gap-5 rounded-[1.25rem] border border-border/75 bg-card p-4 text-card-foreground shadow-[0_16px_38px_rgba(24,24,26,0.11)] sm:p-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(21rem,1.1fr)] lg:items-center lg:p-6 dark:shadow-[0_16px_38px_rgba(0,0,0,0.3)]"
      data-time-editor
    >
      <div className="min-w-0">
        <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.17em] text-muted-foreground">
          Time converter
        </p>
        <h1
          id="time-converter-heading"
          className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl"
        >
          Choose the time you want to compare.
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          This selected local time drives every conversion below. The live clock is available as a
          reset, rather than competing with the time you are editing.
        </p>
      </div>

      <div className="min-w-0 rounded-2xl border border-border/70 bg-background/55 p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.24)] sm:p-4">
        <label htmlFor="selected-local-time" className="text-sm font-medium text-foreground">
          Selected local time
        </label>
        <div className="mt-2 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-stretch">
          <input
            id="selected-local-time"
            data-selected-local-time
            type="time"
            step="60"
            value={selectedValue}
            onChange={(event) => {
              const next = parseTimeInput(event.target.value);
              if (next !== null) onSelectedTimeChange(next);
            }}
            className="h-16 min-w-0 flex-1 rounded-xl border border-border bg-card px-4 font-mono text-[clamp(2rem,10vw,3.35rem)] font-semibold leading-none tabular-nums tracking-[-0.045em] text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_8px_20px_rgba(20,20,24,0.08)] outline-none transition-[border-color,box-shadow] focus:border-ring focus:ring-2 focus:ring-ring/30"
            aria-label="Selected local time"
          />
          <button
            type="button"
            onClick={() => onSelectedTimeChange(currentTime)}
            className="flex min-h-12 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-card px-4 text-sm font-medium text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.24)] transition-[background-color,transform] hover:-translate-y-px hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-h-16 sm:flex-col sm:items-start sm:px-3.5"
            title="Set the selected time to the current local time"
          >
            <span className="text-xs text-muted-foreground">Use now</span>
            <span className="font-mono text-base font-semibold tabular-nums">
              {formatClockTime(Math.floor(currentTime / 60), currentTime % 60)}
            </span>
          </button>
        </div>

        <p className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{userTimezone || 'Local zone'}</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono tabular-nums">{formatUtcOffset(utcOffsetMinutes)}</span>
          {isDST ? (
            <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-semibold text-amber-700 dark:text-amber-400">
              DST
            </span>
          ) : null}
        </p>
      </div>
    </section>
  );
}
