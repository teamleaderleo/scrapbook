import { useState, useEffect } from 'react';

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
      
      // Only set timezone info once
      if (!userTimezone) {
        setUserTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
        
        // Calculate UTC offset
        const offsetMinutes = -now.getTimezoneOffset();
        const offsetHours = Math.floor(Math.abs(offsetMinutes) / 60);
        const offsetMins = Math.abs(offsetMinutes) % 60;
        const sign = offsetMinutes >= 0 ? '+' : '-';
        const offsetStr = offsetMins === 0 
          ? `UTC${sign}${offsetHours}` 
          : `UTC${sign}${offsetHours}:${String(offsetMins).padStart(2, '0')}`;
        setUtcOffset(offsetStr);
        
        // Detect DST
        const jan = new Date(now.getFullYear(), 0, 1);
        const jul = new Date(now.getFullYear(), 6, 1);
        const janOffset = -jan.getTimezoneOffset();
        const julOffset = -jul.getTimezoneOffset();
        
        // If offsets differ, DST is observed
        const observesDST = janOffset !== julOffset;
        if (observesDST) {
          // DST is active if current offset matches the larger offset (summer time)
          const currentOffset = offsetMinutes;
          const dstOffset = Math.max(janOffset, julOffset);
          setIsDST(currentOffset === dstOffset);
        }
      }
    };

    // Initial update
    updateTime();

    // Update every minute
    const interval = setInterval(updateTime, 60000);

    return () => clearInterval(interval);
  }, [userTimezone]);

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  };

  return (
    <div>
      <div className="mb-2">
        <h1 className="text-3xl font-bold inline">Current time: </h1>
        <button
          onClick={() => onJumpToTime(currentTime)}
          className="text-3xl font-bold rounded-md bg-muted/50 hover:bg-muted transition-colors cursor-pointer align-baseline px-1.5"
        >
          {formatTime(currentTime)}
        </button>
      </div>
      <p className="text-sm text-muted-foreground">
        <span className="relative inline-block">
          {userTimezone} ({utcOffset})
          {isDST && (
            <span className="absolute left-full ml-1.5 top-1/2 -translate-y-1/2 text-[9px] px-1 py-0.5 bg-amber-500/20 text-amber-700 dark:text-amber-400 rounded font-semibold whitespace-nowrap">
              DST
            </span>
          )}
        </span>
      </p>
    </div>
  );
}