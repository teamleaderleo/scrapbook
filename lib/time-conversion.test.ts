import { describe, expect, it } from 'vitest';
import {
  convertLocalTimeToZone,
  formatClockTime12Hour,
  formatDayOffset,
  formatUtcOffset,
  normalizeTimeOfDay,
  parseTimeInput,
} from './time-conversion';

describe('time conversion helpers', () => {
  it('normalizes previous and next-day values', () => {
    expect(normalizeTimeOfDay(-30)).toEqual({
      minutesSinceMidnight: 1410,
      hours: 23,
      minutes: 30,
      dayOffset: -1,
    });
    expect(normalizeTimeOfDay(1470)).toEqual({
      minutesSinceMidnight: 30,
      hours: 0,
      minutes: 30,
      dayOffset: 1,
    });
  });

  it('converts local time with whole and fractional offsets', () => {
    expect(convertLocalTimeToZone(8 * 60, -7 * 60, 9 * 60)).toMatchObject({
      hours: 0,
      minutes: 0,
      dayOffset: 1,
    });
    expect(convertLocalTimeToZone(9 * 60, -7 * 60, 5 * 60 + 30)).toMatchObject({
      hours: 21,
      minutes: 30,
      dayOffset: 0,
    });
  });

  it('formats clock, offset, and day labels', () => {
    expect(formatClockTime12Hour(0, 5)).toBe('12:05 AM');
    expect(formatClockTime12Hour(13, 45)).toBe('1:45 PM');
    expect(formatUtcOffset(-210)).toBe('UTC−03:30');
    expect(formatDayOffset(-1)).toBe('previous day');
    expect(formatDayOffset(1)).toBe('next day');
  });

  it('parses valid time fields and rejects invalid values', () => {
    expect(parseTimeInput('07:35')).toBe(455);
    expect(parseTimeInput('24:00')).toBeNull();
    expect(parseTimeInput('7:35')).toBeNull();
  });
});
