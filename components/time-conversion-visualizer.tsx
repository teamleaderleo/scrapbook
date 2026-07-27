'use client';

import { useEffect, useState } from 'react';
import TimezoneSelector from './timezone-selector';
import CurrentTimeDisplay from './current-time-display';
import { isDSTActive } from '@/app/lib/dst-utils';
import {
  convertLocalTimeToZone,
  formatClockTime,
  formatClockTime12Hour,
  formatDayOffset,
  formatUtcOffset,
  normalizeTimeOfDay,
  type NormalizedTimeOfDay,
} from '@/lib/time-conversion';

const DAY_GRADIENT =
  'linear-gradient(90deg, #151720 0%, #252938 9%, #493f55 18%, #715767 28%, #9f6f68 38%, #bd916c 46%, #c9a574 50%, #bd916c 56%, #9f6f68 64%, #715767 73%, #493f55 82%, #252938 91%, #151720 100%)';

const TIME_PRESETS = [
  { label: 'Morning', minutes: 9 * 60 },
  { label: 'Noon', minutes: 12 * 60 },
  { label: 'Evening', minutes: 18 * 60 },
  { label: 'Late', minutes: 22 * 60 },
] as const;

function ComparisonCard({
  label,
  time,
  offsetMinutes,
  detail,
  prominent = false,
}: {
  label: string;
  time: NormalizedTimeOfDay;
  offsetMinutes: number;
  detail?: string;
  prominent?: boolean;
}) {
  return (
    <div
      className={`min-w-0 rounded-xl border border-border/65 bg-background/50 p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] ${prominent ? 'col-span-2 sm:col-span-1' : ''}`}
    >
      <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1.5 font-mono text-3xl font-semibold tabular-nums tracking-[-0.035em]">
        {formatClockTime(time.hours, time.minutes)}
      </p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
        <span className="font-mono tabular-nums">{formatClockTime12Hour(time.hours, time.minutes)}</span>
        <span aria-hidden="true"> · </span>
        <span className="font-mono tabular-nums">{formatUtcOffset(offsetMinutes)}</span>
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        {formatDayOffset(time.dayOffset)}
        {detail ? ` · ${detail}` : ''}
      </p>
    </div>
  );
}

export default function UTCTimeVisualizer() {
  const [localTime, setLocalTime] = useState(0);
  const [localOffsetMinutes, setLocalOffsetMinutes] = useState(0);
  const [useDST, setUseDST] = useState(false);

  useEffect(() => {
    const now = new Date();
    setLocalTime(now.getHours() * 60 + now.getMinutes());
    setLocalOffsetMinutes(-now.getTimezoneOffset());
    setUseDST(isDSTActive('us'));
  }, []);

  const local = normalizeTimeOfDay(localTime);
  const utc = convertLocalTimeToZone(localTime, localOffsetMinutes, 0);
  const easternOffsetMinutes = (useDST ? -4 : -5) * 60;
  const pacificOffsetMinutes = (useDST ? -7 : -8) * 60;
  const eastern = convertLocalTimeToZone(
    localTime,
    localOffsetMinutes,
    easternOffsetMinutes,
  );
  const pacific = convertLocalTimeToZone(
    localTime,
    localOffsetMinutes,
    pacificOffsetMinutes,
  );

  const localHours = local.hours;
  const timeOfDay =
    localHours < 6
      ? 'Night'
      : localHours < 12
        ? 'Morning'
        : localHours < 17
          ? 'Afternoon'
          : localHours < 21
            ? 'Evening'
            : 'Night';

  return (
    <div className="relative mx-auto flex min-h-[calc(100dvh-3rem)] w-full max-w-7xl items-start px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6">
      <div className="flex w-full min-w-0 flex-col gap-4 sm:gap-5">
        <CurrentTimeDisplay
          selectedMinutes={localTime}
          onSelectedTimeChange={setLocalTime}
        />

        <TimezoneSelector utcTotalMinutes={localTime - localOffsetMinutes} />

        <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(22rem,0.95fr)]">
          <section
            aria-labelledby="time-scrubber-heading"
            className="min-w-0 rounded-[1.25rem] border border-border/75 bg-card p-4 text-card-foreground shadow-[0_16px_38px_rgba(24,24,26,0.11)] sm:p-5 dark:shadow-[0_16px_38px_rgba(0,0,0,0.3)]"
          >
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.17em] text-muted-foreground">
                  Scrub through the day
                </p>
                <h2 id="time-scrubber-heading" className="mt-1 text-xl font-semibold tracking-tight">
                  Move every conversion together.
                </h2>
              </div>
              <span className="text-sm font-medium text-muted-foreground">{timeOfDay}</span>
            </div>

            <input
              id="time-of-day"
              type="range"
              min="0"
              max="1439"
              step="1"
              value={localTime}
              onChange={(event) => setLocalTime(Number.parseInt(event.target.value, 10))}
              aria-label="Selected local time scrubber"
              aria-valuetext={`${formatClockTime(local.hours, local.minutes)} ${timeOfDay}`}
              className="time-day-slider mt-5 h-14 w-full cursor-pointer rounded-full"
              style={{ background: DAY_GRADIENT }}
            />
            <div className="mt-2 flex justify-between font-mono text-[10px] tabular-nums text-muted-foreground">
              <span>00:00</span>
              <span>06:00</span>
              <span>12:00</span>
              <span>18:00</span>
              <span>23:59</span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2" aria-label="Time presets">
              {TIME_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setLocalTime(preset.minutes)}
                  className="rounded-lg border border-border/65 bg-background/50 px-3 py-2 text-sm font-medium text-muted-foreground transition-[background-color,color,transform] hover:-translate-y-px hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {preset.label}
                  <span className="ml-1.5 font-mono text-xs tabular-nums">
                    {formatClockTime(Math.floor(preset.minutes / 60), preset.minutes % 60)}
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section
            aria-labelledby="time-comparisons-heading"
            className="min-w-0 rounded-[1.25rem] border border-border/75 bg-card p-4 text-card-foreground shadow-[0_16px_38px_rgba(24,24,26,0.11)] sm:p-5 dark:shadow-[0_16px_38px_rgba(0,0,0,0.3)]"
          >
            <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.17em] text-muted-foreground">
              At a glance
            </p>
            <h2 id="time-comparisons-heading" className="mt-1 text-xl font-semibold tracking-tight">
              Common reference zones
            </h2>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <ComparisonCard
                label="Local"
                time={local}
                offsetMinutes={localOffsetMinutes}
                detail={timeOfDay}
                prominent
              />
              <ComparisonCard label="UTC" time={utc} offsetMinutes={0} />
              <ComparisonCard
                label="Eastern"
                time={eastern}
                offsetMinutes={easternOffsetMinutes}
              />
              <ComparisonCard
                label="Pacific"
                time={pacific}
                offsetMinutes={pacificOffsetMinutes}
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
