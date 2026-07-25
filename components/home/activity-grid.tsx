'use client';

import { useMemo, useState } from 'react';

export type ActivityGridDay = {
  date: string;
  count: number;
};

function formatDay(date: string): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`));
}

function activityClass(count: number, maximum: number): string {
  const base = 'ring-1 ring-inset ring-black/[0.05] dark:ring-white/[0.07]';
  if (count === 0) return `${base} bg-[#c9c7c1] dark:bg-[#292a2f]`;

  const ratio = maximum === 0 ? 0 : count / maximum;
  if (ratio > 0.8) return `${base} bg-[#faf8f2] dark:bg-[#eeeaf2]`;
  if (ratio > 0.55) return `${base} bg-[#e8e2ec] dark:bg-[#c9c2d0]`;
  if (ratio > 0.3) return `${base} bg-[#d4cddb] dark:bg-[#8e8798]`;
  if (ratio > 0.12) return `${base} bg-[#bfb8c7] dark:bg-[#66606d]`;
  return `${base} bg-[#a9a3af] dark:bg-[#4b4750]`;
}

export function ActivityGrid({ days, unit }: { days: ActivityGridDay[]; unit: string }) {
  const maximum = Math.max(...days.map((day) => day.count), 0);
  const [selectedDate, setSelectedDate] = useState(days.at(-1)?.date ?? '');
  const selected = days.find((day) => day.date === selectedDate) ?? days.at(-1);
  const selectedLabel = useMemo(() => {
    if (!selected) return '';
    return `${formatDay(selected.date)} · ${selected.count.toLocaleString('en-US')} ${unit}`;
  }, [selected, unit]);

  return (
    <section className="min-w-0 overflow-hidden rounded-[1.25rem] border border-black/12 bg-[#dedcd6]/78 p-4 shadow-[0_14px_35px_rgba(24,24,26,0.07)] dark:border-white/10 dark:bg-[#18191d]/90 dark:shadow-none sm:p-5">
      <div className="flex justify-end">
        <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-black/45 dark:text-white/45" aria-hidden="true">
          <span>less</span>
          <span className="h-2.5 w-2.5 rounded-[3px] bg-[#a9a3af]" />
          <span className="h-2.5 w-2.5 rounded-[3px] bg-[#d4cddb]" />
          <span className="h-2.5 w-2.5 rounded-[3px] bg-[#faf8f2] ring-1 ring-inset ring-black/[0.05]" />
          <span>more</span>
        </div>
      </div>

      <div className="mt-3 grid min-w-0 grid-cols-7 gap-2 sm:gap-2.5" aria-label="Four weeks of GitHub activity">
        {days.map((day, index) => {
          const label = `${formatDay(day.date)} · ${day.count.toLocaleString('en-US')} ${unit}`;
          const isSelected = day.date === selected?.date;
          const isLatest = index === days.length - 1;

          return (
            <button
              key={day.date}
              type="button"
              className={`aspect-square min-w-0 rounded-[0.5rem] transition duration-150 hover:-translate-y-0.5 hover:scale-[1.035] focus-visible:-translate-y-0.5 focus-visible:scale-[1.035] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/35 dark:focus-visible:ring-white/45 ${activityClass(day.count, maximum)} ${isLatest ? 'outline outline-2 outline-offset-2 outline-black/20 dark:outline-white/25' : ''} ${isSelected ? 'brightness-[1.03] dark:brightness-110' : ''}`}
              aria-label={label}
              aria-pressed={isSelected}
              title={label}
              onPointerEnter={() => setSelectedDate(day.date)}
              onFocus={() => setSelectedDate(day.date)}
              onClick={() => setSelectedDate(day.date)}
            />
          );
        })}
      </div>

      <p className="mt-3 min-h-4 truncate text-center font-mono text-[10px] text-black/48 dark:text-white/45" aria-live="polite">
        {selectedLabel}
      </p>
    </section>
  );
}
