'use client';

import { useEffect, useState } from 'react';
import TimezoneSelector from './timezone-selector';
import CurrentTimeDisplay from './current-time-display';
import { isDSTActive } from '@/app/lib/dst-utils';

const DAY_GRADIENT =
  'linear-gradient(90deg, #151720 0%, #252938 9%, #493f55 18%, #715767 28%, #9f6f68 38%, #bd916c 46%, #c9a574 50%, #bd916c 56%, #9f6f68 64%, #715767 73%, #493f55 82%, #252938 91%, #151720 100%)';

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

  const localHours = Math.floor(localTime / 60);
  const localMinutes = localTime % 60;
  const easternOffset = useDST ? -4 : -5;
  const pacificOffset = useDST ? -7 : -8;
  const utcTotalMinutes = (localTime - localOffsetMinutes + 1440) % 1440;
  const utcHours = Math.floor(utcTotalMinutes / 60);
  const utcMinutes = utcTotalMinutes % 60;

  const formatTime = (hours: number, minutes: number) =>
    `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

  const formatTime12Hour = (hours: number, minutes: number) => {
    const hours12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${hours12}:${String(minutes).padStart(2, '0')}`;
  };

  const period = localHours >= 12 ? 'PM' : 'AM';
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
    <div className="mx-auto flex min-h-[calc(100dvh-3rem)] w-full max-w-6xl items-center px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="w-full rounded-[1.5rem] border border-border/70 bg-card/92 p-5 text-card-foreground shadow-[0_22px_58px_rgba(24,24,26,0.11)] backdrop-blur-xl dark:shadow-[0_24px_64px_rgba(0,0,0,0.32)] sm:p-7">
        <CurrentTimeDisplay onJumpToTime={setLocalTime} />

        <div className="mt-7">
          <div className="mb-3 flex items-center justify-between gap-3">
            <label
              htmlFor="time-of-day"
              className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground"
            >
              Local time of day
            </label>
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              {timeOfDay}
            </span>
          </div>
          <input
            id="time-of-day"
            type="range"
            min="0"
            max="1439"
            step="1"
            value={localTime}
            onChange={(event) => setLocalTime(Number.parseInt(event.target.value, 10))}
            aria-label="Local time of day"
            aria-valuetext={`${formatTime(localHours, localMinutes)} ${timeOfDay}`}
            className="time-day-slider h-14 w-full cursor-pointer rounded-full"
            style={{ background: DAY_GRADIENT }}
          />
          <div className="mt-2 flex justify-between font-mono text-[10px] text-muted-foreground">
            <span>00:00</span>
            <span>06:00</span>
            <span>12:00</span>
            <span>18:00</span>
            <span>23:59</span>
          </div>
        </div>

        <div className="mt-7 grid gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
          <div className="rounded-xl border border-border/65 bg-background/46 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] backdrop-blur-md">
            <div className="flex items-end gap-3">
              <p className="font-mono text-5xl font-semibold tabular-nums tracking-[-0.05em] sm:text-6xl">
                {formatTime(localHours, localMinutes)}
              </p>
              <p className="pb-1 text-xl text-muted-foreground">
                {formatTime12Hour(localHours, localMinutes)} {period}
              </p>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">Selected local time</p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-border/65 bg-background/46 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] backdrop-blur-md">
              <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">UTC</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{formatTime(utcHours, utcMinutes)}</p>
            </div>
            <div className="rounded-xl border border-border/65 bg-background/46 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] backdrop-blur-md">
              <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Eastern</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">
                {formatTime((utcHours + easternOffset + 24) % 24, utcMinutes)}
              </p>
            </div>
            <div className="rounded-xl border border-border/65 bg-background/46 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] backdrop-blur-md">
              <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Pacific</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">
                {formatTime((utcHours + pacificOffset + 24) % 24, utcMinutes)}
              </p>
            </div>
            <div className="col-span-2 sm:col-span-3">
              <TimezoneSelector utcHours={utcHours} utcMinutes={utcMinutes} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
