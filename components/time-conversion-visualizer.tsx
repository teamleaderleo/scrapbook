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
      <div className="w-full rounded-[1.5rem] border border-border/70 bg-card p-4 text-card-foreground shadow-[0_22px_58px_rgba(24,24,26,0.11)] dark:shadow-[0_24px_64px_rgba(0,0,0,0.32)] sm:p-7">
        <CurrentTimeDisplay onJumpToTime={setLocalTime} />

        <div className="mt-5 sm:mt-7">
          <TimezoneSelector utcHours={utcHours} utcMinutes={utcMinutes} />
        </div>

        <div className="mt-6 rounded-2xl border border-border/70 bg-background/35 p-4 sm:mt-7 sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <label
              htmlFor="time-of-day"
              className="font-mono text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground"
            >
              Slide through the day
            </label>
            <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
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
            onChange={event =>
              setLocalTime(Number.parseInt(event.target.value, 10))
            }
            aria-valuetext={`${formatTime(localHours, localMinutes)} ${timeOfDay}`}
            className="time-day-slider h-14 w-full cursor-pointer rounded-full"
            style={{ background: DAY_GRADIENT }}
          />
          <div className="mt-2 flex justify-between font-mono text-[11px] tabular-nums text-muted-foreground">
            <span>00:00</span>
            <span>06:00</span>
            <span>12:00</span>
            <span>18:00</span>
            <span>23:59</span>
          </div>
        </div>

        <section
          aria-label="Time comparisons"
          data-time-comparison-grid
          className="mt-6 grid grid-cols-1 gap-3 sm:mt-7 sm:grid-cols-4"
        >
          <TimeCard
            label="Local"
            time={formatTime(localHours, localMinutes)}
            offset={`${formatTime12Hour(localHours, localMinutes)} ${period} · ${formatOffset(localOffsetMinutes)}`}
          />
          <TimeCard
            label="UTC"
            time={formatTime(utcHours, utcMinutes)}
            offset="UTC±00:00"
          />
          <TimeCard
            label="Eastern"
            time={formatTime((utcHours + easternOffset + 24) % 24, utcMinutes)}
            offset={formatOffset(easternOffset * 60)}
          />
          <TimeCard
            label="Pacific"
            time={formatTime((utcHours + pacificOffset + 24) % 24, utcMinutes)}
            offset={formatOffset(pacificOffset * 60)}
          />
        </section>

        <style>{`
          [data-timezone-trigger] {
            min-height: 3rem;
            border-width: 1.5px;
            border-color: hsl(var(--foreground) / 0.16);
            border-radius: 1rem;
            padding-inline: 1rem;
            font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace;
            font-weight: 650;
            letter-spacing: -0.01em;
          }

          @media (min-width: 22rem) and (max-width: 39.999rem) {
            [data-time-comparison-grid] {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }
          }

          @media (max-width: 19rem) {
            [data-timezone-trigger-hint] {
              display: none;
            }

            [data-timezone-option] {
              align-items: flex-start;
              flex-direction: column;
            }
          }

          @media (prefers-reduced-motion: reduce) {
            [data-current-time-button],
            [data-timezone-trigger] {
              transition: none;
            }

            .time-day-slider::-webkit-slider-thumb {
              transition: none;
            }

            .time-day-slider:active::-webkit-slider-thumb {
              transform: none;
            }
          }
        `}</style>
      </div>
    </div>
  );
}

function TimeCard({
  label,
  time,
  offset,
}: {
  label: string;
  time: string;
  offset: string;
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-background/55 p-3">
      <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <time
        dateTime={time}
        className="mt-1 block font-mono text-2xl font-semibold tabular-nums"
      >
        {time}
      </time>
      <p className="mt-1 break-words font-mono text-[11px] tabular-nums text-muted-foreground">
        {offset}
      </p>
    </div>
  );
}
