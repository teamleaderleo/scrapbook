'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

export type ActivityGridDay = {
  date: string;
  count: number;
};

function formatDay(date: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`));
}

function activityClass(count: number, maximum: number): string {
  const base = 'ring-1 ring-inset ring-black/[0.07] dark:ring-white/[0.1]';
  if (count === 0) return `${base} bg-[#c5c1b8] dark:bg-[#303238]`;

  const ratio = maximum === 0 ? 0 : count / maximum;
  if (ratio > 0.8) return `${base} bg-[#f7f2e9] dark:bg-[#eeeaf2]`;
  if (ratio > 0.55) return `${base} bg-[#e4dce9] dark:bg-[#c9c2d0]`;
  if (ratio > 0.3) return `${base} bg-[#cec4d6] dark:bg-[#918a9b]`;
  if (ratio > 0.12) return `${base} bg-[#b7adbf] dark:bg-[#696270]`;
  return `${base} bg-[#9f97a7] dark:bg-[#504a54]`;
}

function labelForDay(day: ActivityGridDay, unit: string) {
  return `${formatDay(day.date)} · ${day.count.toLocaleString('en-GB')} ${unit}`;
}

export function ActivityGrid({ days, unit }: { days: ActivityGridDay[]; unit: string }) {
  const maximum = Math.max(...days.map((day) => day.count), 0);
  const [selectedDate, setSelectedDate] = useState(days.at(-1)?.date ?? '');
  const [tooltipDate, setTooltipDate] = useState<string | null>(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 12, y: 12 });
  const [finePointer, setFinePointer] = useState(false);
  const previousLatest = useRef(days.at(-1)?.date ?? '');
  const hideTimer = useRef<number | null>(null);

  useEffect(() => {
    const media = window.matchMedia('(hover: hover) and (pointer: fine)');
    const update = () => setFinePointer(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    return () => {
      if (hideTimer.current !== null) window.clearTimeout(hideTimer.current);
    };
  }, []);

  useEffect(() => {
    const latest = days.at(-1)?.date ?? '';
    setSelectedDate((current) => {
      if (!current || current === previousLatest.current || !days.some((day) => day.date === current)) {
        return latest;
      }
      return current;
    });
    previousLatest.current = latest;
  }, [days]);

  const selected = days.find((day) => day.date === selectedDate);
  const tooltipDay = days.find((day) => day.date === tooltipDate);
  const selectedLabel = useMemo(
    () => (selected ? labelForDay(selected, unit) : ''),
    [selected, unit],
  );
  const tooltipLabel = tooltipDay ? labelForDay(tooltipDay, unit) : '';

  const placeTooltip = (clientX: number, clientY: number) => {
    const maxX = Math.max(12, window.innerWidth - 300);
    const maxY = Math.max(12, window.innerHeight - 48);
    setTooltipPosition({
      x: Math.min(maxX, Math.max(12, clientX + 14)),
      y: Math.min(maxY, Math.max(12, clientY + 14)),
    });
  };

  const showTooltip = (date: string, clientX: number, clientY: number) => {
    if (!finePointer) return;
    if (hideTimer.current !== null) window.clearTimeout(hideTimer.current);
    setTooltipDate(date);
    setTooltipVisible(true);
    placeTooltip(clientX, clientY);
  };

  const hideTooltip = () => {
    setTooltipVisible(false);
    if (hideTimer.current !== null) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setTooltipDate(null), 120);
  };

  return (
    <section className="min-w-0 overflow-hidden rounded-[1.25rem] border border-black/14 bg-[#d7d3ca] p-4 shadow-[0_16px_38px_rgba(35,31,26,0.1)] dark:border-white/12 dark:bg-[#222429] dark:shadow-[0_16px_38px_rgba(0,0,0,0.28)] sm:p-5">
      <div className="flex items-center justify-between gap-4">
        <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.15em] text-black/52 dark:text-white/58">
          28 days · UTC
        </span>
        <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-black/55 dark:text-white/58" aria-hidden="true">
          <span>less</span>
          <span className="h-2.5 w-2.5 rounded-[3px] bg-[#9f97a7]" />
          <span className="h-2.5 w-2.5 rounded-[3px] bg-[#cec4d6]" />
          <span className="h-2.5 w-2.5 rounded-[3px] bg-[#f7f2e9] ring-1 ring-inset ring-black/[0.07]" />
          <span>more</span>
        </div>
      </div>

      <div className="mt-4 grid min-w-0 grid-cols-7 gap-2.5 sm:gap-3" aria-label="Four weeks of GitHub activity">
        {days.map((day, index) => {
          const label = labelForDay(day, unit);
          const isSelected = day.date === selected?.date;
          const isLatest = index === days.length - 1;
          const tilt = index % 2 === 0 ? 'hover:rotate-[1.5deg]' : 'hover:-rotate-[1.5deg]';

          return (
            <button
              key={day.date}
              type="button"
              className={`relative aspect-square min-w-0 rounded-[0.6rem] transition-[transform,filter,box-shadow] duration-150 ease-out hover:z-10 hover:-translate-y-1 hover:scale-[1.08] hover:shadow-[0_14px_24px_rgba(35,31,26,0.2)] focus-visible:z-10 focus-visible:-translate-y-1 focus-visible:scale-[1.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/40 dark:hover:shadow-[0_16px_28px_rgba(0,0,0,0.44)] dark:focus-visible:ring-white/50 ${tilt} ${activityClass(day.count, maximum)} ${isLatest ? 'outline outline-2 outline-offset-2 outline-black/22 dark:outline-white/28' : ''} ${isSelected ? 'brightness-[1.04] dark:brightness-110' : ''}`}
              aria-label={label}
              aria-pressed={isSelected}
              onPointerEnter={(event) => {
                setSelectedDate(day.date);
                showTooltip(day.date, event.clientX, event.clientY);
              }}
              onPointerMove={(event) => {
                if (finePointer) placeTooltip(event.clientX, event.clientY);
              }}
              onPointerLeave={hideTooltip}
              onFocus={(event) => {
                setSelectedDate(day.date);
                const rect = event.currentTarget.getBoundingClientRect();
                showTooltip(day.date, rect.right, rect.bottom);
              }}
              onBlur={hideTooltip}
              onClick={() => setSelectedDate(day.date)}
            />
          );
        })}
      </div>

      <div className="mt-3 flex min-h-9 items-center justify-center rounded-lg border border-black/12 bg-[#e9e5dc] px-3 py-2 text-center font-mono text-[10px] font-medium text-black/68 dark:border-white/12 dark:bg-[#2a2c31] dark:text-white/72 md:hidden" aria-live="polite">
        {selectedLabel}
      </div>

      {finePointer && tooltipLabel ? (
        <div
          className={`pointer-events-none fixed z-[90] whitespace-nowrap rounded-lg border border-black/18 bg-[#e9e5dc] px-2.5 py-1.5 font-mono text-[10px] font-semibold text-[#242328] shadow-[0_8px_24px_rgba(20,20,24,0.2)] transition-opacity duration-100 dark:border-white/18 dark:bg-[#2a2c31] dark:text-[#f4f0e8] ${tooltipVisible ? 'opacity-100' : 'opacity-0'}`}
          style={{ left: tooltipPosition.x, top: tooltipPosition.y }}
        >
          {tooltipLabel}
        </div>
      ) : null}
    </section>
  );
}
