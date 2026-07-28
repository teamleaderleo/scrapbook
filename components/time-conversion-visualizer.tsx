'use client';

import { useEffect, useState } from 'react';
import TimezoneSelector from './timezone-selector';
import CurrentTimeDisplay from './current-time-display';
import { isDSTActive } from '@/app/lib/dst-utils';
import { PaperCreature } from '@/components/paper-creature';
import { CozyNote, PageCurl, PressedSprig, StitchedRule } from '@/components/cozy-flourishes';

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
  const scrapletPose =
    timeOfDay === 'Night'
      ? 'napping'
      : timeOfDay === 'Morning'
        ? 'idle'
        : timeOfDay === 'Afternoon'
          ? 'carrying'
          : 'reading';
  const deskNote =
    timeOfDay === 'Night'
      ? 'The clocks are whispering. Keep the lamp low.'
      : timeOfDay === 'Morning'
        ? 'Fresh page, warm mug, plenty of daylight.'
        : timeOfDay === 'Afternoon'
          ? 'A good hour for pencils and small decisions.'
          : 'One last page while the room turns golden.';

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-3rem)] w-full max-w-6xl items-start px-4 py-4 sm:px-6 sm:py-8 lg:px-8">
      <div className="relative w-full overflow-hidden rounded-[1.5rem] border border-border/70 bg-card/94 p-4 text-card-foreground shadow-[0_22px_58px_rgba(24,24,26,0.11)] dark:shadow-[0_24px_64px_rgba(0,0,0,0.32)] sm:p-7">
        <span className="material-tape-strip" data-side="top" aria-hidden="true" />
        <PressedSprig className="absolute right-4 top-20 hidden rotate-[8deg] opacity-20 lg:block" />
        <PageCurl className="opacity-65" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-35 dark:opacity-10"
          style={{
            backgroundImage:
              'linear-gradient(rgba(64,55,43,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(64,55,43,0.035) 1px, transparent 1px)',
            backgroundSize: '26px 26px',
          }}
        />

        <div className="relative">
          <div className="flex items-start justify-between gap-4">
            <CurrentTimeDisplay onJumpToTime={setLocalTime} />
            <div className="hidden w-40 text-center sm:block">
              <PaperCreature
                pose={scrapletPose}
                size="lg"
                label={`Scraplet during the ${timeOfDay.toLowerCase()}`}
              />
              <p className="mt-1 font-mono text-[8px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {timeOfDay} desk
              </p>
              <CozyNote label="desk note" className="mt-3 rotate-[0.6deg]">
                {deskNote}
              </CozyNote>
            </div>
          </div>

          <div className="mt-5 sm:mt-7">
            <TimezoneSelector utcHours={utcHours} utcMinutes={utcMinutes} />
          </div>

          <div className="mt-6 rounded-2xl border border-dashed border-border/70 bg-background/30 p-4 sm:mt-7 sm:p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <label
                htmlFor="time-of-day"
                className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground"
              >
                Slide through the day
              </label>
              <span className="material-label-stamped text-[9px] text-muted-foreground">{timeOfDay}</span>
            </div>
            <StitchedRule className="mb-3" />
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
            <div className="material-paper relative col-span-2 overflow-hidden rounded-xl border p-4 sm:col-span-1">
              <p className="font-mono text-[10px] uppercase tracking-[0.15em] opacity-65">Local</p>
              <p className="mt-1 font-mono text-3xl font-semibold tabular-nums tracking-[-0.03em]">
                {formatTime(localHours, localMinutes)}
              </p>
              <p className="mt-1 font-mono text-[10px] tabular-nums opacity-65">
                {formatTime12Hour(localHours, localMinutes)} {period} ·{' '}
                {formatOffset(localOffsetMinutes)}
              </p>
              <PageCurl className="h-6 w-6 opacity-65 [&>span]:h-6 [&>span]:w-6" />
            </div>
            <TimeCard label="UTC" time={formatTime(utcHours, utcMinutes)} offset="UTC±00:00" />
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
        </div>
      </div>
    </div>
  );
}

function TimeCard({ label, time, offset }: { label: string; time: string; offset: string }) {
  return (
    <div className="material-paper relative overflow-hidden rounded-xl border p-3 transition-transform duration-150 hover:-rotate-[0.2deg]">
      <p className="font-mono text-[10px] uppercase tracking-[0.15em] opacity-65">{label}</p>
      <p className="mt-1 font-mono text-2xl font-semibold tabular-nums">{time}</p>
      <p className="mt-1 font-mono text-[10px] tabular-nums opacity-65">{offset}</p>
      <PageCurl className="h-5 w-5 opacity-55 [&>span]:h-5 [&>span]:w-5" />
    </div>
  );
}
