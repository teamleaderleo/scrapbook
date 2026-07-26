'use client';

import { useMemo, useState, type CSSProperties, type KeyboardEvent } from 'react';

export type ActivityFieldDay = {
  date: string;
  count: number;
};

type LayoutId = 'square' | 'honeycomb' | 'pyramid';

type Candidate = {
  id: LayoutId;
  title: string;
  eyebrow: string;
  chronology: string;
  footprint: string;
  note: string;
};

const CANDIDATES: Candidate[] = [
  {
    id: 'square',
    title: 'Square control',
    eyebrow: 'Current direction',
    chronology: 'Oldest begins at the upper left. Today finishes at the lower right.',
    footprint: '320 × 182 px field',
    note: 'The control remains the quickest calendar-like scan, but the present reads as the end of the instrument.',
  },
  {
    id: 'honeycomb',
    title: 'Present-first honeycomb',
    eyebrow: 'Leading candidate',
    chronology: 'Today begins at the upper left. History snakes through staggered six-cell rows.',
    footprint: '286 × 196 px field',
    note: 'The stagger keeps the path readable, gives the present a clear origin, and leaves room for the compact homepage instrument.',
  },
  {
    id: 'pyramid',
    title: 'Stepped square pyramid',
    eyebrow: 'Stranger alternative',
    chronology: 'Today sits at the apex. Each older band adds one cell until the seventh row.',
    footprint: '320 × 320 px field',
    note: 'The cascade is memorable and truthful, though its height and diagonal scanning cost make it a weaker homepage default.',
  },
];

export const ACTIVITY_FIELD_STUDY_DAYS: ActivityFieldDay[] = [
  { date: '2026-06-30', count: 2 },
  { date: '2026-07-01', count: 0 },
  { date: '2026-07-02', count: 4 },
  { date: '2026-07-03', count: 1 },
  { date: '2026-07-04', count: 0 },
  { date: '2026-07-05', count: 7 },
  { date: '2026-07-06', count: 3 },
  { date: '2026-07-07', count: 5 },
  { date: '2026-07-08', count: 0 },
  { date: '2026-07-09', count: 9 },
  { date: '2026-07-10', count: 2 },
  { date: '2026-07-11', count: 1 },
  { date: '2026-07-12', count: 6 },
  { date: '2026-07-13', count: 4 },
  { date: '2026-07-14', count: 0 },
  { date: '2026-07-15', count: 8 },
  { date: '2026-07-16', count: 3 },
  { date: '2026-07-17', count: 11 },
  { date: '2026-07-18', count: 1 },
  { date: '2026-07-19', count: 5 },
  { date: '2026-07-20', count: 7 },
  { date: '2026-07-21', count: 2 },
  { date: '2026-07-22', count: 0 },
  { date: '2026-07-23', count: 10 },
  { date: '2026-07-24', count: 4 },
  { date: '2026-07-25', count: 6 },
  { date: '2026-07-26', count: 3 },
  { date: '2026-07-27', count: 12 },
];

function formatDay(date: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`));
}

function dayLabel(day: ActivityFieldDay): string {
  return `${formatDay(day.date)} · ${day.count.toLocaleString('en-GB')} contributions`;
}

function activityTone(count: number, maximum: number): string {
  const base = 'ring-1 ring-inset ring-black/[0.08] dark:ring-white/[0.12]';
  if (count === 0) return `${base} bg-[#c8c4bb] dark:bg-[#303238]`;

  const ratio = maximum === 0 ? 0 : count / maximum;
  if (ratio > 0.8) return `${base} bg-[#f8f3e9] dark:bg-[#eeeaf2]`;
  if (ratio > 0.55) return `${base} bg-[#e6ddea] dark:bg-[#c9c2d0]`;
  if (ratio > 0.3) return `${base} bg-[#cec4d7] dark:bg-[#918a9b]`;
  if (ratio > 0.12) return `${base} bg-[#b7adbf] dark:bg-[#696270]`;
  return `${base} bg-[#9f97a7] dark:bg-[#504a54]`;
}

function fieldStyle(layout: LayoutId): CSSProperties {
  if (layout === 'honeycomb') {
    return {
      display: 'grid',
      gridTemplateColumns: 'repeat(13, 22px)',
      gridTemplateRows: 'repeat(5, 38px)',
      width: 286,
      height: 196,
    };
  }

  return {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 44px)',
    gridAutoRows: '44px',
    gap: 2,
    width: 320,
  };
}

function pyramidSlot(recencyIndex: number) {
  let row = 0;
  while (((row + 1) * (row + 2)) / 2 <= recencyIndex) row += 1;
  const rowStart = (row * (row + 1)) / 2;
  return { row, column: recencyIndex - rowStart };
}

function cellStyle(layout: LayoutId, index: number, total: number): CSSProperties | undefined {
  if (layout === 'square') return undefined;

  const recencyIndex = total - 1 - index;
  if (layout === 'pyramid') {
    const slot = pyramidSlot(recencyIndex);
    return {
      gridColumnStart: slot.column + 1,
      gridRowStart: slot.row + 1,
    };
  }

  const row = Math.floor(recencyIndex / 6);
  const position = recencyIndex % 6;
  const column = row % 2 === 0 ? position : 5 - position;
  const trackStart = column * 2 + (row % 2 === 0 ? 1 : 2);

  return {
    gridColumn: `${trackStart} / span 2`,
    gridRowStart: row + 1,
  };
}

