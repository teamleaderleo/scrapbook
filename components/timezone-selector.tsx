'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
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
  getTimezoneSearchTerms,
  type TimezoneOption,
} from '@/lib/timezone-options';
import {
  createBrowserViewportRestorationScheduler,
  type ViewportRestorationScheduler,
} from '@/lib/visual-viewport-restoration';

interface TimezoneSelectorProps {
  utcHours: number;
  utcMinutes: number;
}

export default function TimezoneSelector({
  utcHours,
  utcMinutes,
}: TimezoneSelectorProps) {
  const [selectedZoneId, setSelectedZoneId] = useState(UTC_OPTION.id);
  const [previewZoneId, setPreviewZoneId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [canApplyDST, setCanApplyDST] = useState(false);
  const [resultMaxHeight, setResultMaxHeight] = useState(320);
  const rootRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const restorePositionRef = useRef({ left: 0, top: 0 });
  const restorationSchedulerRef = useRef<ViewportRestorationScheduler | null>(
    null
  );

  const selectedOption =
    TIMEZONE_OPTIONS.find(option => option.id === selectedZoneId) ?? UTC_OPTION;
  const previewOption =
    isOpen && previewZoneId
      ? (TIMEZONE_OPTIONS.find(option => option.id === previewZoneId) ?? null)
      : null;
  const displayOption = previewOption ?? selectedOption;
  const displayOffset = getAdjustedOffset(displayOption, canApplyDST);
  const totalMinutes = utcHours * 60 + utcMinutes + displayOffset * 60;
  const adjustedMinutes = ((totalMinutes % 1440) + 1440) % 1440;
  const displayHours = Math.floor(adjustedMinutes / 60);
  const displayMinutes = adjustedMinutes % 60;
  const isPreviewing = Boolean(
    previewOption && previewOption.id !== selectedOption.id
  );

  const measureAvailableResults = useCallback(() => {
    if (!isOpen || !listRef.current) return;

    const viewport = window.visualViewport;
    const viewportBottom = viewport
      ? viewport.offsetTop + viewport.height
      : window.innerHeight;
    const listTop = listRef.current.getBoundingClientRect().top;
    const availableHeight = Math.floor(viewportBottom - listTop - 12);
    setResultMaxHeight(Math.max(0, Math.min(360, availableHeight)));
  }, [isOpen]);

  const keepActiveOptionVisible = useCallback(() => {
    const list = listRef.current;
    const activeOption = list?.querySelector<HTMLElement>(
      '[cmdk-item][data-selected="true"]'
    );
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
      window.requestAnimationFrame(() =>
        inputRef.current?.focus({ preventScroll: true })
      );
    });
  }, [selectedZoneId]);

  const selectZone = useCallback(
    (option: TimezoneOption) => {
      setSelectedZoneId(option.id);
      closePicker();
    },
    [closePicker]
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
    return () =>
      document.removeEventListener('pointerdown', dismissOnPointerDown);
  }, [closePicker, isOpen]);

  return (
    <section
      ref={rootRef}
      data-timezone-instrument
      aria-label="Selected time zone"
      className="scroll-mt-3 rounded-2xl border border-border/70 bg-card p-3 text-card-foreground shadow-[0_14px_34px_rgba(20,20,24,0.1)] sm:p-4 lg:grid lg:grid-cols-[minmax(0,0.9fr)_minmax(18rem,1.1fr)] lg:gap-4 dark:shadow-[0_16px_38px_rgba(0,0,0,0.3)]"
    >
      <div
        data-selected-time-readout
        aria-live={isOpen ? 'off' : 'polite'}
        className="rounded-xl border border-border/70 bg-background p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.24),0_10px_24px_rgba(20,20,24,0.07)]"
      >
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {isPreviewing ? 'Preview time' : 'Selected time'}
        </p>
        <div className="mt-2 flex flex-wrap items-end gap-x-3 gap-y-1">
          <time
            dateTime={formatTime(displayHours, displayMinutes)}
            className="font-mono text-[clamp(1.875rem,15vw,3rem)] font-semibold tabular-nums tracking-[-0.05em] sm:text-6xl"
          >
            {formatTime(displayHours, displayMinutes)}
          </time>
          <p className="pb-1 font-mono text-sm font-medium tabular-nums text-muted-foreground">
            {displayOption.abbreviation}
          </p>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-xs tabular-nums text-muted-foreground">
          <span className="font-semibold text-foreground">
            {displayOption.label}
          </span>
          <span aria-hidden="true">·</span>
          <span>{formatOffset(displayOffset)}</span>
          {displayOption.dst ? (
            <span className="rounded bg-amber-500/20 px-1.5 py-0.5 font-sans text-[10px] font-semibold text-amber-700 dark:text-amber-400">
              DST
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-3 min-w-0 lg:mt-0">
        <button
          ref={triggerRef}
          data-timezone-trigger
          type="button"
          aria-expanded={isOpen}
          aria-controls="timezone-picker-results"
          onClick={() => (isOpen ? closePicker() : openPicker())}
          className="flex min-h-11 w-full items-center gap-2 rounded-xl border border-border/70 bg-background px-3 text-left text-sm font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] transition-colors hover:bg-muted motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Search
            className="h-4 w-4 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
          <span>{isOpen ? 'Hide zone search' : 'Search time zones'}</span>
          <span
            data-timezone-trigger-hint
            className="ml-auto font-mono text-[11px] uppercase tracking-[0.11em] text-muted-foreground"
          >
            {isOpen ? 'Esc' : 'Open'}
          </span>
        </button>

        {isOpen ? (
          <div
            id="timezone-picker-results"
            data-timezone-picker
            className="mt-2 overflow-hidden rounded-xl border border-border/70 bg-popover text-popover-foreground shadow-[0_18px_42px_rgba(20,20,24,0.18)]"
          >
            <Command
              loop
              value={previewZoneId ?? undefined}
              onValueChange={setPreviewZoneId}
              className="rounded-xl bg-popover"
              onKeyDown={event => {
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
                placeholder="Type a city, zone, or UTC offset"
                aria-label="Search time zones"
                className="font-mono tabular-nums"
              />
              <CommandList
                ref={listRef}
                data-timezone-results
                className="max-h-none overscroll-contain scroll-auto"
                style={{ maxHeight: resultMaxHeight }}
              >
                <CommandEmpty>No time zone found.</CommandEmpty>
                <CommandGroup>
                  {TIMEZONE_OPTIONS.map(option => {
                    const adjustedOffset = getAdjustedOffset(
                      option,
                      canApplyDST
                    );
                    return (
                      <CommandItem
                        key={option.id}
                        value={option.id}
                        keywords={[
                          option.label,
                          option.abbreviation,
                          formatOffset(adjustedOffset),
                          formatSearchOffset(adjustedOffset),
                          ...getTimezoneSearchTerms(option),
                        ]}
                        onSelect={() => selectZone(option)}
                        data-timezone-option
                        className="min-h-[44px] items-center justify-between gap-3 px-3 py-2"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm">
                            {option.label}
                          </span>
                          <span className="mt-0.5 block font-mono text-[11px] tabular-nums text-muted-foreground">
                            {option.abbreviation}
                            {option.dst ? ' · observes DST' : ''}
                          </span>
                        </span>
                        <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
                          {formatOffset(adjustedOffset)}
                        </span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
                <div className="border-t px-3 py-2 text-xs leading-5 text-muted-foreground">
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
