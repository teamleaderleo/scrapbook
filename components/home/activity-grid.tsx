'use client';

import {
  EngravedLabel,
  HardwareScrew,
  InsetSeam,
  MaterialSurface,
} from '@/components/material/material-primitives';
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from 'react';

export type ActivityGridDay = {
  date: string;
  count: number;
};

type HoneycombPosition = {
  row: number;
  column: number;
  style: CSSProperties;
};

const FIELD_STYLE: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(13, 22px)',
  gridTemplateRows: 'repeat(5, 38px)',
  width: 286,
  height: 196,
};

function formatDay(date: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`));
}

function formatCompactDay(date: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`));
}

function activityClass(count: number, maximum: number): string {
  const base = 'ring-1 ring-inset ring-black/[0.08] dark:ring-white/[0.12]';
  if (count === 0) return `${base} bg-[#c8c4bb] dark:bg-[#303238]`;

  const ratio = maximum === 0 ? 0 : count / maximum;
  if (ratio > 0.8) return `${base} bg-[#f8f3e9] dark:bg-[#eeeaf2]`;
  if (ratio > 0.55) return `${base} bg-[#e6ddea] dark:bg-[#c9c2d0]`;
  if (ratio > 0.3) return `${base} bg-[#cec4d7] dark:bg-[#918a9b]`;
  if (ratio > 0.12) return `${base} bg-[#b7adbf] dark:bg-[#696270]`;
  return `${base} bg-[#9f97a7] dark:bg-[#504a54]`;
}

function labelForDay(day: ActivityGridDay, unit: string) {
  return `${formatDay(day.date)} · ${day.count.toLocaleString('en-GB')} ${unit}`;
}

function honeycombPosition(index: number, total: number): HoneycombPosition {
  const recencyIndex = total - 1 - index;
  const row = Math.floor(recencyIndex / 6);
  const position = recencyIndex % 6;
  const column = row % 2 === 0 ? position : 5 - position;
  const trackStart = column * 2 + (row % 2 === 0 ? 1 : 2);

  return {
    row,
    column,
    style: {
      gridColumn: `${trackStart} / span 2`,
      gridRowStart: row + 1,
    },
  };
}

function moveFocus(event: KeyboardEvent<HTMLButtonElement>, index: number) {
  if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) {
    return;
  }

  const field = event.currentTarget.closest<HTMLElement>('[data-home-activity-field]');
  const buttons = Array.from(
    field?.querySelectorAll<HTMLButtonElement>('button[data-activity-day]') ?? [],
  );
  if (buttons.length === 0) return;

  event.preventDefault();
  let nextIndex = index;
  if (event.key === 'Home') nextIndex = 0;
  if (event.key === 'End') nextIndex = buttons.length - 1;
  if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = Math.max(0, index - 1);
  if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
    nextIndex = Math.min(buttons.length - 1, index + 1);
  }
  buttons[nextIndex]?.focus();
}

