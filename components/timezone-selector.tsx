import React, { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';

interface TimezoneSelectorProps {
  utcHours: number;
  utcMinutes: number;
}

export default function TimezoneSelector({ utcHours, utcMinutes }: TimezoneSelectorProps) {
  const [selectedOffset, setSelectedOffset] = useState<number | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Common UTC offsets with DST information
  const timezoneOptions = [
    { offset: -12, label: 'Baker Island', dst: false },
    { offset: -11, label: 'American Samoa', dst: false },
    { offset: -10, label: 'Hawaii', dst: false },
    { offset: -9, label: 'Alaska', dst: true },
    { offset: -8, label: 'Pacific Time', dst: true },
    { offset: -7, label: 'Mountain Time', dst: true },
    { offset: -6, label: 'Central Time', dst: true },
    { offset: -5, label: 'Eastern Time', dst: true },
    { offset: -4, label: 'Atlantic Time', dst: true },
    { offset: -3, label: 'Buenos Aires', dst: false },
    { offset: -2, label: 'Mid-Atlantic', dst: false },
    { offset: -1, label: 'Azores', dst: true },
    { offset: 0, label: 'UTC/London', dst: true },
    { offset: 1, label: 'Central European', dst: true },
    { offset: 2, label: 'Eastern European', dst: true },
    { offset: 3, label: 'Moscow', dst: false },
    { offset: 4, label: 'Dubai', dst: false },
    { offset: 5, label: 'Pakistan', dst: false },
    { offset: 5.5, label: 'India', dst: false },
    { offset: 6, label: 'Bangladesh', dst: false },
    { offset: 7, label: 'Bangkok', dst: false },
    { offset: 8, label: 'Singapore', dst: false },
    { offset: 9, label: 'Tokyo', dst: false },
    { offset: 10, label: 'Sydney', dst: true },
    { offset: 11, label: 'Solomon Islands', dst: false },
    { offset: 12, label: 'New Zealand', dst: true },
  ];

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

  const displayTime = selectedOffset !== null 
    ? calculateOffsetTime(selectedOffset)
    : null;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div className="min-w-[7.7rem]">
          <button
            className="w-full text-left hover:bg-muted/50 rounded-md transition-colors p-2 -m-2"
          >
            <p className="text-sm text-muted-foreground mb-2 flex items-center justify-between">
              <span>{selectedOffset !== null ? formatOffset(selectedOffset) : 'UTC + ?'}</span>
              {selectedOption?.dst && (
                <span className="text-[9px] px-1 py-0.5 bg-amber-500/20 text-amber-700 dark:text-amber-400 rounded font-semibold">
                  DST
                </span>
              )}
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
          <CommandList className="max-h-80 overflow-y-auto scroll-smooth">
            <CommandEmpty>No timezone found.</CommandEmpty>
            <CommandGroup>
              {timezoneOptions.map((option) => (
                <CommandItem
                  key={option.offset}
                  value={`${option.label} ${formatOffset(option.offset)}`}
                  onSelect={() => handleSelect(option.offset)}
                  className="flex justify-between items-center"
                >
                  <span>{option.label}</span>
                  <span className="flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground">
                      {formatOffset(option.offset)}
                    </span>
                    {option.dst && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/20 text-amber-700 dark:text-amber-400 rounded font-semibold">
                        DST
                      </span>
                    )}
                  </span>
                </CommandItem>
              ))}
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