const DAY_MS = 24 * 60 * 60 * 1000;

function parseDate(value: string | Date | null | undefined) {
  if (!value) return null;
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function floorUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function subtractUtcMonth(date: Date) {
  const targetMonthStart = new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth() - 1,
      1,
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds(),
      date.getUTCMilliseconds(),
    ),
  );
  const finalDay = new Date(
    Date.UTC(targetMonthStart.getUTCFullYear(), targetMonthStart.getUTCMonth() + 1, 0),
  ).getUTCDate();
  targetMonthStart.setUTCDate(Math.min(date.getUTCDate(), finalDay));
  return targetMonthStart;
}

export type UsageWeekWindow = {
  start: Date;
  label: '7 days' | 'Since reset';
  dayCount: number;
  resetOverrides: boolean;
};

export function getUsageWeekWindow(
  resetAt: string | null | undefined,
  latestAt: string | Date | null | undefined,
): UsageWeekWindow {
  const latest = parseDate(latestAt) ?? new Date();
  const latestDay = floorUtcDay(latest);
  const rollingStart = new Date(latestDay.getTime() - 6 * DAY_MS);
  const nextReset = parseDate(resetAt);

  if (!nextReset) {
    return { start: rollingStart, label: '7 days', dayCount: 7, resetOverrides: false };
  }

  let cycleStart = subtractUtcMonth(nextReset);
  for (let index = 0; index < 24 && cycleStart.getTime() > latest.getTime(); index += 1) {
    cycleStart = subtractUtcMonth(cycleStart);
  }

  const cycleDay = floorUtcDay(cycleStart);
  if (cycleDay.getTime() <= rollingStart.getTime() || cycleDay.getTime() > latestDay.getTime()) {
    return { start: rollingStart, label: '7 days', dayCount: 7, resetOverrides: false };
  }

  const dayCount = Math.max(
    1,
    Math.min(7, Math.floor((latestDay.getTime() - cycleDay.getTime()) / DAY_MS) + 1),
  );
  return {
    start: cycleDay,
    label: 'Since reset',
    dayCount,
    resetOverrides: true,
  };
}
