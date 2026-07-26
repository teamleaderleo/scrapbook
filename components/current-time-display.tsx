import { useEffect, useState } from 'react';
import { detectCurrentTimezoneDST } from '@/app/lib/dst-utils';

interface CurrentTimeDisplayProps {
  onJumpToTime: (minutes: number) => void;
}

export default function CurrentTimeDisplay({ onJumpToTime }: CurrentTimeDisplayProps) {
  const [currentTime, setCurrentTime] = useState(0);
  const [userTimezone, setUserTimezone] = useState('');
  const [utcOffset, setUtcOffset] = useState('');
  const [isDST, setIsDST] = useState(false);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;

    const updateTime = () => {
      const now = new Date();
      const minutesSinceMidnight = now.getHours() * 60 + now.getMinutes();
      setCurrentTime(minutesSinceMidnight);

      if (!userTimezone) {
        setUserTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);

        const offsetMinutes = -now.getTimezoneOffset();
        const offsetHours = Math.floor(Math.abs(offsetMinutes) / 60);
        const offsetMins = Math.abs(offsetMinutes) % 60;
        const sign = offsetMinutes >= 0 ? '+' : '-';
        const offsetStr =
          offsetMins === 0
            ? `UTC${sign}${offsetHours}`
            : `UTC${sign}${offsetHours}:${String(offsetMins).padStart(2, '0')}`;
        setUtcOffset(offsetStr);

        const dstInfo = detectCurrentTimezoneDST();
        setIsDST(dstInfo.isDSTActive);
      }
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
  }, [userTimezone]);

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  };

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Current time</h1>
        <button
          type="button"
          onClick={() => onJumpToTime(currentTime)}
          className="cursor-pointer rounded-xl border border-border/65 bg-background/42 px-2.5 py-1 text-3xl font-semibold tabular-nums shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_7px_18px_rgba(20,20,24,0.08)] backdrop-blur-xl transition-[background-color,box-shadow,transform] hover:-translate-y-px hover:bg-background/62 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.38),0_10px_22px_rgba(20,20,24,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          title="Jump the scrubber to the current time"
        >
          {formatTime(currentTime)}
        </button>
      </div>
      <p className="text-sm text-muted-foreground">
        <span className="relative inline-block">
          {userTimezone} ({utcOffset})
          {isDST ? (
            <span className="absolute left-full top-1/2 ml-1.5 -translate-y-1/2 whitespace-nowrap rounded bg-amber-500/20 px-1 py-0.5 text-[9px] font-semibold text-amber-700 dark:text-amber-400">
              DST
            </span>
          ) : null}
        </span>
      </p>
    </div>
  );
}
