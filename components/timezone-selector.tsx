import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { isDSTActive } from '@/app/lib/dst-utils';

interface TimezoneSelectorProps {
  utcHours: number;
  utcMinutes: number;
}

export default function TimezoneSelector({ utcHours, utcMinutes }: TimezoneSelectorProps) {
  const [selectedOffset, setSelectedOffset] = useState<number | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Common UTC offsets with DST information
  const timezoneOptions = [
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

  // Get adjusted offset accounting for DST
  const getAdjustedOffset = (option: typeof timezoneOptions[0]) => {
    if (!option.dst || !option.region) return option.offset;
    const dstActive = isDSTActive(option.region);
    return dstActive ? option.offset + 1 : option.offset;
  };

  const formatTime = (hours: number, minutes: number) => {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };

  const calculateOffsetTime = (offset: number) => {
    const totalMinutes = utcHours * 60 + utcMinutes + offset * 60;
    const adjustedMinutes = ((totalMinutes % 1440) + 1440) % 1440;
    const hours = Math.floor(adjustedMinutes / 60);
    const minutes = adjustedMinutes % 60;
    return { hours, minutes };
  };

  const formatOffset = (offset: number) => {
    if (offset === 0) return 'UTC';
    const sign = offset >= 0 ? '+' : '';
    return `UTC${sign}${offset}`;
  };

  const handleSelect = (offset: number) => {
    setSelectedOffset(offset);
    setIsOpen(false);
  };

  const selectedOption = selectedOffset !== null 
    ? timezoneOptions.find(opt => opt.offset === selectedOffset)
    : null;

  const displayTime = selectedOption
    ? calculateOffsetTime(getAdjustedOffset(selectedOption))
    : null;

  const displayOffset = selectedOption
    ? getAdjustedOffset(selectedOption)
    : null;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div className="min-w-[7.7rem]">
          <button
            className="w-full text-left hover:bg-muted/50 rounded-md transition-colors p-2 -m-2"
          >
            <p className="text-sm text-muted-foreground mb-2">
              <span className="relative inline-block">
                {displayOffset !== null ? formatOffset(displayOffset) : 'UTC + ?'}
                {selectedOption?.dst && (
                  <span className="absolute left-full ml-1.5 top-1/2 -translate-y-1/2 text-[9px] px-1 py-0.5 bg-amber-500/20 text-amber-700 dark:text-amber-400 rounded font-semibold whitespace-nowrap">
                    DST
                  </span>
                )}
              </span>
            </p>
            <p className="text-4xl font-bold">
              {displayTime ? formatTime(displayTime.hours, displayTime.minutes) : '--:--'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {selectedOption ? selectedOption.label : 'Select timezone'}
            </p>
          </button>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start" side="top" sideOffset={8}>
        <Command>
          <CommandInput placeholder="Search timezone..." />
          <CommandList className="max-h-40 overflow-y-auto scroll-smooth">
            <CommandEmpty>No timezone found.</CommandEmpty>
            <CommandGroup>
              {timezoneOptions.map((option) => {
                const adjustedOffset = getAdjustedOffset(option);
                return (
                  <CommandItem
                    key={option.offset}
                    value={`${option.label} ${formatOffset(adjustedOffset)}`}
                    onSelect={() => handleSelect(option.offset)}
                    className="flex justify-between items-center"
                  >
                    <span className="flex items-center gap-1.5">
                      <span>{option.label}</span>
                      {option.dst && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/20 text-amber-700 dark:text-amber-400 rounded font-semibold">
                          DST
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatOffset(adjustedOffset)}
                    </span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
            <div className="px-3 py-2 text-[11px] text-muted-foreground border-t">
              <span className="text-amber-700 dark:text-amber-400 font-medium">DST</span> = Observes Daylight Saving Time (offset changes seasonally)
            </div>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}