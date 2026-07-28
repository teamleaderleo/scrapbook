import { Minus, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { detectCurrentTimezoneDST } from '@/app/lib/dst-utils';
import {
  formatClockTime,
  formatUtcOffset,
  normalizeTimeOfDay,
} from '@/lib/time-conversion';

interface CurrentTimeDisplayProps {
  selectedMinutes: number;
  onSelectedTimeChange: (minutes: number) => void;
}

type ClockPart = 'hours' | 'minutes';

function padClockPart(value: number) {
  return String(value).padStart(2, '0');
}

function clampClockPart(value: number, maximum: number) {
  return Math.min(maximum, Math.max(0, value));
}

export default function CurrentTimeDisplay({
  selectedMinutes,
  onSelectedTimeChange,
}: CurrentTimeDisplayProps) {
  const selected = normalizeTimeOfDay(selectedMinutes);
  const [currentTime, setCurrentTime] = useState(0);
  const [userTimezone, setUserTimezone] = useState('');
  const [utcOffsetMinutes, setUtcOffsetMinutes] = useState(0);
  const [isDST, setIsDST] = useState(false);
  const [editingPart, setEditingPart] = useState<ClockPart | null>(null);
  const [hourDraft, setHourDraft] = useState(() => padClockPart(selected.hours));
  const [minuteDraft, setMinuteDraft] = useState(() => padClockPart(selected.minutes));

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;

    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.getHours() * 60 + now.getMinutes());
      setUserTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
      setUtcOffsetMinutes(-now.getTimezoneOffset());
      setIsDST(detectCurrentTimezoneDST().isDSTActive);
    };

    updateTime();

    const now = new Date();
    const msUntilNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
    const initialTimeout = setTimeout(() => {
      updateTime();
      interval = setInterval(updateTime, 60_000);
    }, msUntilNextMinute);

    return () => {
      clearTimeout(initialTimeout);
      if (interval) clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (editingPart !== 'hours') setHourDraft(padClockPart(selected.hours));
    if (editingPart !== 'minutes') setMinuteDraft(padClockPart(selected.minutes));
  }, [editingPart, selected.hours, selected.minutes]);

  const applyClockPart = (part: ClockPart, value: number) => {
    const nextHours = part === 'hours' ? clampClockPart(value, 23) : selected.hours;
    const nextMinutes = part === 'minutes' ? clampClockPart(value, 59) : selected.minutes;
    onSelectedTimeChange(nextHours * 60 + nextMinutes);
  };

  const commitDraft = (part: ClockPart) => {
    const draft = part === 'hours' ? hourDraft : minuteDraft;
    const fallback = part === 'hours' ? selected.hours : selected.minutes;
    const maximum = part === 'hours' ? 23 : 59;
    const parsed = draft === '' ? fallback : Number.parseInt(draft, 10);
    const next = clampClockPart(Number.isFinite(parsed) ? parsed : fallback, maximum);

    applyClockPart(part, next);
    if (part === 'hours') setHourDraft(padClockPart(next));
    else setMinuteDraft(padClockPart(next));
  };

  const handleDraftChange = (part: ClockPart, rawValue: string) => {
    const nextDraft = rawValue.replace(/\D/g, '').slice(0, 2);
    if (part === 'hours') setHourDraft(nextDraft);
    else setMinuteDraft(nextDraft);

    if (nextDraft === '') return;
    const parsed = Number.parseInt(nextDraft, 10);
    const maximum = part === 'hours' ? 23 : 59;
    if (parsed <= maximum) applyClockPart(part, parsed);
  };

  const nudgeClockPart = (part: ClockPart, delta: number) => {
    const current = part === 'hours' ? selected.hours : selected.minutes;
    const modulus = part === 'hours' ? 24 : 60;
    const next = (current + delta + modulus) % modulus;
    applyClockPart(part, next);
    if (part === 'hours') setHourDraft(padClockPart(next));
    else setMinuteDraft(padClockPart(next));
  };

  const handlePartKeyDown = (
    part: ClockPart,
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
      nudgeClockPart(part, event.key === 'ArrowUp' ? 1 : -1);
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      event.currentTarget.blur();
    }
  };

  const shiftSelectedTime = (delta: number) => {
    onSelectedTimeChange(normalizeTimeOfDay(selectedMinutes + delta).minutesSinceMidnight);
  };

  const selectedValue = formatClockTime(selected.hours, selected.minutes);

  return (
    <section
      aria-labelledby="time-converter-heading"
      className="grid min-w-0 gap-5 rounded-[1.25rem] border border-border/75 bg-card p-4 text-card-foreground shadow-[0_16px_38px_rgba(24,24,26,0.11)] sm:p-5 lg:grid-cols-[minmax(0,0.82fr)_minmax(24rem,1.18fr)] lg:items-center lg:p-6 dark:shadow-[0_16px_38px_rgba(0,0,0,0.3)]"
      data-time-editor
    >
      <div className="min-w-0">
        <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.17em] text-muted-foreground">
          Time converter
        </p>
        <h1
          id="time-converter-heading"
          className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl"
        >
          Choose the time you want to compare.
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          The selected local time drives every conversion on this page. The live clock is a reset,
          not a competing readout.
        </p>
      </div>

      <div
        data-time-editor-surface
        data-selected-local-time={selectedValue}
        className="min-w-0 rounded-[1.15rem] border border-border/70 bg-background/60 p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.24),0_12px_28px_rgba(20,20,24,0.08)] sm:p-4"
      >
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-foreground">Selected local time</p>
          <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            24 hour
          </span>
        </div>

        <div className="mt-3 grid min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-end gap-2 sm:gap-3">
          <label className="grid min-w-0 gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Hour</span>
            <input
              data-selected-hour
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={hourDraft}
              onFocus={(event) => {
                setEditingPart('hours');
                event.currentTarget.select();
              }}
              onChange={(event) => handleDraftChange('hours', event.target.value)}
              onBlur={() => {
                commitDraft('hours');
                setEditingPart(null);
              }}
              onKeyDown={(event) => handlePartKeyDown('hours', event)}
              role="spinbutton"
              aria-label="Selected hour"
              aria-valuemin={0}
              aria-valuemax={23}
              aria-valuenow={selected.hours}
              className="h-20 w-full min-w-0 rounded-2xl border border-border bg-card px-2 text-center font-mono text-[clamp(2.75rem,14vw,4.75rem)] font-semibold leading-none tabular-nums tracking-[-0.06em] text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_8px_20px_rgba(20,20,24,0.08)] outline-none transition-[border-color,box-shadow,transform] focus:border-ring focus:ring-2 focus:ring-ring/30 sm:h-24"
            />
          </label>

          <span
            aria-hidden="true"
            className="pb-2 font-mono text-[clamp(2.75rem,13vw,4.5rem)] font-semibold leading-none text-muted-foreground sm:pb-3"
          >
            :
          </span>

          <label className="grid min-w-0 gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Minute</span>
            <input
              data-selected-minute
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={minuteDraft}
              onFocus={(event) => {
                setEditingPart('minutes');
                event.currentTarget.select();
              }}
              onChange={(event) => handleDraftChange('minutes', event.target.value)}
              onBlur={() => {
                commitDraft('minutes');
                setEditingPart(null);
              }}
              onKeyDown={(event) => handlePartKeyDown('minutes', event)}
              role="spinbutton"
              aria-label="Selected minute"
              aria-valuemin={0}
              aria-valuemax={59}
              aria-valuenow={selected.minutes}
              className="h-20 w-full min-w-0 rounded-2xl border border-border bg-card px-2 text-center font-mono text-[clamp(2.75rem,14vw,4.75rem)] font-semibold leading-none tabular-nums tracking-[-0.06em] text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_8px_20px_rgba(20,20,24,0.08)] outline-none transition-[border-color,box-shadow,transform] focus:border-ring focus:ring-2 focus:ring-ring/30 sm:h-24"
            />
          </label>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => shiftSelectedTime(-15)}
            className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-border/70 bg-card px-2 text-sm font-medium text-foreground transition-[background-color,transform] hover:-translate-y-px hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Move selected time 15 minutes earlier"
          >
            <Minus className="h-4 w-4" aria-hidden="true" />
            <span>15 min</span>
          </button>
          <button
            type="button"
            onClick={() => onSelectedTimeChange(currentTime)}
            className="min-h-11 rounded-xl border border-border/70 bg-card px-2 text-sm font-medium text-foreground transition-[background-color,transform] hover:-translate-y-px hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            title="Set the selected time to the current local time"
          >
            <span className="block text-[10px] text-muted-foreground">Use now</span>
            <span className="font-mono text-sm font-semibold tabular-nums">
              {formatClockTime(Math.floor(currentTime / 60), currentTime % 60)}
            </span>
          </button>
          <button
            type="button"
            onClick={() => shiftSelectedTime(15)}
            className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-border/70 bg-card px-2 text-sm font-medium text-foreground transition-[background-color,transform] hover:-translate-y-px hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Move selected time 15 minutes later"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>15 min</span>
          </button>
        </div>

        <p className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{userTimezone || 'Local zone'}</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono tabular-nums">{formatUtcOffset(utcOffsetMinutes)}</span>
          {isDST ? (
            <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-semibold text-amber-700 dark:text-amber-400">
              DST
            </span>
          ) : null}
        </p>
      </div>
    </section>
  );
}
