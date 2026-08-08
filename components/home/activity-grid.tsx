'use client';

import {
  buildFourWeekContributionCells,
  dateKeyInTimeZone,
  type FourWeekContributionCell,
} from '@/lib/github-activity-utils';
import { useEffect, useMemo, useRef, useState } from 'react';
import styles from './activity-grid.module.css';

export type ActivityGridDay = {
  date: string;
  count: number;
};

const WEEKDAY_LABELS = ['Mon', '', 'Wed', '', 'Fri', '', 'Sun'] as const;
const WEEK_COUNT = 4;

function dateFromKey(date: string): Date {
  return new Date(`${date}T00:00:00Z`);
}

function formatDay(date: string): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(dateFromKey(date));
}

function formatMonth(date: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    month: 'short',
    timeZone: 'UTC',
  }).format(dateFromKey(date));
}

function weekMonthLabel(
  cells: FourWeekContributionCell<ActivityGridDay>[]
): string {
  const first = cells[0]?.date;
  const last = cells.at(-1)?.date;
  if (!first || !last) return '';

  const firstMonth = formatMonth(first);
  const lastMonth = formatMonth(last);
  return firstMonth === lastMonth ? firstMonth : `${firstMonth} / ${lastMonth}`;
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

function referenceDate(value: string): Date {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

export function ActivityGrid({
  days,
  unit,
  generatedAt,
  selectedDate,
  onSelectedDateChange,
  onPreviewDateChange,
}: {
  days: ActivityGridDay[];
  unit: string;
  generatedAt: string;
  selectedDate: string;
  onSelectedDateChange: (date: string) => void;
  onPreviewDateChange: (date: string | null) => void;
}) {
  const calendarDate = useMemo(() => referenceDate(generatedAt), [generatedAt]);
  const today = dateKeyInTimeZone(calendarDate);
  const cells = useMemo(
    () => buildFourWeekContributionCells(days, calendarDate),
    [calendarDate, days]
  );
  const recordedDays = useMemo(
    () => cells.flatMap(cell => (cell.state === 'recorded' ? [cell.day] : [])),
    [cells]
  );
  const maximum = Math.max(...recordedDays.map(day => day.count), 0);
  const [tooltipDate, setTooltipDate] = useState<string | null>(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [finePointer, setFinePointer] = useState(false);
  const sectionRef = useRef<HTMLElement | null>(null);
  const hideTimer = useRef<number | null>(null);
  const positionFrame = useRef<number | null>(null);
  const pendingPosition = useRef({ x: 12, y: 12 });
  const weekLabels = useMemo(
    () =>
      Array.from({ length: WEEK_COUNT }, (_, index) =>
        weekMonthLabel(cells.slice(index * 7, index * 7 + 7))
      ),
    [cells]
  );
  const tooltipDay = recordedDays.find(day => day.date === tooltipDate);
  const tooltipLabel = tooltipDay ? labelForDay(tooltipDay, unit) : '';

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
      if (positionFrame.current !== null)
        window.cancelAnimationFrame(positionFrame.current);
    };
  }, []);

  const placeTooltip = (clientX: number, clientY: number) => {
    pendingPosition.current = {
      x: Math.min(
        Math.max(12, window.innerWidth - 300),
        Math.max(12, clientX + 14)
      ),
      y: Math.min(
        Math.max(12, window.innerHeight - 48),
        Math.max(12, clientY + 14)
      ),
    };

    if (positionFrame.current !== null) return;
    positionFrame.current = window.requestAnimationFrame(() => {
      const { x, y } = pendingPosition.current;
      const section = sectionRef.current;
      if (section) {
        section.style.setProperty('--activity-tooltip-x', `${x}px`);
        section.style.setProperty('--activity-tooltip-y', `${y}px`);
      }
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
      ref={sectionRef}
      className="min-w-0 overflow-hidden rounded-[1.25rem] border border-border/70 bg-card p-3.5 text-card-foreground shadow-[0_12px_28px_rgba(35,31,26,0.08)] dark:shadow-[0_14px_32px_rgba(0,0,0,0.25)] sm:p-4 [@media(max-height:780px)]:p-3"
      data-home-activity-grid
      data-fine-pointer={finePointer ? 'true' : 'false'}
    >
      <div className="flex items-center justify-between gap-4">
        <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          4 weeks · pick a day
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

      <div className="mx-auto mt-3 grid w-full max-w-[15rem] grid-cols-[1.65rem_minmax(0,1fr)] gap-x-2 gap-y-1.5 sm:max-w-[17rem] sm:gap-x-2.5 [@media(max-height:780px)]:mt-2">
        <span aria-hidden="true" />
        <div
          className="grid grid-cols-4 gap-1.5 px-px font-mono text-[8px] font-semibold uppercase tracking-[0.1em] text-muted-foreground sm:gap-2"
          aria-hidden="true"
          data-contribution-month-labels
        >
          {weekLabels.map((label, index) => (
            <span key={`${label}-${index}`} className="truncate text-center">
              {label}
            </span>
          ))}
        </div>

        <div
          className="grid grid-rows-7 gap-1.5 py-px font-mono text-[8px] font-medium text-muted-foreground sm:gap-2"
          aria-hidden="true"
        >
          {WEEKDAY_LABELS.map((label, index) => (
            <span
              key={index}
              className="flex items-center justify-end leading-none"
            >
              {label}
            </span>
          ))}
        </div>

        <div
          className="grid min-w-0 gap-1.5 sm:gap-2"
          style={{
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
            gridTemplateRows: 'repeat(7, minmax(0, 1fr))',
          }}
          aria-label="GitHub contribution calendar for three completed weeks and the current week"
          data-calendar-weeks="4"
          data-contribution-week-grid
          data-paper-activity-grid
        >
          {cells.map((cell, index) => {
            const gridColumn = Math.floor(index / 7) + 1;
            const gridRow = (index % 7) + 1;
            const sharedStyle = { gridColumn, gridRow };

            if (cell.state === 'upcoming') {
              return (
                <span
                  key={cell.date}
                  role="img"
                  aria-label={`${formatDay(cell.date)} — upcoming.`}
                  className={`${styles.etchedMark} ${styles.upcomingMark} aspect-[1.18] min-w-0 rounded-[0.38rem] sm:aspect-[1.35] lg:aspect-[1.12] xl:aspect-[1.35]`}
                  style={sharedStyle}
                  data-contribution-cell
                  data-contribution-date={cell.date}
                  data-contribution-state="upcoming"
                  data-contribution-upcoming
                />
              );
            }

            if (cell.state === 'unavailable') {
              return (
                <span
                  key={cell.date}
                  role="img"
                  aria-label={`${formatDay(cell.date)} — activity unavailable.`}
                  className={`${styles.etchedMark} ${styles.unavailableMark} aspect-[1.18] min-w-0 rounded-[0.38rem] sm:aspect-[1.35] lg:aspect-[1.12] xl:aspect-[1.35]`}
                  style={sharedStyle}
                  data-contribution-cell
                  data-contribution-date={cell.date}
                  data-contribution-state="unavailable"
                  data-contribution-unavailable
                />
              );
            }

            const day = cell.day;
            const label = labelForDay(day, unit);
            const isSelected = day.date === selectedDate;
            const isToday = day.date === today;

            return (
              <button
                key={day.date}
                type="button"
                className={`${styles.paperMark} aspect-[1.18] min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:aspect-[1.35] lg:aspect-[1.12] xl:aspect-[1.35] ${activityClass(day.count, maximum)} ${isToday ? 'outline outline-1 outline-offset-2 outline-foreground/15' : ''} ${isSelected ? 'outline outline-2 outline-offset-2 outline-foreground/45 brightness-[1.04] dark:brightness-110' : ''}`}
                style={sharedStyle}
                aria-label={label}
                aria-pressed={isSelected}
                aria-controls="github-activity-scoreboard"
                data-contribution-cell
                data-contribution-date={day.date}
                data-contribution-state="recorded"
                data-contribution-selected={isSelected ? 'true' : 'false'}
                data-paper-activity-mark
                onPointerEnter={event => {
                  onPreviewDateChange(day.date);
                  showTooltip(day.date, event.clientX, event.clientY);
                }}
                onPointerMove={event => {
                  if (finePointer) placeTooltip(event.clientX, event.clientY);
                }}
                onPointerLeave={() => {
                  onPreviewDateChange(null);
                  hideTooltip();
                }}
                onFocus={event => {
                  onPreviewDateChange(day.date);
                  if (!event.currentTarget.matches(':focus-visible')) return;
                  const rect = event.currentTarget.getBoundingClientRect();
                  showTooltip(
                    day.date,
                    rect.left + rect.width / 2,
                    rect.bottom
                  );
                }}
                onBlur={() => {
                  onPreviewDateChange(null);
                  hideTooltip();
                }}
                onClick={() => onSelectedDateChange(day.date)}
              />
            );
          })}
        </div>
      </div>

      {finePointer && tooltipLabel ? (
        <div
          className={`pointer-events-none fixed left-0 top-0 z-[90] whitespace-nowrap rounded-lg border border-border/70 bg-popover px-2.5 py-1.5 font-mono text-[10px] font-semibold text-popover-foreground shadow-[0_8px_20px_rgba(20,20,24,0.16)] transition-opacity duration-100 ${tooltipVisible ? 'opacity-100' : 'opacity-0'}`}
          style={{
            transform:
              'translate3d(var(--activity-tooltip-x, 12px), var(--activity-tooltip-y, 12px), 0)',
          }}
          data-activity-tooltip
        >
          {tooltipLabel}
        </div>
      ) : null}
    </section>
  );
}
