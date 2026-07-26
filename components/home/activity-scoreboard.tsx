'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';

function countdownToUtcMidnight() {
  const now = new Date();
  const midnight = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
  const seconds = Math.max(0, Math.floor((midnight - now.getTime()) / 1000));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  return [hours, minutes, remainder].map((part) => String(part).padStart(2, '0')).join(':');
}

function StaticHalf({ digit, half }: { digit: string; half: 'top' | 'bottom' }) {
  return (
    <span
      aria-hidden="true"
      className={`absolute inset-x-0 h-1/2 overflow-hidden ${half === 'top' ? 'top-0' : 'bottom-0'}`}
    >
      <span
        className={`absolute inset-x-0 flex h-[200%] items-center justify-center tabular-nums ${half === 'top' ? 'top-0' : 'bottom-0'}`}
      >
        {digit}
      </span>
    </span>
  );
}

function SplitFlapDigit({ digit, index }: { digit: string; index: number }) {
  const reduceMotion = useReducedMotion();
  const [current, setCurrent] = useState(digit);
  const [previous, setPrevious] = useState(digit);
  const [sequence, setSequence] = useState(0);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (digit === current) return;
    setPrevious(current);
    setCurrent(digit);
    setSequence((value) => value + 1);
    setAnimating(!reduceMotion);
  }, [current, digit, reduceMotion]);

  const stagger = (3 - index) * 0.035;

  return (
    <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
      <StaticHalf digit={current} half="top" />
      <StaticHalf digit={current} half="bottom" />

      {animating ? (
        <>
          <motion.span
            key={`depart-${sequence}`}
            aria-hidden="true"
            className="absolute inset-x-0 top-0 z-20 h-1/2 origin-bottom overflow-hidden bg-[#1b1c20] shadow-[inset_0_1px_0_rgba(255,255,255,0.05),inset_0_-8px_12px_rgba(0,0,0,0.2)] [backface-visibility:hidden] [transform-style:preserve-3d]"
            initial={{ rotateX: 0 }}
            animate={{ rotateX: -90 }}
            transition={{ duration: 0.22, delay: stagger, ease: [0.55, 0.06, 0.68, 0.19] }}
          >
            <span className="absolute inset-x-0 top-0 flex h-[200%] items-center justify-center tabular-nums">
              {previous}
            </span>
          </motion.span>
          <motion.span
            key={`arrive-${sequence}`}
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 z-30 h-1/2 origin-top overflow-hidden bg-[#15161a] shadow-[inset_0_8px_12px_rgba(0,0,0,0.34)] [backface-visibility:hidden] [transform-style:preserve-3d]"
            initial={{ rotateX: 90 }}
            animate={{ rotateX: 0 }}
            transition={{ duration: 0.28, delay: stagger + 0.19, ease: [0.22, 1, 0.36, 1] }}
            onAnimationComplete={() => setAnimating(false)}
          >
            <span className="absolute inset-x-0 bottom-0 flex h-[200%] items-center justify-center tabular-nums">
              {current}
            </span>
          </motion.span>
        </>
      ) : null}

      <span aria-hidden="true" className="absolute inset-x-0 top-1/2 z-40 h-px bg-black/80" />
      <span aria-hidden="true" className="absolute inset-x-0 top-1/2 z-40 h-px -translate-y-px bg-white/[0.05]" />
      <span aria-hidden="true" className="absolute left-1 top-1/2 z-50 h-1.5 w-1 -translate-y-1/2 rounded-sm bg-black/65 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]" />
      <span aria-hidden="true" className="absolute right-1 top-1/2 z-50 h-1.5 w-1 -translate-y-1/2 rounded-sm bg-black/65 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]" />
    </span>
  );
}