export function ActivityGrid({ days, unit }: { days: ActivityGridDay[]; unit: string }) {
  const maximum = Math.max(...days.map((day) => day.count), 0);
  const [selectedDate, setSelectedDate] = useState(days.at(-1)?.date ?? '');
  const [interactive, setInteractive] = useState(false);
  const previousLatest = useRef(days.at(-1)?.date ?? '');

  useEffect(() => {
    setInteractive(true);
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

  const selected = days.find((day) => day.date === selectedDate) ?? days.at(-1);

  return (
    <MaterialSurface
      as="section"
      material="steel"
      className="min-w-0 overflow-visible rounded-[1.25rem] border p-3.5 text-foreground sm:p-4"
      data-home-activity-grid
      data-material-exemplar="activity-honeycomb"
    >
      <InsetSeam />
      <HardwareScrew className="left-2 top-2" />
      <HardwareScrew className="bottom-2 right-2" />

      <div className="relative z-[2] flex items-center justify-between gap-4 px-1">
        <EngravedLabel className="text-[9px] font-semibold text-foreground/70">
          28 days · UTC
        </EngravedLabel>
        <div
          className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-foreground/65"
          aria-hidden="true"
        >
          <span>less</span>
          <span className="h-2.5 w-2.5 rounded-[3px] bg-[#9f97a7]" />
          <span className="h-2.5 w-2.5 rounded-[3px] bg-[#cec4d6]" />
          <span className="h-2.5 w-2.5 rounded-[3px] bg-[#f8f3e9] ring-1 ring-inset ring-black/[0.08]" />
          <span>more</span>
        </div>
      </div>

      <div className="relative z-[2] mt-2 flex min-w-0 justify-center">
        <div
          data-home-activity-field
          data-layout="honeycomb"
          data-interactive={interactive ? 'true' : undefined}
          aria-label="Four weeks of GitHub activity"
          style={FIELD_STYLE}
        >
          {days.map((day, index) => {
            const label = labelForDay(day, unit);
            const isSelected = day.date === selected?.date;
            const isToday = index === days.length - 1;
            const position = honeycombPosition(index, days.length);
            const alignRight = position.column >= 3;
            const placeAbove = position.row >= 3;

            return (
              <button
                key={day.date}
                type="button"
                data-activity-day
                data-date={day.date}
                data-today={isToday ? 'true' : undefined}
                data-selected={isSelected ? 'true' : undefined}
                aria-label={label}
                aria-pressed={isSelected}
                className={`group relative h-11 w-11 shrink-0 transform-gpu touch-manipulation rounded-[0.7rem] outline-none transition-[filter,box-shadow] duration-150 ease-out hover:z-30 hover:brightness-[1.06] hover:shadow-[0_8px_18px_rgba(35,31,26,0.18)] focus-visible:z-30 focus-visible:brightness-[1.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring dark:hover:shadow-[0_10px_20px_rgba(0,0,0,0.38)] motion-reduce:transition-none ${isSelected ? 'after:pointer-events-none after:absolute after:-inset-[3px] after:z-20 after:rounded-[0.85rem] after:border-2 after:border-foreground' : ''}`}
                style={position.style}
                onClick={() => setSelectedDate(day.date)}
                onKeyDown={(event) => moveFocus(event, index)}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none absolute inset-0 ${activityClass(day.count, maximum)}`}
                  style={{
                    clipPath: 'polygon(25% 4%, 75% 4%, 100% 50%, 75% 96%, 25% 96%, 0 50%)',
                  }}
                />
                {day.count === 0 ? (
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute left-1/2 top-1/2 z-10 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground/35"
                  />
                ) : null}
                {isToday ? (
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute right-1 top-1 z-10 h-2 w-2 rounded-full border border-background/80 bg-foreground shadow-[0_0_0_2px_rgba(255,255,255,0.35)] dark:shadow-[0_0_0_2px_rgba(0,0,0,0.35)]"
                  />
                ) : null}
                <div
                  aria-hidden="true"
                  className="pointer-events-none fixed z-[90] hidden whitespace-nowrap rounded-lg border border-border/70 bg-popover/92 px-2.5 py-1.5 font-mono text-[10px] font-semibold text-popover-foreground opacity-0 shadow-[0_8px_24px_rgba(20,20,24,0.2)] backdrop-blur-xl transition-opacity duration-100 group-hover:block group-hover:opacity-100 group-focus-visible:block group-focus-visible:opacity-100 motion-reduce:transition-none [@media(pointer:coarse)]:!hidden"
                  style={{
                    ...(alignRight ? { right: 0 } : { left: 0 }),
                    ...(placeAbove ? { bottom: 'calc(100% + 8px)' } : { top: 'calc(100% + 8px)' }),
                  }}
                >
                  {label}
                </div>
              </button>
            );
          })}

          <MaterialSurface
            material="slate"
            className="pointer-events-none z-10 flex min-h-11 min-w-0 flex-col justify-center rounded-[0.58rem] border px-2 py-1 font-mono"
            data-selected-readout
            aria-live="polite"
            aria-atomic="true"
            aria-label={selected ? labelForDay(selected, unit) : undefined}
            style={{ gridColumn: '9 / 14', gridRowStart: 5 }}
          >
            <span className="truncate text-[8px] font-semibold uppercase tracking-[0.11em] opacity-75">
              {selected ? formatCompactDay(selected.date) : 'No date'}
            </span>
            <span className="truncate text-[10px] font-semibold leading-tight">
              {selected ? `${selected.count.toLocaleString('en-GB')} ${unit}` : ''}
            </span>
          </MaterialSurface>
        </div>
      </div>
    </MaterialSurface>
  );
}
