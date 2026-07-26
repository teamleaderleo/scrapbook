'use client';

import { useEffect, useState } from 'react';
import TimezoneSelector from './timezone-selector';
import CurrentTimeDisplay from './current-time-display';
import { isDSTActive } from '@/app/lib/dst-utils';

const DAY_GRADIENT =
  'linear-gradient(90deg, #151720 0%, #252938 9%, #493f55 18%, #715767 28%, #9f6f68 38%, #bd916c 46%, #c9a574 50%, #bd916c 56%, #9f6f68 64%, #715767 73%, #493f55 82%, #252938 91%, #151720 100%)';

function formatOffset(offsetMinutes: number) {
  if (offsetMinutes === 0) return 'UTC±00:00';

  const absoluteMinutes = Math.abs(offsetMinutes);
  const hours = Math.floor(absoluteMinutes / 60);
  const minutes = absoluteMinutes % 60;
  return `UTC${offsetMinutes >= 0 ? '+' : '−'}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
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
    <div className="mx-auto flex min-h-[calc(100dvh-3rem)] w-full max-w-6xl items-start px-4 py-4 sm:px-6 sm:py-8 lg:px-8">
      <div className="w-full rounded-[1.5rem] border border-border/70 bg-card/92 p-4 text-card-foreground shadow-[0_22px_58px_rgba(24,24,26,0.11)] backdrop-blur-xl dark:shadow-[0_24px_64px_rgba(0,0,0,0.32)] sm:p-7">
        <CurrentTimeDisplay onJumpToTime={setLocalTime} />

        <div className="mt-5 sm:mt-7">
          <TimezoneSelector utcHours={utcHours} utcMinutes={utcMinutes} />
        </div>

        <div className="mt-6 sm:mt-7">
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
          <div className="mt-2 flex justify-between font-mono text-[10px] tabular-nums text-muted-foreground">
            <span>00:00</span>
            <span>06:00</span>
            <span>12:00</span>
            <span>18:00</span>
            <span>23:59</span>
          </div>
        </div>

        <section
          aria-label="Time comparisons"
          className="mt-6 grid grid-cols-2 gap-3 sm:mt-7 sm:grid-cols-4"
        >
          <div className="col-span-2 rounded-xl border border-border/65 bg-background/46 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] backdrop-blur-md sm:col-span-1">
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
              Local
            </p>
            <p className="mt-1 font-mono text-3xl font-semibold tabular-nums tracking-[-0.03em]">
              {formatTime(localHours, localMinutes)}
            </p>
            <p className="mt-1 font-mono text-[10px] tabular-nums text-muted-foreground">
              {formatTime12Hour(localHours, localMinutes)} {period} ·{' '}
              {formatOffset(localOffsetMinutes)}
            </p>
          </div>
          <div className="rounded-xl border border-border/65 bg-background/46 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] backdrop-blur-md">
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
              UTC
            </p>
            <p className="mt-1 font-mono text-2xl font-semibold tabular-nums">
              {formatTime(utcHours, utcMinutes)}
            </p>
            <p className="mt-1 font-mono text-[10px] tabular-nums text-muted-foreground">
              UTC±00:00
            </p>
          </div>
          <div className="rounded-xl border border-border/65 bg-background/46 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] backdrop-blur-md">
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
              Eastern
            </p>
            <p className="mt-1 font-mono text-2xl font-semibold tabular-nums">
              {formatTime((utcHours + easternOffset + 24) % 24, utcMinutes)}
            </p>
            <p className="mt-1 font-mono text-[10px] tabular-nums text-muted-foreground">
              {formatOffset(easternOffset * 60)}
            </p>
          </div>
          <div className="rounded-xl border border-border/65 bg-background/46 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] backdrop-blur-md">
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
              Pacific
            </p>
            <p className="mt-1 font-mono text-2xl font-semibold tabular-nums">
              {formatTime((utcHours + pacificOffset + 24) % 24, utcMinutes)}
            </p>
            <p className="mt-1 font-mono text-[10px] tabular-nums text-muted-foreground">
              {formatOffset(pacificOffset * 60)}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