function ScoreDigits({ value }: { value: number }) {
  const digits = useMemo(
    () => String(Math.max(0, Math.floor(value))).slice(-4).padStart(4, '0').split(''),
    [value],
  );
  const digitRefs = useRef<Array<HTMLDivElement | null>>([]);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
    };
  }, []);

  const resetDigits = () => {
    if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
    frameRef.current = window.requestAnimationFrame(() => {
      for (const digit of digitRefs.current) {
        if (digit) digit.style.transform = 'translate3d(0, 0, 0) rotateX(0deg) rotateY(0deg)';
      }
    });
  };

  const moveDigits = (clientX: number, clientY: number, currentTarget: HTMLElement) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const containerRect = currentTarget.getBoundingClientRect();
    const influenceRadius = Math.max(90, containerRect.width * 0.55);

    if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
    frameRef.current = window.requestAnimationFrame(() => {
      for (const digit of digitRefs.current) {
        if (!digit) continue;
        const rect = digit.getBoundingClientRect();
        const centreX = rect.left + rect.width / 2;
        const centreY = rect.top + rect.height / 2;
        const deltaX = clientX - centreX;
        const deltaY = clientY - centreY;
        const distance = Math.hypot(deltaX, deltaY);
        const influence = Math.max(0, 1 - distance / influenceRadius);
        const moveX = Math.max(-1, Math.min(1, deltaX / Math.max(rect.width, 1))) * influence * 1.8;
        const moveY = Math.max(-1, Math.min(1, deltaY / Math.max(rect.height, 1))) * influence * 1.3;
        const rotateX = -moveY * 0.45;
        const rotateY = moveX * 0.45;

        digit.style.transform = `translate3d(${moveX.toFixed(2)}px, ${moveY.toFixed(2)}px, 0) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`;
      }
    });
  };

  return (
    <div
      className="flex min-w-0 touch-pan-y gap-1.5 [perspective:720px]"
      aria-label={`${value} contributions today`}
      onPointerMove={(event) => moveDigits(event.clientX, event.clientY, event.currentTarget)}
      onPointerDown={(event) => moveDigits(event.clientX, event.clientY, event.currentTarget)}
      onPointerLeave={resetDigits}
      onPointerCancel={resetDigits}
      onPointerUp={resetDigits}
    >
      {digits.map((digit, index) => (
        <div
          key={index}
          ref={(element) => {
            digitRefs.current[index] = element;
          }}
          data-activity-digit
          className="relative aspect-[0.78] min-w-0 flex-1 overflow-hidden rounded-[0.45rem] border border-white/10 bg-[#17181b] px-1 font-mono text-[clamp(1.8rem,6.5vw,3.4rem)] font-semibold leading-none text-[#f1efe9] shadow-[inset_0_1px_0_rgba(255,255,255,0.05),inset_0_-10px_18px_rgba(0,0,0,0.28),0_4px_10px_rgba(0,0,0,0.14)] transition-transform duration-150 ease-out [transform-style:preserve-3d] motion-reduce:transform-none"
          style={{ transform: 'translate3d(0, 0, 0) rotateX(0deg) rotateY(0deg)' }}
        >
          <SplitFlapDigit digit={digit} index={index} />
        </div>
      ))}
    </div>
  );
}

export function ActivityScoreboard({
  today,
  weekTotal,
  yearTotal,
}: {
  today: number;
  weekTotal: number;
  yearTotal: number | null;
}) {
  const [countdown, setCountdown] = useState('--:--:--');

  useEffect(() => {
    const update = () => setCountdown(countdownToUtcMidnight());
    update();
    const interval = window.setInterval(update, 1000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <section className="h-full overflow-hidden rounded-[1.1rem] border border-black/15 bg-[#d8d5ce] shadow-[0_12px_28px_rgba(24,24,26,0.1)] dark:border-white/12 dark:bg-[#202126] dark:shadow-[0_14px_34px_rgba(0,0,0,0.26)]">
      <div className="border-b border-black/15 bg-[#c9c6bf] px-3 py-1.5 dark:border-white/10 dark:bg-[#18191d]">
        <div className="flex items-center justify-between gap-3 font-mono text-[9px] font-semibold uppercase tracking-[0.15em] text-black/60 dark:text-white/58">
          <span>Today</span>
          <span className="tabular-nums">UTC reset {countdown}</span>
        </div>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3 p-3">
        <ScoreDigits value={today} />
        <div className="grid min-w-[4.6rem] gap-2 pb-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-black/52 dark:text-white/48">
          <span className="grid gap-0.5">
            <span>7D</span>
            <strong className="text-sm font-semibold leading-none text-black/80 dark:text-white/80">
              {weekTotal.toLocaleString('en-GB')}
            </strong>
          </span>
          <span className="grid gap-0.5" title="Calendar year to date, measured in UTC">
            <span>YTD</span>
            <strong className="text-sm font-semibold leading-none text-black/80 dark:text-white/80">
              {yearTotal?.toLocaleString('en-GB') ?? '—'}
            </strong>
          </span>
        </div>
      </div>
    </section>
  );
}
