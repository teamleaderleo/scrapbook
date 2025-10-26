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

  // Common UTC offsets
  const timezoneOptions = [
    { offset: -12, label: 'Baker Island' },
    { offset: -11, label: 'American Samoa' },
    { offset: -10, label: 'Hawaii' },
    { offset: -9, label: 'Alaska' },
    { offset: -8, label: 'Pacific Time' },
    { offset: -7, label: 'Mountain Time' },
    { offset: -6, label: 'Central Time' },
    { offset: -5, label: 'Eastern Time' },
    { offset: -4, label: 'Atlantic Time' },
    { offset: -3, label: 'Buenos Aires' },
    { offset: -2, label: 'Mid-Atlantic' },
    { offset: -1, label: 'Azores' },
    { offset: 0, label: 'UTC/London' },
    { offset: 1, label: 'Central European' },
    { offset: 2, label: 'Eastern European' },
    { offset: 3, label: 'Moscow' },
    { offset: 4, label: 'Dubai' },
    { offset: 5, label: 'Pakistan' },
    { offset: 5.5, label: 'India' },
    { offset: 6, label: 'Bangladesh' },
    { offset: 7, label: 'Bangkok' },
    { offset: 8, label: 'Singapore' },
    { offset: 9, label: 'Tokyo' },
    { offset: 10, label: 'Sydney' },
    { offset: 11, label: 'Solomon Islands' },
    { offset: 12, label: 'New Zealand' },
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
            <p className="text-sm text-muted-foreground mb-2">
              {selectedOffset !== null ? formatOffset(selectedOffset) : 'UTC + ?'}
            </p>
            <p className="text-4xl font-med">
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
          <CommandList>
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
                  <span className="text-xs text-muted-foreground">
                    {formatOffset(option.offset)}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}