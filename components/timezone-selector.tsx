'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  TIMEZONE_OPTIONS,
  UTC_OPTION,
  formatOffset,
  formatSearchOffset,
  formatTime,
  getAdjustedOffset,
  type TimezoneOption,
} from '@/lib/timezone-options';
import { formatDayOffset, normalizeTimeOfDay } from '@/lib/time-conversion';
import {
  createBrowserViewportRestorationScheduler,
  type ViewportRestorationScheduler,
} from '@/lib/visual-viewport-restoration';

interface TimezoneSelectorProps {
  utcTotalMinutes: number;
}

export default function TimezoneSelector({ utcTotalMinutes }: TimezoneSelectorProps) {
  const [selectedZoneId, setSelectedZoneId] = useState(UTC_OPTION.id);
  const [previewZoneId, setPreviewZoneId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [canApplyDST, setCanApplyDST] = useState(false);
  const [resultMaxHeight, setResultMaxHeight] = useState(360);
  const rootRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const restorePositionRef = useRef({ left: 0, top: 0 });
  const restorationSchedulerRef = useRef<ViewportRestorationScheduler | null>(null);

  const selectedOption =
    TIMEZONE_OPTIONS.find((option) => option.id === selectedZoneId) ?? UTC_OPTION;
  const previewOption =
    isOpen && previewZoneId
      ? TIMEZONE_OPTIONS.find((option) => option.id === previewZoneId) ?? null
      : null;
  const displayOption = previewOption ?? selectedOption;
  const displayOffset = getAdjustedOffset(displayOption, canApplyDST);
  const displayTime = normalizeTimeOfDay(utcTotalMinutes + displayOffset * 60);
  const isPreviewing = Boolean(previewOption && previewOption.id !== selectedOption.id);

  const measureAvailableResults = useCallback(() => {
    if (!isOpen || !listRef.current) return;

    const viewport = window.visualViewport;
    const viewportBottom = viewport ? viewport.offsetTop + viewport.height : window.innerHeight;
    const listTop = listRef.current.getBoundingClientRect().top;
    const availableHeight = Math.floor(viewportBottom - listTop - 12);
    setResultMaxHeight(Math.max(0, Math.min(420, availableHeight)));
  }, [isOpen]);

  const keepActiveOptionVisible = useCallback(() => {
    const list = listRef.current;
    const activeOption = list?.querySelector<HTMLElement>('[cmdk-item][data-selected="true"]');
    if (!list || !activeOption) return;

    const listBox = list.getBoundingClientRect();
    const optionBox = activeOption.getBoundingClientRect();
    if (optionBox.top < listBox.top) {
      list.scrollTop -= listBox.top - optionBox.top;
    } else if (optionBox.bottom > listBox.bottom) {
      list.scrollTop += optionBox.bottom - listBox.bottom;
    }
  }, []);

  const closePicker = useCallback(() => {
    setIsOpen(false);
    setPreviewZoneId(null);
    setQuery('');

    const trigger = triggerRef.current;
    const position = restorePositionRef.current;
    const focusTrigger = () => trigger?.focus({ preventScroll: true });
    const scheduler = restorationSchedulerRef.current;

    if (scheduler) {
      scheduler.schedule({ focus: focusTrigger, position });
      return;
    }

    focusTrigger();
    window.requestAnimationFrame(() => {
      window.scrollTo({ ...position, behavior: 'auto' });
    });
  }, []);

  const openPicker = useCallback(() => {
    restorationSchedulerRef.current?.cancel();
    restorePositionRef.current = { left: window.scrollX, top: window.scrollY };
    setPreviewZoneId(selectedZoneId);
    setIsOpen(true);

    window.requestAnimationFrame(() => {
      if (window.matchMedia('(max-width: 767px)').matches) {
        rootRef.current?.scrollIntoView({ block: 'start', behavior: 'auto' });
      }
      window.requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true }));
    });
  }, [selectedZoneId]);

  const selectZone = useCallback(
    (option: TimezoneOption) => {
      setSelectedZoneId(option.id);
      closePicker();
    },
    [closePicker],
  );

  useEffect(() => {
    setCanApplyDST(true);
    const scheduler = createBrowserViewportRestorationScheduler();
    restorationSchedulerRef.current = scheduler;

    return () => {
      scheduler.cancel();
      if (restorationSchedulerRef.current === scheduler) {
        restorationSchedulerRef.current = null;
      }
    };
  }, []);

  useLayoutEffect(() => {
    if (!isOpen) return;

    measureAvailableResults();
    const frame = window.requestAnimationFrame(measureAvailableResults);
    const viewport = window.visualViewport;
    const observer = new ResizeObserver(measureAvailableResults);
    if (rootRef.current) observer.observe(rootRef.current);

    viewport?.addEventListener('resize', measureAvailableResults);
    viewport?.addEventListener('scroll', measureAvailableResults);
    window.addEventListener('resize', measureAvailableResults);

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      viewport?.removeEventListener('resize', measureAvailableResults);
      viewport?.removeEventListener('scroll', measureAvailableResults);
      window.removeEventListener('resize', measureAvailableResults);
    };
  }, [isOpen, measureAvailableResults]);

  useEffect(() => {
    if (!isOpen) return;

    const dismissOnPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) closePicker();
    };

    document.addEventListener('pointerdown', dismissOnPointerDown);
    return () => document.removeEventListener('pointerdown', dismissOnPointerDown);
  }, [closePicker, isOpen]);

  return (
    <section
      ref={rootRef}
      data-timezone-instrument
      aria-label="Selected time zone"
      className="scroll-mt-3 rounded-[1.25rem] border border-border/75 bg-card p-4 text-card-foreground shadow-[0_16px_38px_rgba(24,24,26,0.11)] sm:p-5 dark:shadow-[0_16px_38px_rgba(0,0,0,0.3)]"
    >
      <div
        data-selected-time-readout
        aria-live={isOpen ? 'off' : 'polite'}
        className="flex min-w-0 flex-col gap-4 rounded-2xl border border-border/70 bg-background/55 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.24)] sm:flex-row sm:items-end sm:justify-between sm:p-5"
      >
        <div className="min-w-0">
          <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.17em] text-muted-foreground">
            {isPreviewing ? 'Preview time' : 'Selected time'}
          </p>
          <div className="mt-2 flex flex-wrap items-end gap-x-3 gap-y-1">
            <p
              data-converted-time
              className="font-mono text-5xl font-semibold tabular-nums tracking-[-0.05em] sm:text-6xl"
            >
              {formatTime(displayTime.hours, displayTime.minutes)}
            </p>
            <p className="pb-1 font-mono text-sm font-medium tabular-nums text-muted-foreground">
              {displayOption.abbreviation}
            </p>
          </div>
        </div>

        <div className="min-w-0 sm:max-w-[24rem] sm:text-right">
          <p className="truncate text-base font-medium text-foreground sm:text-lg">
            {displayOption.label}
          </p>
          <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground sm:justify-end">
            <span className="font-mono tabular-nums">{formatOffset(displayOffset)}</span>
            <span aria-hidden="true">·</span>
            <span data-converted-day-offset>{formatDayOffset(displayTime.dayOffset)}</span>
            {displayOption.dst ? (
              <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-semibold text-amber-700 dark:text-amber-400">
                DST
              </span>
            ) : null}
          </p>
        </div>
      </div>

      <div className="mt-3 min-w-0">
        <button
          ref={triggerRef}
          data-timezone-trigger
          type="button"
          aria-expanded={isOpen}
          aria-controls="timezone-picker-results"
          onClick={() => (isOpen ? closePicker() : openPicker())}
          className="flex min-h-16 w-full min-w-0 items-center gap-3 rounded-2xl border border-border/75 bg-background/55 px-4 py-3 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.24)] transition-[background-color,border-color,box-shadow] hover:border-border hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/65 bg-card">
            <Search className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-base font-medium text-foreground">
              {isOpen ? 'Hide time zone search' : 'Choose a time zone'}
            </span>
            <span className="mt-0.5 block truncate text-sm text-muted-foreground">
              Search by city, abbreviation, or UTC offset
            </span>
          </span>
          <span className="shrink-0 rounded-lg border border-border/65 bg-card px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            {isOpen ? 'Esc' : 'Change'}
          </span>
        </button>

        {isOpen ? (
          <div
            id="timezone-picker-results"
            data-timezone-picker
            className="mt-3 overflow-hidden rounded-2xl border border-border/75 bg-popover text-popover-foreground shadow-[0_22px_52px_rgba(20,20,24,0.2)]"
          >
            <Command
              loop
              value={previewZoneId ?? undefined}
              onValueChange={setPreviewZoneId}
              className="rounded-2xl bg-popover [&_[cmdk-input-wrapper]]:px-4 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5"
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  event.preventDefault();
                  event.stopPropagation();
                  closePicker();
                  return;
                }
                if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                  window.requestAnimationFrame(keepActiveOptionVisible);
                }
              }}
            >
              <CommandInput
                ref={inputRef}
                value={query}
                onValueChange={setQuery}
                placeholder="Type a city, time zone, abbreviation, or UTC offset"
                aria-label="Search time zones"
                className="h-14 text-base"
              />
              <CommandList
                ref={listRef}
                data-timezone-results
                className="max-h-none overscroll-contain scroll-auto"
                style={{ maxHeight: resultMaxHeight }}
              >
                <CommandEmpty>No time zone found.</CommandEmpty>
                <CommandGroup className="p-2">
                  {TIMEZONE_OPTIONS.map((option) => {
                    const adjustedOffset = getAdjustedOffset(option, canApplyDST);
                    return (
                      <CommandItem
                        key={option.id}
                        value={option.id}
                        keywords={[
                          option.label,
                          option.abbreviation,
                          formatOffset(adjustedOffset),
                          formatSearchOffset(adjustedOffset),
                        ]}
                        onSelect={() => selectZone(option)}
                        className="min-h-14 items-center justify-between gap-4 rounded-xl px-3 py-3 sm:px-4"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-base font-medium">{option.label}</span>
                          <span className="mt-1 block text-xs text-muted-foreground">
                            <span className="font-mono tabular-nums">{option.abbreviation}</span>
                            {option.dst ? ' · observes daylight saving time' : ''}
                          </span>
                        </span>
                        <span className="shrink-0 rounded-lg bg-muted/65 px-2 py-1 font-mono text-xs tabular-nums text-muted-foreground">
                          {formatOffset(adjustedOffset)}
                        </span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
                <div className="border-t px-4 py-3 text-xs leading-relaxed text-muted-foreground">
                  Offsets reflect the current daylight-saving period.
                </div>
              </CommandList>
            </Command>
          </div>
        ) : null}
      </div>
    </section>
  );
}
