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
        const sign = offsetMinutes >= 0 ? '+' : '−';
        setUtcOffset(
          `UTC${sign}${String(offsetHours).padStart(2, '0')}:${String(offsetMins).padStart(2, '0')}`,
        );

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
      <p className="material-label-stamped mb-2 text-[9px] text-muted-foreground">time machine</p>
      <div className="mb-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <h1 className="font-mono text-3xl font-semibold tracking-[-0.035em]">Current time</h1>
        <button
          type="button"
          onClick={() => onJumpToTime(currentTime)}
          className="material-paper cursor-pointer rounded-xl border px-2.5 py-1 font-mono text-3xl font-semibold tabular-nums transition-[border-color,box-shadow] hover:border-[hsl(var(--material-paper-edge))] hover:shadow-[0_10px_22px_rgba(40,34,27,0.14)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          title="Jump the slider to the current time"
        >
          {formatTime(currentTime)}
        </button>
      </div>
      <p className="flex flex-wrap items-center gap-1.5 font-mono text-xs tabular-nums text-muted-foreground">
        <span>{userTimezone || 'Local zone'}</span>
        {utcOffset ? (
          <>
            <span aria-hidden="true">·</span>
            <span>{utcOffset}</span>
          </>
        ) : null}
        {isDST ? <span className="material-label-stamped text-[9px] text-amber-700 dark:text-amber-400">DST</span> : null}
      </p>
    </div>
  );
}
