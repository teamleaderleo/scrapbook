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

    let interval: NodeJS.Timeout;
    const initialTimeout = setTimeout(() => {
      updateTime();
      interval = setInterval(updateTime, 60000);
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
        <h1 className="text-3xl font-bold">Current time:</h1>
        <button
          type="button"
          onClick={() => onJumpToTime(currentTime)}
          className="cursor-pointer rounded-md border border-black/15 bg-black/[0.035] px-1.5 text-3xl font-bold transition-colors hover:bg-black/[0.07] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black/60 dark:border-white/15 dark:bg-white/[0.045] dark:hover:bg-white/[0.08] dark:focus-visible:outline-white/70"
        >
          {formatTime(currentTime)}
        </button>
      </div>
      <p className="text-sm text-muted-foreground">
        <span className="relative inline-block">
          {userTimezone} ({utcOffset})
          {isDST && (
            <span className="absolute left-full top-1/2 ml-1.5 -translate-y-1/2 whitespace-nowrap rounded bg-amber-500/20 px-1 py-0.5 text-[9px] font-semibold text-amber-700 dark:text-amber-400">
              DST
            </span>
          )}
        </span>
      </p>
    </div>
  );
}
