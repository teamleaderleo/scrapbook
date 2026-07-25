'use client';

import { useEffect, useState } from 'react';
import TimezoneSelector from './timezone-selector';
import CurrentTimeDisplay from './current-time-display';
import { isDSTActive } from '@/app/lib/dst-utils';

const DAY_GRADIENT =
  'linear-gradient(90deg, #151720 0%, #252438 9%, #4d3c59 18%, #806073 28%, #bc8476 38%, #e0b982 46%, #eee2b8 50%, #dfba82 56%, #bd8577 64%, #806073 73%, #4d3c59 82%, #252438 91%, #151720 100%)';

export default function UTCTimeVisualizer() {
  const [localTime, setLocalTime] = useState(0);
  const [useDST, setUseDST] = useState(false);

  useEffect(() => {
    const now = new Date();
    setLocalTime(now.getHours() * 60 + now.getMinutes());
    setUseDST(isDSTActive('us'));
  }, []);

  const localHours = Math.floor(localTime / 60);
  const localMinutes = localTime % 60;
  const easternOffset = useDST ? -4 : -5;
  const pacificOffset = useDST ? -7 : -8;

  const now = new Date();
  const localDate = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    localHours,
    localMinutes,
  );
  const utcHours = localDate.getUTCHours();
  const utcMinutes = localDate.getUTCMinutes();

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
    <div className="relative mx-auto flex min-h-full w-full max-w-5xl items-center px-4 py-8 sm:px-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-45 dark:opacity-20"
        style={{
          backgroundImage:
            'linear-gradient(rgba(30,30,34,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(30,30,34,0.035) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      <div className="relative w-full rounded-[1.5rem] border border-black/12 bg-[#dedcd6]/82 p-5 shadow-[0_22px_60px_rgba(24,24,26,0.11)] dark:border-white/10 dark:bg-[#18191d]/92 dark:shadow-[0_24px_70px_rgba(0,0,0,0.34)] sm:p-7">
        <CurrentTimeDisplay
          onJumpToTime={(minutes) => {
            setLocalTime(minutes);
          }}
        />

        <div className="mt-7">
          <div className="mb-3 flex items-center justify-between gap-3">
            <label htmlFor="time-of-day" className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-black/50 dark:text-white/48">
              Local time of day
            </label>
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-black/45 dark:text-white/42">
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
            className="time-day-slider h-16 w-full cursor-pointer rounded-full"
            style={{ background: DAY_GRADIENT }}
          />
          <div className="mt-2 flex justify-between font-mono text-[10px] text-black/45 dark:text-white/42">
            <span>00:00</span>
            <span>06:00</span>
            <span>12:00</span>
            <span>18:00</span>
            <span>23:59</span>
          </div>
        </div>

        <div className="mt-7 grid gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
          <div className="rounded-xl border border-black/10 bg-[#f1eee7]/64 p-4 dark:border-white/10 dark:bg-white/[0.035]">
            <div className="flex items-end gap-3">
              <p className="font-mono text-5xl font-semibold tabular-nums tracking-[-0.05em] sm:text-6xl">
                {formatTime(localHours, localMinutes)}
              </p>
              <p className="pb-1 text-xl text-black/50 dark:text-white/48">
                {formatTime12Hour(localHours, localMinutes)} {period}
              </p>
            </div>
            <p className="mt-2 text-sm text-black/52 dark:text-white/50">Selected local time</p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-black/10 bg-[#f1eee7]/64 p-3 dark:border-white/10 dark:bg-white/[0.035]">
              <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-black/46 dark:text-white/44">UTC</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{formatTime(utcHours, utcMinutes)}</p>
            </div>
            <div className="rounded-xl border border-black/10 bg-[#f1eee7]/64 p-3 dark:border-white/10 dark:bg-white/[0.035]">
              <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-black/46 dark:text-white/44">Eastern</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">
                {formatTime((utcHours + easternOffset + 24) % 24, utcMinutes)}
              </p>
            </div>
            <div className="rounded-xl border border-black/10 bg-[#f1eee7]/64 p-3 dark:border-white/10 dark:bg-white/[0.035]">
              <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-black/46 dark:text-white/44">Pacific</p>
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
