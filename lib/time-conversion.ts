export const MINUTES_PER_DAY = 24 * 60;

export type NormalizedTimeOfDay = {
  minutesSinceMidnight: number;
  hours: number;
  minutes: number;
  dayOffset: number;
};

export function normalizeTimeOfDay(totalMinutes: number): NormalizedTimeOfDay {
  const roundedMinutes = Math.round(totalMinutes);
  const dayOffset = Math.floor(roundedMinutes / MINUTES_PER_DAY);
  const minutesSinceMidnight =
    ((roundedMinutes % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;

  return {
    minutesSinceMidnight,
    hours: Math.floor(minutesSinceMidnight / 60),
    minutes: minutesSinceMidnight % 60,
    dayOffset,
  };
}

export function convertLocalTimeToZone(
  localMinutes: number,
  localOffsetMinutes: number,
  targetOffsetMinutes: number,
) {
  return normalizeTimeOfDay(localMinutes - localOffsetMinutes + targetOffsetMinutes);
}

export function formatClockTime(hours: number, minutes: number) {
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function formatClockTime12Hour(hours: number, minutes: number) {
  const hour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${hour}:${String(minutes).padStart(2, '0')} ${hours >= 12 ? 'PM' : 'AM'}`;
}

export function formatUtcOffset(offsetMinutes: number) {
  if (offsetMinutes === 0) return 'UTC±00:00';

  const absoluteMinutes = Math.abs(offsetMinutes);
  const hours = Math.floor(absoluteMinutes / 60);
  const minutes = absoluteMinutes % 60;
  return `UTC${offsetMinutes >= 0 ? '+' : '−'}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function formatDayOffset(dayOffset: number) {
  if (dayOffset === 0) return 'same day';
  if (dayOffset === -1) return 'previous day';
  if (dayOffset === 1) return 'next day';
  return dayOffset < 0 ? `${Math.abs(dayOffset)} days earlier` : `${dayOffset} days later`;
}

export function parseTimeInput(value: string) {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;

  const hours = Number.parseInt(match[1], 10);
  const minutes = Number.parseInt(match[2], 10);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}
