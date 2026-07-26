import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { isDSTActive } from '@/app/lib/dst-utils';

interface TimezoneSelectorProps {
  utcHours: number;
  utcMinutes: number;
}

type TimezoneOption = {
  offset: number;
  label: string;
  dst: boolean;
  region: string | null;
};

const TIMEZONE_OPTIONS: TimezoneOption[] = [
  { offset: -12, label: 'Baker Island', dst: false, region: null },
  { offset: -11, label: 'American Samoa', dst: false, region: null },
  { offset: -10, label: 'Hawaii', dst: false, region: null },
  { offset: -9, label: 'Alaska', dst: true, region: 'us' },
  { offset: -8, label: 'Pacific Time', dst: true, region: 'us' },
  { offset: -7, label: 'Mountain Time', dst: true, region: 'us' },
  { offset: -6, label: 'Central Time', dst: true, region: 'us' },
  { offset: -5, label: 'Eastern Time', dst: true, region: 'us' },
  { offset: -4, label: 'Atlantic Time', dst: true, region: 'us' },
  { offset: -3, label: 'Buenos Aires', dst: false, region: null },
  { offset: -2, label: 'Mid-Atlantic', dst: false, region: null },
  { offset: -1, label: 'Azores', dst: true, region: 'eu' },
  { offset: 0, label: 'UTC/London', dst: true, region: 'eu' },
  { offset: 1, label: 'Central European', dst: true, region: 'eu' },
  { offset: 2, label: 'Eastern European', dst: true, region: 'eu' },
  { offset: 3, label: 'Moscow', dst: false, region: null },
  { offset: 4, label: 'Dubai', dst: false, region: null },
  { offset: 5, label: 'Pakistan', dst: false, region: null },
  { offset: 5.5, label: 'India', dst: false, region: null },
  { offset: 6, label: 'Bangladesh', dst: false, region: null },
  { offset: 7, label: 'Bangkok', dst: false, region: null },
  { offset: 8, label: 'Singapore', dst: false, region: null },
  { offset: 9, label: 'Tokyo', dst: false, region: null },
  { offset: 10, label: 'Sydney', dst: true, region: 'aus' },
  { offset: 11, label: 'Solomon Islands', dst: false, region: null },
  { offset: 12, label: 'New Zealand', dst: true, region: 'nz' },
];

function getAdjustedOffset(option: TimezoneOption) {
  if (!option.dst || !option.region) return option.offset;
  return isDSTActive(option.region) ? option.offset + 1 : option.offset;
}

function formatTime(hours: number, minutes: number) {
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function formatOffset(offset: number) {
  if (offset === 0) return 'UTC';
  return `UTC${offset >= 0 ? '+' : ''}${offset}`;
}

export default function TimezoneSelector({ utcHours, utcMinutes }: TimezoneSelectorProps) {
  const [selectedOffset, setSelectedOffset] = useState<number | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const calculateOffsetTime = (offset: number) => {
    const totalMinutes = utcHours * 60 + utcMinutes + offset * 60;
    const adjustedMinutes = ((totalMinutes % 1440) + 1440) % 1440;
    return {
      hours: Math.floor(adjustedMinutes / 60),
      minutes: adjustedMinutes % 60,
    };
  };

  const selectedOption =
    selectedOffset === null
      ? null
      : TIMEZONE_OPTIONS.find((option) => option.offset === selectedOffset) ?? null;
  const displayOffset = selectedOption ? getAdjustedOffset(selectedOption) : null;
  const displayTime = displayOffset === null ? null : calculateOffsetTime(displayOffset);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="w-full rounded-xl border border-border/65 bg-background/46 p-3 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] backdrop-blur-md transition-[background-color,box-shadow,transform] hover:-translate-y-px hover:bg-background/62 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.26),0_8px_20px_rgba(20,20,24,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <p className="mb-2 text-sm text-muted-foreground">
            <span className="relative inline-block">
              {displayOffset === null ? 'UTC + ?' : formatOffset(displayOffset)}
              {selectedOption?.dst ? (
                <span className="absolute left-full top-1/2 ml-1.5 -translate-y-1/2 whitespace-nowrap rounded bg-amber-500/20 px-1 py-0.5 text-[9px] font-semibold text-amber-700 dark:text-amber-400">
                  DST
                </span>
              ) : null}
            </span>
          </p>
          <p className="font-mono text-4xl font-semibold tabular-nums">
            {displayTime ? formatTime(displayTime.hours, displayTime.minutes) : '--:--'}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {selectedOption?.label ?? 'Select timezone'}
          </p>
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-64 border-border/65 bg-popover/88 p-0 text-popover-foreground shadow-[0_22px_58px_rgba(20,20,24,0.2)] backdrop-blur-2xl"
        align="start"
        side="top"
        sideOffset={8}
      >
        <Command>
          <CommandInput placeholder="Search timezone..." />
          <CommandList className="max-h-40 overflow-y-auto scroll-smooth">
            <CommandEmpty>No timezone found.</CommandEmpty>
            <CommandGroup>
              {TIMEZONE_OPTIONS.map((option) => {
                const adjustedOffset = getAdjustedOffset(option);
                return (
                  <CommandItem
                    key={option.offset}
                    value={`${option.label} ${formatOffset(adjustedOffset)}`}
                    onSelect={() => {
                      setSelectedOffset(option.offset);
                      setIsOpen(false);
                    }}
                    className="flex items-center justify-between"
                  >
                    <span className="flex items-center gap-1.5">
                      <span>{option.label}</span>
                      {option.dst ? (
                        <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-400">
                          DST
                        </span>
                      ) : null}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatOffset(adjustedOffset)}
                    </span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
            <div className="border-t px-3 py-2 text-[11px] text-muted-foreground">
              <span className="font-medium text-amber-700 dark:text-amber-400">DST</span> = Observes Daylight Saving Time (offset changes seasonally)
            </div>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
