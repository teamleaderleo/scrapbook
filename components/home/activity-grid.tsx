'use client';

import { alignContributionDaysToWeekColumns } from '@/lib/github-activity-utils';
import { useEffect, useMemo, useRef, useState } from 'react';

export type ActivityGridDay = {
  date: string;
  count: number;
};

const WEEKDAY_LABELS = ['Sun', '', 'Tue', '', 'Thu', '', 'Sat'] as const;

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
  const gridDays = useMemo(() => alignContributionDaysToWeekColumns(days), [days]);
  const weekCount = Math.max(1, gridDays.length / 7);
  const calendarMaxWidthRem = 2.3 + weekCount * 3.5;
  const [selectedDate, setSelectedDate] = useState(days.at(-1)?.date ?? '');
  const [tooltipDate, setTooltipDate] = useState<string | null>(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [finePointer, setFinePointer] = useState(false);
  const previousLatest = useRef(days.at(-1)?.date ?? '');
  const hideTimer = useRef<number | null>(null);
  const positionFrame = useRef<number | null>(null);
  const pendingPosition = useRef({ x: 12, y: 12 });

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
      if (positionFrame.current !== null) window.cancelAnimationFrame(positionFrame.current);
      document.documentElement.style.removeProperty('--activity-tooltip-x');
      document.documentElement.style.removeProperty('--activity-tooltip-y');
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
    pendingPosition.current = {
      x: Math.min(Math.max(12, window.innerWidth - 300), Math.max(12, clientX + 14)),
      y: Math.min(Math.max(12, window.innerHeight - 48), Math.max(12, clientY + 14)),
    };

    if (positionFrame.current !== null) return;
    positionFrame.current = window.requestAnimationFrame(() => {
      const { x, y } = pendingPosition.current;
      document.documentElement.style.setProperty('--activity-tooltip-x', `${x}px`);
      document.documentElement.style.setProperty('--activity-tooltip-y', `${y}px`);
      positionFrame.current = null;
    });
  };

  const showTooltip = (date: string, clientX: number, clientY: number) => {
    if (!finePointer) return;
    if (hideTimer.current !== null) window.clearTimeout(hideTimer.current);
    placeTooltip(clientX, clientY);
    setTooltipDate(date);
    setTooltipVisible(true);
  };

  const hideTooltip = () => {
    setTooltipVisible(false);
    if (hideTimer.current !== null) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setTooltipDate(null), 120);
  };

  return (
    <section
      className="min-w-0 overflow-hidden rounded-[1.25rem] border border-border/70 bg-card p-3.5 text-card-foreground shadow-[0_16px_38px_rgba(35,31,26,0.1)] dark:shadow-[0_16px_38px_rgba(0,0,0,0.28)] sm:p-4 [@media(max-height:780px)]:p-3"
      data-home-activity-grid
      data-fine-pointer={finePointer ? 'true' : 'false'}
    >
      <div className="flex items-center justify-between gap-4">
        <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          28 days · UTC
        </span>
        <div
          className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground"
          aria-hidden="true"
        >
          <span>less</span>
          <span className="h-2.5 w-2.5 rounded-[3px] bg-[#c5c1b8] ring-1 ring-inset ring-black/[0.07] dark:bg-[#303238] dark:ring-white/[0.1]" />
          <span className="h-2.5 w-2.5 rounded-[3px] bg-[#9f97a7] ring-1 ring-inset ring-black/[0.07] dark:bg-[#504a54] dark:ring-white/[0.1]" />
          <span className="h-2.5 w-2.5 rounded-[3px] bg-[#cec4d6] ring-1 ring-inset ring-black/[0.07] dark:bg-[#918a9b] dark:ring-white/[0.1]" />
          <span className="h-2.5 w-2.5 rounded-[3px] bg-[#e4dce9] ring-1 ring-inset ring-black/[0.07] dark:bg-[#c9c2d0] dark:ring-white/[0.1]" />
          <span className="h-2.5 w-2.5 rounded-[3px] bg-[#f7f2e9] ring-1 ring-inset ring-black/[0.07] dark:bg-[#eeeaf2] dark:ring-white/[0.1]" />
          <span>more</span>
        </div>
      </div>

      <div
        className="mx-auto mt-3 grid w-full grid-cols-[1.65rem_minmax(0,1fr)] gap-2 sm:gap-2.5 [@media(max-height:780px)]:mt-2"
        style={{ maxWidth: `min(100%, ${calendarMaxWidthRem}rem)` }}
      >
        <div
          className="grid grid-rows-7 gap-1.5 py-px font-mono text-[8px] font-medium text-muted-foreground sm:gap-2"
          aria-hidden="true"
        >
          {WEEKDAY_LABELS.map((label, index) => (
            <span key={index} className="flex items-center justify-end leading-none">
              {label}
            </span>
          ))}
        </div>

        <div
          className="grid min-w-0 gap-1.5 sm:gap-2"
          style={{
            gridTemplateColumns: `repeat(${weekCount}, minmax(0, 1fr))`,
            gridTemplateRows: 'repeat(7, minmax(0, 1fr))',
          }}
          aria-label="GitHub contribution calendar for the last 28 days"
          data-contribution-week-grid
        >
          {gridDays.map((day, index) => {
            const gridColumn = Math.floor(index / 7) + 1;
            const gridRow = (index % 7) + 1;

            if (!day) {
              return (
                <span
                  key={`empty-${index}`}
                  aria-hidden="true"
                  className="aspect-square min-w-0 rounded-[0.38rem]"
                  style={{ gridColumn, gridRow }}
                />
              );
            }

            const label = labelForDay(day, unit);
            const isSelected = day.date === selected?.date;
            const isLatest = day.date === days.at(-1)?.date;
            const tilt = index % 2 === 0 ? 'hover:rotate-[1.5deg]' : 'hover:-rotate-[1.5deg]';

            return (
              <button
                key={day.date}
                type="button"
                className={`relative aspect-square min-w-0 rounded-[0.38rem] transition-[transform,filter,box-shadow] duration-150 ease-out will-change-transform hover:z-10 hover:-translate-y-1 hover:scale-[1.12] hover:shadow-[0_14px_24px_rgba(35,31,26,0.2)] focus-visible:z-10 focus-visible:-translate-y-1 focus-visible:scale-[1.12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:hover:shadow-[0_16px_28px_rgba(0,0,0,0.44)] ${tilt} ${activityClass(day.count, maximum)} ${isLatest ? 'outline outline-2 outline-offset-2 outline-foreground/20' : ''} ${isSelected ? 'brightness-[1.04] dark:brightness-110' : ''}`}
                style={{ gridColumn, gridRow }}
                aria-label={label}
                aria-pressed={isSelected}
                data-contribution-date={day.date}
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
                  if (!event.currentTarget.matches(':focus-visible')) return;
                  const rect = event.currentTarget.getBoundingClientRect();
                  showTooltip(day.date, rect.left + rect.width / 2, rect.bottom);
                }}
                onBlur={hideTooltip}
                onClick={() => setSelectedDate(day.date)}
              />
            );
          })}
        </div>
      </div>

      <div className="mt-2 flex min-h-8 items-center justify-center rounded-lg border border-border/70 bg-background/55 px-3 py-1.5 text-center font-mono text-[10px] font-medium text-muted-foreground md:hidden" aria-live="polite">
        {selectedLabel}
      </div>

      {finePointer && tooltipLabel ? (
        <div
          className={`pointer-events-none fixed left-0 top-0 z-[90] whitespace-nowrap rounded-lg border border-border/70 bg-popover/88 px-2.5 py-1.5 font-mono text-[10px] font-semibold text-popover-foreground shadow-[0_8px_24px_rgba(20,20,24,0.2)] backdrop-blur-xl transition-opacity duration-100 ${tooltipVisible ? 'opacity-100' : 'opacity-0'}`}
          style={{
            transform:
              'translate3d(var(--activity-tooltip-x, 12px), var(--activity-tooltip-y, 12px), 0)',
          }}
        >
          {tooltipLabel}
        </div>
      ) : null}
    </section>
  );
}
