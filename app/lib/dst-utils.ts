export const getDSTDates = (year: number, region: string) => {
  const getNthWeekdayOfMonth = (
    targetYear: number,
    month: number,
    weekday: number,
    occurrence: number,
  ) => {
    const firstDay = new Date(targetYear, month, 1);
    const firstWeekday = firstDay.getDay();
    const offset = (weekday - firstWeekday + 7) % 7;
    return new Date(targetYear, month, 1 + offset + (occurrence - 1) * 7);
  };

  const getLastWeekdayOfMonth = (targetYear: number, month: number, weekday: number) => {
    const lastDay = new Date(targetYear, month + 1, 0);
    const lastWeekday = lastDay.getDay();
    const offset = (lastWeekday - weekday + 7) % 7;
    return new Date(targetYear, month, lastDay.getDate() - offset);
  };

  if (region === 'us') {
    return {
      start: getNthWeekdayOfMonth(year, 2, 0, 2),
      end: getNthWeekdayOfMonth(year, 10, 0, 1),
    };
  }

  if (region === 'eu') {
    return {
      start: getLastWeekdayOfMonth(year, 2, 0),
      end: getLastWeekdayOfMonth(year, 9, 0),
    };
  }

  if (region === 'aus') {
    return {
      start: getNthWeekdayOfMonth(year, 9, 0, 1),
      end: getNthWeekdayOfMonth(year + 1, 3, 0, 1),
    };
  }

  if (region === 'nz') {
    return {
      start: getLastWeekdayOfMonth(year, 8, 0),
      end: getNthWeekdayOfMonth(year + 1, 3, 0, 1),
    };
  }

  return null;
};

export const isDSTActive = (region: string) => {
  if (typeof window === 'undefined') return false;

  const now = new Date();
  const year = now.getFullYear();
  const dates = getDSTDates(year, region);

  if (!dates) return false;

  if (region === 'aus' || region === 'nz') {
    if (now.getMonth() < 4) {
      const previousYearDates = getDSTDates(year - 1, region);
      return Boolean(previousYearDates && now >= previousYearDates.start && now < dates.end);
    }
    return now >= dates.start || now < dates.end;
  }

  return now >= dates.start && now < dates.end;
};

export const detectCurrentTimezoneDST = (): {
  observesDST: boolean;
  isDSTActive: boolean;
  region: string | null;
} => {
  if (typeof window === 'undefined') {
    return { observesDST: false, isDSTActive: false, region: null };
  }

  const now = new Date();
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const jan = new Date(now.getFullYear(), 0, 1);
  const jul = new Date(now.getFullYear(), 6, 1);
  const janOffset = -jan.getTimezoneOffset();
  const julOffset = -jul.getTimezoneOffset();
  const observesDST = janOffset !== julOffset;

  if (!observesDST) {
    return { observesDST: false, isDSTActive: false, region: null };
  }

  let region: string | null = null;
  if (timezone.startsWith('America/') || timezone.startsWith('Canada/')) {
    region = 'us';
  } else if (timezone.startsWith('Europe/') || timezone.startsWith('Africa/')) {
    region = 'eu';
  } else if (timezone.startsWith('Australia/')) {
    region = 'aus';
  } else if (timezone.startsWith('Pacific/Auckland') || timezone.startsWith('Pacific/Chatham')) {
    region = 'nz';
  }

  return {
    observesDST,
    isDSTActive: region ? isDSTActive(region) : false,
    region,
  };
};
