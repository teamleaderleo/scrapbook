'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

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

function labelForDay(day: ActivityGridDay, unit: string) {
  return `${formatDay(day.date)} · ${day.count.toLocaleString('en-US')} ${unit}`;
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
    }, 140);
  }, [cancelHide]);

  const placeTooltip = useCallback((clientX: number, clientY: number) => {
    if (positionFrameRef.current !== null) window.cancelAnimationFrame(positionFrameRef.current);
    positionFrameRef.current = window.requestAnimationFrame(() => {
      const tooltip = tooltipRef.current;
      if (!tooltip) return;
      const width = tooltip.offsetWidth || 208;
      const height = tooltip.offsetHeight || 40;
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
      className="relative h-full min-w-0 rounded-[1.1rem] border border-black/12 bg-[#dedcd6] p-3 shadow-[0_12px_28px_rgba(24,24,26,0.07)] dark:border-white/10 dark:bg-[#18191d] dark:shadow-none"
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
        <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.15em] text-black/55 dark:text-white/55">
          28D activity
        </span>
        <div className="flex items-center gap-1 font-mono text-[8px] uppercase tracking-[0.1em] text-black/48 dark:text-white/48" aria-hidden="true">
          <span>less</span>
          <span className="h-2 w-2 rounded-[2px] bg-[#a9a3af]" />
          <span className="h-2 w-2 rounded-[2px] bg-[#d4cddb]" />
          <span className="h-2 w-2 rounded-[2px] bg-[#faf8f2] ring-1 ring-inset ring-black/[0.05]" />
          <span>more</span>
        </div>
      </div>

      <div className="mt-2.5 grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-stretch gap-3">
        <div
          className="grid grid-flow-col grid-rows-7 gap-0.5"
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
                className="group flex h-4 w-4 items-center justify-center rounded-[4px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/35 focus-visible:ring-offset-1 focus-visible:ring-offset-[#dedcd6] dark:focus-visible:ring-white/45 dark:focus-visible:ring-offset-[#18191d]"
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
                  className={`h-2.5 w-2.5 rounded-[3px] transition-transform duration-150 group-hover:scale-125 group-focus-visible:scale-125 motion-reduce:transition-none ${activityClass(day.count, maximum)} ${isLatest ? 'outline outline-1 outline-offset-1 outline-black/25 dark:outline-white/30' : ''} ${isSelected ? 'scale-110 brightness-[1.04] dark:brightness-110' : ''}`}
                />
              </button>
            );
          })}
        </div>

        <div className="flex min-w-0 items-center rounded-lg border border-black/10 bg-[#f4f1ea] px-3 py-2 font-mono text-[9px] font-medium leading-relaxed text-black/62 dark:border-white/10 dark:bg-[#202126] dark:text-white/66" aria-live="polite">
          {selectedLabel}
        </div>
      </div>

      <div
        ref={tooltipRef}
        data-activity-tooltip
        className={`pointer-events-none fixed left-0 top-0 z-[90] max-w-[13rem] rounded-lg border border-black/18 bg-[#f4f1ea] px-2.5 py-1.5 font-mono text-[10px] font-semibold text-[#242328] shadow-[0_8px_24px_rgba(20,20,24,0.18)] transition-opacity duration-100 dark:border-white/16 dark:bg-[#202126] dark:text-[#f0ece5] ${finePointer && tooltipVisible && tooltipLabel ? 'visible opacity-100' : 'invisible opacity-0'}`}
        aria-hidden="true"
      >
        {tooltipLabel}
      </div>
    </section>
  );
}
