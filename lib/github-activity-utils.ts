const DISPLAY_TIME_ZONE = 'UTC';

export type ContributionGridDay = {
  date: string;
  count: number;
};

export type FourWeekContributionCell<T extends ContributionGridDay> =
  | {
      date: string;
      state: 'recorded';
      day: T;
    }
  | {
      date: string;
      state: 'upcoming';
    }
  | {
      date: string;
      state: 'unavailable';
    };

export function dateKeyInTimeZone(date: Date, timeZone = DISPLAY_TIME_ZONE): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function getRecentDateKeys(now = new Date(), length = 7): string[] {
  const safeLength = Number.isFinite(length) ? Math.max(1, Math.floor(length)) : 7;
  const [year, month, day] = dateKeyInTimeZone(now)
    .split('-')
    .map(Number);

  return Array.from({ length: safeLength }, (_, index) => {
    const date = new Date(Date.UTC(year, month - 1, day - (safeLength - 1 - index)));
    return date.toISOString().slice(0, 10);
  });
}

export function getFourWeekDateKeys(now = new Date()): string[] {
  const [year, month, day] = dateKeyInTimeZone(now)
    .split('-')
    .map(Number);
  const today = new Date(Date.UTC(year, month - 1, day));
  const daysSinceMonday = (today.getUTCDay() + 6) % 7;
  const currentMonday = new Date(Date.UTC(year, month - 1, day - daysSinceMonday));
  const firstMonday = new Date(currentMonday);
  firstMonday.setUTCDate(firstMonday.getUTCDate() - 21);

  return Array.from({ length: 28 }, (_, index) => {
    const date = new Date(firstMonday);
    date.setUTCDate(firstMonday.getUTCDate() + index);
    return date.toISOString().slice(0, 10);
  });
}

export function buildFourWeekContributionCells<T extends ContributionGridDay>(
  days: T[],
  now = new Date(),
): FourWeekContributionCell<T>[] {
  const today = dateKeyInTimeZone(now);
  const byDate = new Map(days.map((day) => [day.date, day]));

  return getFourWeekDateKeys(now).map((date) => {
    if (date > today) return { date, state: 'upcoming' };

    const day = byDate.get(date);
    if (!day) return { date, state: 'unavailable' };

    return { date, state: 'recorded', day };
  });
}

function parseContributionCount(label: string): number | null {
  if (/no contributions?/i.test(label)) return 0;
  const match = label.match(/([\d,]+) contributions?/i);
  return match ? Number(match[1].replaceAll(',', '')) : null;
}

function plainText(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

export function parsePublicContributionTotal(html: string): number | null {
  const text = plainText(html);
  const match = text.match(/([\d,]+) contributions? in the last year/i);
  return match ? Number(match[1].replaceAll(',', '')) : null;
}

export function parsePublicContributionHtml(html: string): Map<string, number> {
  const tooltipById = new Map<string, number>();
  const tooltipPattern = /<tool-tip\b[^>]*for="([^"]+)"[^>]*>([\s\S]*?)<\/tool-tip>/gi;

  for (const match of html.matchAll(tooltipPattern)) {
    const count = parseContributionCount(plainText(match[2]));
    if (count !== null) tooltipById.set(match[1], count);
  }

  const result = new Map<string, number>();
  const cellPattern = /<(?:td|rect)\b([^>]*data-date="(\d{4}-\d{2}-\d{2})"[^>]*)>/gi;

  for (const match of html.matchAll(cellPattern)) {
    const attributes = match[1];
    const date = match[2];
    const directCount = attributes.match(/data-count="(\d+)"/i);
    if (directCount) {
      result.set(date, Number(directCount[1]));
      continue;
    }

    const id = attributes.match(/id="([^"]+)"/i)?.[1];
    if (id && tooltipById.has(id)) result.set(date, tooltipById.get(id) ?? 0);
  }

  return result;
}

export function alignContributionDaysToWeekColumns<T extends ContributionGridDay>(
  days: T[],
): Array<T | null> {
  if (days.length === 0) return [];

  const firstWeekday = new Date(`${days[0].date}T00:00:00Z`).getUTCDay();
  const withLeadingDays: Array<T | null> = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...days,
  ];
  const trailingDays = (7 - (withLeadingDays.length % 7)) % 7;

  return [...withLeadingDays, ...Array.from({ length: trailingDays }, () => null)];
}