function moveFocus(event: KeyboardEvent<HTMLButtonElement>, index: number) {
  const key = event.key;
  if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(key)) return;

  const field = event.currentTarget.closest<HTMLElement>('[data-activity-field]');
  const buttons = Array.from(
    field?.querySelectorAll<HTMLButtonElement>('button[data-activity-day]') ?? [],
  );
  if (buttons.length === 0) return;

  event.preventDefault();
  let nextIndex = index;
  if (key === 'Home') nextIndex = 0;
  if (key === 'End') nextIndex = buttons.length - 1;
  if (key === 'ArrowLeft' || key === 'ArrowUp') nextIndex = Math.max(0, index - 1);
  if (key === 'ArrowRight' || key === 'ArrowDown') {
    nextIndex = Math.min(buttons.length - 1, index + 1);
  }
  buttons[nextIndex]?.focus();
}

export function ActivityFieldLab({
  days = ACTIVITY_FIELD_STUDY_DAYS,
}: {
  days?: ActivityFieldDay[];
}) {
  const today = days.at(-1);
  const [selectedDate, setSelectedDate] = useState(today?.date ?? '');
  const maximum = Math.max(...days.map((day) => day.count), 0);
  const selected = days.find((day) => day.date === selectedDate) ?? today;
  const selectedLabel = useMemo(() => (selected ? dayLabel(selected) : ''), [selected]);

  return (
    <div className="min-w-0">
      <div className="grid gap-3 rounded-[1.25rem] border border-border/70 bg-card/80 p-3 shadow-[0_18px_52px_rgba(35,31,26,0.1)] backdrop-blur-sm dark:shadow-[0_18px_52px_rgba(0,0,0,0.3)] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:p-4">
        <div>
          <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.17em] text-muted-foreground">
            Shared selected readout
          </p>
          <p className="mt-1 font-mono text-sm font-semibold text-foreground" aria-live="polite" data-selected-readout>
            {selectedLabel}
          </p>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-2 font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground" aria-label="Activity field state legend">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-foreground" aria-hidden="true" /> today
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-[3px] border-2 border-foreground" aria-hidden="true" /> selected
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-[3px] outline outline-2 outline-offset-2 outline-ring" aria-hidden="true" /> focus
          </span>
        </div>
      </div>

      <div className="mt-4 grid min-w-0 gap-4 xl:grid-cols-3">
        {CANDIDATES.map((candidate) => (
          <section
            key={candidate.id}
            data-candidate={candidate.id}
            className="min-w-0 overflow-hidden rounded-[1.25rem] border border-border/70 bg-card p-3 text-card-foreground shadow-[0_16px_38px_rgba(35,31,26,0.09)] dark:shadow-[0_16px_38px_rgba(0,0,0,0.28)] sm:p-4"
          >
            <div className="flex min-h-36 flex-col justify-between gap-4">
              <div>
                <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {candidate.eyebrow}
                </p>
                <h2 className="mt-1 text-lg font-semibold tracking-tight">{candidate.title}</h2>
              </div>
              <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
                <p>{candidate.chronology}</p>
                <p>{candidate.note}</p>
              </div>
            </div>

            <div className="mt-5 flex min-h-[20rem] items-start justify-center overflow-visible pt-1">
              <div
                data-activity-field
                data-layout={candidate.id}
                aria-label={`${candidate.title}: 28 days of activity`}
                style={fieldStyle(candidate.id)}
              >
                {days.map((day, index) => {
                  const isToday = day.date === today?.date;
                  const isSelected = day.date === selected?.date;
                  const hexagonal = candidate.id === 'honeycomb';

                  return (
                    <button
                      key={day.date}
                      type="button"
                      data-activity-day
                      data-date={day.date}
                      data-today={isToday ? 'true' : undefined}
                      data-selected={isSelected ? 'true' : undefined}
                      aria-label={dayLabel(day)}
                      aria-pressed={isSelected}
                      className={`group relative h-11 w-11 shrink-0 touch-manipulation rounded-[0.7rem] outline-none transition-transform duration-150 ease-out hover:z-10 hover:-translate-y-0.5 hover:scale-[1.04] focus-visible:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:hover:scale-100 ${isSelected ? 'after:pointer-events-none after:absolute after:-inset-[3px] after:z-20 after:rounded-[0.85rem] after:border-2 after:border-foreground' : ''}`}
                      style={cellStyle(candidate.id, index, days.length)}
                      onClick={() => setSelectedDate(day.date)}
                      onKeyDown={(event) => moveFocus(event, index)}
                    >
                      <span
                        aria-hidden="true"
                        className={`absolute inset-0 ${hexagonal ? '' : 'rounded-[0.62rem]'} ${activityTone(day.count, maximum)}`}
                        style={
                          hexagonal
                            ? {
                                clipPath:
                                  'polygon(25% 4%, 75% 4%, 100% 50%, 75% 96%, 25% 96%, 0 50%)',
                              }
                            : undefined
                        }
                      />
                      {day.count === 0 ? (
                        <span
                          aria-hidden="true"
                          className="absolute left-1/2 top-1/2 z-10 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground/35"
                        />
                      ) : null}
                      {isToday ? (
                        <span
                          aria-hidden="true"
                          className="absolute right-1 top-1 z-10 h-2 w-2 rounded-full border border-background/80 bg-foreground shadow-[0_0_0_2px_rgba(255,255,255,0.35)] dark:shadow-[0_0_0_2px_rgba(0,0,0,0.35)]"
                        />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between gap-3 border-t border-border/60 pt-3 font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
              <span>44 px targets</span>
              <span>{candidate.footprint}</span>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
