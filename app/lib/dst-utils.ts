// Calculate DST transition dates
export const getDSTDates = (year: number, region: string) => {
  const getNthWeekdayOfMonth = (year: number, month: number, weekday: number, n: number) => {
    const firstDay = new Date(year, month, 1);
    const firstWeekday = firstDay.getDay();
    const offset = (weekday - firstWeekday + 7) % 7;
    return new Date(year, month, 1 + offset + (n - 1) * 7);
  };

  const getLastWeekdayOfMonth = (year: number, month: number, weekday: number) => {
    const lastDay = new Date(year, month + 1, 0);
    const lastWeekday = lastDay.getDay();
    const offset = (lastWeekday - weekday + 7) % 7;
    return new Date(year, month, lastDay.getDate() - offset);
  };

  if (region === 'us') {
    // 2nd Sunday in March, 1st Sunday in November
    return {
      start: getNthWeekdayOfMonth(year, 2, 0, 2),
      end: getNthWeekdayOfMonth(year, 10, 0, 1)
    };
  } else if (region === 'eu') {
    // Last Sunday in March, Last Sunday in October
    return {
      start: getLastWeekdayOfMonth(year, 2, 0),
      end: getLastWeekdayOfMonth(year, 9, 0)
    };
  } else if (region === 'aus') {
    // 1st Sunday in October, 1st Sunday in April (next year)
    return {
      start: getNthWeekdayOfMonth(year, 9, 0, 1),
      end: getNthWeekdayOfMonth(year + 1, 3, 0, 1)
    };
  } else if (region === 'nz') {
    // Last Sunday in September, 1st Sunday in April (next year)
    return {
      start: getLastWeekdayOfMonth(year, 8, 0),
      end: getNthWeekdayOfMonth(year + 1, 3, 0, 1)
    };
  }
  return null;
};

// Check if DST is currently active for a given region
export const isDSTActive = (region: string) => {
  const now = new Date();
  const year = now.getFullYear();
  const dates = getDSTDates(year, region);
  
  if (!dates) return false;

  // For southern hemisphere, handle year wrap
  if (region === 'aus' || region === 'nz') {
    // If we're before April, check against previous year's start date
    if (now.getMonth() < 4) {
      const prevYearDates = getDSTDates(year - 1, region);
      return prevYearDates && now >= prevYearDates.start && now < dates.end;
    }
    // Otherwise check current year
    return now >= dates.start || now < dates.end;
  }

  // Northern hemisphere: simple range check
  return now >= dates.start && now < dates.end;
};

// Detect DST for current timezone
export const detectCurrentTimezoneDST = (): { observesDST: boolean; isDSTActive: boolean; region: string | null } => {
  const now = new Date();
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  // Compare January and July offsets to see if DST is observed
  const jan = new Date(now.getFullYear(), 0, 1);
  const jul = new Date(now.getFullYear(), 6, 1);
  const janOffset = -jan.getTimezoneOffset();
  const julOffset = -jul.getTimezoneOffset();
  
  const observesDST = janOffset !== julOffset;
  
  if (!observesDST) {
    return { observesDST: false, isDSTActive: false, region: null };
  }
  
  // Determine region based on timezone
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
  
  const active = region ? isDSTActive(region) : false;
  
  return { observesDST, isDSTActive: !!active, region };
};