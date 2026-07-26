'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

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
  const base = 'ring-1 ring-inset ring-black/[0.08] dark:ring-white/[0.12]';
  if (count === 0) return `${base} bg-[#b9b6ae] dark:bg-[#303138]`;

  const ratio = maximum === 0 ? 0 : count / maximum;
  if (ratio > 0.8) return `${base} bg-[#ece8de] dark:bg-[#eee9f1]`;
  if (ratio > 0.55) return `${base} bg-[#d8d1dc] dark:bg-[#c8c0cf]`;
  if (ratio > 0.3) return `${base} bg-[#beb5c6] dark:bg-[#958a9e]`;
  if (ratio > 0.12) return `${base} bg-[#a79dae] dark:bg-[#706777]`;
  return `${base} bg-[#8f8797] dark:bg-[#514b57]`;
}

function labelForDay(day: ActivityGridDay, unit: string) {
  return `${formatDay(day.date)} · ${day.count.toLocaleString('en-GB')} ${unit}`;
}

export function ActivityGrid({ days, unit }: { days: ActivityGridDay[]; unit: string }) {
  const maximum = Math.max(...days.map((day) => day.count), 0);
  const [selectedDate, setSelectedDate] = useState(days.at(-1)?.date ?? '');
  const [tooltipDate, setTooltipDate] = useState<string | null>(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [finePointer, setFinePointer] = useState(false);
  const previousLatest = useRef(days.at(-1)?.date ?? '');
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const hideTimerRef = useRef<number | null>(null);
  const positionFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const media = window.matchMedia('(hover: hover) and (pointer: fine)');
    const update = () => setFinePointer(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
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

  useEffect(() => {
    return () => {
      if (hideTimerRef.current !== null) window.clearTimeout(hideTimerRef.current);
      if (positionFrameRef.current !== null) window.cancelAnimationFrame(positionFrameRef.current);
    };
  }, []);

  const cancelHide = useCallback(() => {
    if (hideTimerRef.current !== null) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const scheduleHide = useCallback(() => {
    cancelHide();
    hideTimerRef.current = window.setTimeout(() => {
      setTooltipVisible(false);
      hideTimerRef.current = null;
    }, 90);
  }, [cancelHide]);

  const placeTooltip = useCallback((clientX: number, clientY: number) => {
    if (positionFrameRef.current !== null) window.cancelAnimationFrame(positionFrameRef.current);
    positionFrameRef.current = window.requestAnimationFrame(() => {
      const tooltip = tooltipRef.current;
      if (!tooltip) return;
      const width = tooltip.offsetWidth || 240;
      const height = tooltip.offsetHeight || 34;
      const x = Math.min(window.innerWidth - width - 12, Math.max(12, clientX + 14));
      const y = Math.min(window.innerHeight - height - 12, Math.max(12, clientY + 14));
      tooltip.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    });
  }, []);

  const selected = days.find((day) => day.date === selectedDate);
  const tooltipDay = days.find((day) => day.date === tooltipDate);
  const selectedLabel = useMemo(
    () => (selected ? labelForDay(selected, unit) : ''),
    [selected, unit],
  );
  const tooltipLabel = tooltipDay ? labelForDay(tooltipDay, unit) : '';

  return (
    <section
      className="relative flex h-full min-w-0 flex-col rounded-[1.1rem] border border-black/16 bg-[#d6d3cb] p-3 shadow-[0_12px_28px_rgba(24,24,26,0.09)] dark:border-white/14 dark:bg-[#1b1c21] dark:shadow-[0_14px_34px_rgba(0,0,0,0.24)]"
      onPointerEnter={cancelHide}
      onPointerLeave={scheduleHide}
      onPointerMove={(event) => {
        if (finePointer && tooltipVisible) placeTooltip(event.clientX, event.clientY);
      }}
      onFocusCapture={cancelHide}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) scheduleHide();
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.15em] text-black/64 dark:text-white/68">
          28D activity
        </span>
        <div className="flex items-center gap-1 font-mono text-[8px] uppercase tracking-[0.1em] text-black/56 dark:text-white/58" aria-hidden="true">
          <span>less</span>
          <span className="h-2 w-2 rounded-[2px] bg-[#8f8797]" />
          <span className="h-2 w-2 rounded-[2px] bg-[#beb5c6]" />
          <span className="h-2 w-2 rounded-[2px] bg-[#ece8de] ring-1 ring-inset ring-black/[0.08]" />
          <span>more</span>
        </div>
      </div>

      <div
        className="mt-3 grid min-h-0 flex-1 grid-cols-7 gap-1.5 sm:gap-2"
        aria-label="Four weeks of GitHub activity"
      >
        {days.map((day, index) => {
          const label = labelForDay(day, unit);
          const isSelected = day.date === selected?.date;
          const isLatest = index === days.length - 1;

          return (
            <button
              key={day.date}
              type="button"
              data-activity-cell
              className="group relative flex min-h-8 min-w-0 items-center justify-center rounded-lg border border-black/8 bg-black/[0.025] p-1 transition-[transform,background-color] duration-150 hover:-translate-y-0.5 hover:bg-black/[0.055] focus-visible:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/40 focus-visible:ring-offset-1 focus-visible:ring-offset-[#d6d3cb] dark:border-white/8 dark:bg-white/[0.025] dark:hover:bg-white/[0.07] dark:focus-visible:ring-white/55 dark:focus-visible:ring-offset-[#1b1c21]"
              aria-label={label}
              aria-pressed={isSelected}
              onPointerEnter={(event) => {
                setSelectedDate(day.date);
                if (finePointer) {
                  cancelHide();
                  setTooltipDate(day.date);
                  setTooltipVisible(true);
                  placeTooltip(event.clientX, event.clientY);
                }
              }}
              onFocus={(event) => {
                setSelectedDate(day.date);
                if (finePointer && event.currentTarget.matches(':focus-visible')) {
                  const rect = event.currentTarget.getBoundingClientRect();
                  cancelHide();
                  setTooltipDate(day.date);
                  setTooltipVisible(true);
                  placeTooltip(rect.right, rect.top + rect.height / 2);
                }
              }}
              onClick={() => setSelectedDate(day.date)}
            >
              <span
                className={`aspect-square w-[72%] max-w-10 rounded-[22%] transition-[transform,filter] duration-150 group-hover:scale-110 group-focus-visible:scale-110 motion-reduce:transition-none ${activityClass(day.count, maximum)} ${isLatest ? 'outline outline-1 outline-offset-2 outline-black/35 dark:outline-white/42' : ''} ${isSelected ? 'scale-105 brightness-[1.04] dark:brightness-110' : ''}`}
              />
            </button>
          );
        })}
      </div>

      <div
        className={`mt-2.5 min-h-7 overflow-hidden text-ellipsis whitespace-nowrap rounded-lg border border-black/10 bg-[#e3dfd6] px-3 py-1.5 font-mono text-[9px] font-medium text-black/70 transition-opacity duration-100 dark:border-white/12 dark:bg-[#25262c] dark:text-white/76 ${finePointer && !tooltipVisible ? 'opacity-0' : 'opacity-100'}`}
        aria-live="polite"
      >
        {selectedLabel}
      </div>

      <div
        ref={tooltipRef}
        data-activity-tooltip
        className={`pointer-events-none fixed left-0 top-0 z-[90] max-w-none whitespace-nowrap rounded-lg border border-black/20 bg-[#ddd9d0] px-2.5 py-1.5 font-mono text-[10px] font-semibold text-[#222328] shadow-[0_8px_24px_rgba(20,20,24,0.2)] transition-opacity duration-75 dark:border-white/18 dark:bg-[#292a30] dark:text-[#f3efe8] ${finePointer && tooltipVisible && tooltipLabel ? 'visible opacity-100' : 'invisible opacity-0'}`}
        aria-hidden="true"
      >
        {tooltipLabel}
      </div>
    </section>
  );
}
