'use client';

import { ScrapbookPet } from '@/components/home/scrapbook-pet';
import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';

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
    setAnimating(!reduceMotion && document.visibilityState === 'visible');
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
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-1/2 z-40 h-px -translate-y-px bg-white/[0.05]"
      />
      <span
        aria-hidden="true"
        className="absolute left-1 top-1/2 z-50 h-1.5 w-1 -translate-y-1/2 rounded-sm bg-black/65 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]"
      />
      <span
        aria-hidden="true"
        className="absolute right-1 top-1/2 z-50 h-1.5 w-1 -translate-y-1/2 rounded-sm bg-black/65 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]"
      />
    </span>
  );
}

function ScoreDigits({ value }: { value: number }) {
  const digits = useMemo(
    () => String(Math.max(0, Math.floor(value))).slice(-4).padStart(4, '0').split(''),
    [value],
  );

  return (
    <div
      className="flex min-w-0 gap-1.5 sm:gap-2"
      aria-label={`${value} contributions today`}
      data-wind-scoreboard
    >
      {digits.map((digit, index) => (
        <div
          key={index}
          data-activity-digit
          className={`relative aspect-[0.78] min-w-0 flex-1 overflow-hidden rounded-[0.55rem] border border-white/12 bg-[#17181b] px-1 font-mono text-[clamp(2rem,5vw,4.25rem)] font-semibold leading-none text-[#f3f0e9] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),inset_0_-10px_18px_rgba(0,0,0,0.3),0_7px_18px_rgba(0,0,0,0.2)] transition-[transform,box-shadow] duration-300 ease-out group-hover:-translate-y-1 group-hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),inset_0_-12px_20px_rgba(0,0,0,0.34),0_14px_26px_rgba(0,0,0,0.28)] motion-reduce:transition-none ${index % 2 === 0 ? 'group-hover:-rotate-[0.7deg]' : 'group-hover:rotate-[0.7deg]'}`}
          style={{ transitionDelay: `${index * 24}ms` }}
        >
          <SplitFlapDigit digit={digit} index={index} />
        </div>
      ))}
    </div>
  );
}

function Metric({ label, value, title }: { label: string; value: string; title?: string }) {
  return (
    <span
      className="grid min-h-[3.25rem] content-center gap-1 rounded-xl border border-border/65 bg-background/40 px-2.5 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.22)] transition-[transform,border-color,background-color] duration-300 group-hover:translate-x-0.5 group-hover:border-border group-hover:bg-background/55 motion-reduce:transition-none"
      title={title}
    >
      <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </span>
      <strong className="font-mono text-base font-semibold leading-none tabular-nums text-foreground sm:text-lg">
        {value}
      </strong>
    </span>
  );
}

export function ActivityScoreboard({
  today,
  weekTotal,
  yearTotal,
  updating,
}: {
  today: number;
  weekTotal: number;
  yearTotal: number | null;
  updating: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const [countdown, setCountdown] = useState('--:--:--');

  useEffect(() => {
    const update = () => setCountdown(countdownToUtcMidnight());
    update();
    const interval = window.setInterval(update, 1000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <motion.section
      initial={false}
      whileHover={
        reduceMotion
          ? undefined
          : {
              y: -5,
              rotateX: 0.7,
              rotateY: -0.65,
              scale: 1.008,
            }
      }
      transition={{ type: 'spring', stiffness: 260, damping: 22, mass: 0.72 }}
      style={{ transformPerspective: 1100, transformOrigin: '50% 55%' }}
      className="group relative flex h-full min-h-[15.5rem] flex-col overflow-hidden rounded-[1.25rem] border border-border/75 bg-card text-card-foreground shadow-[0_16px_38px_rgba(24,24,26,0.11)] transition-[border-color,box-shadow] duration-300 hover:border-border hover:shadow-[0_24px_52px_rgba(24,24,26,0.17)] dark:shadow-[0_16px_38px_rgba(0,0,0,0.3)] dark:hover:shadow-[0_26px_58px_rgba(0,0,0,0.42)] [@media(max-height:780px)]:min-h-[14.5rem]"
      data-activity-scoreboard
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 -left-[45%] z-20 w-[30%] -skew-x-12 bg-gradient-to-r from-transparent via-white/14 to-transparent opacity-0 transition-[left,opacity] duration-700 ease-out group-hover:left-[120%] group-hover:opacity-100 motion-reduce:hidden dark:via-white/[0.07]"
      />

      <div className="relative z-10 border-b border-border/70 bg-muted/70 px-4 py-2.5 transition-colors duration-300 group-hover:bg-muted/85 [@media(max-height:780px)]:py-2">
        <div className="flex items-center justify-between gap-3 font-mono text-[9px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          <span>Today</span>
          <span className="tabular-nums">UTC reset {countdown}</span>
        </div>
      </div>

      <div className="relative z-10 grid flex-1 grid-cols-[minmax(0,1fr)_minmax(5.75rem,0.36fr)] items-center gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_minmax(6.75rem,0.34fr)] sm:gap-4 sm:p-5 [@media(max-height:780px)]:gap-2.5 [@media(max-height:780px)]:p-3.5">
        <ScoreDigits value={today} />
        <div className="grid content-center gap-2">
          <Metric label="7D" value={weekTotal.toLocaleString('en-GB')} />
          <Metric
            label="1Y"
            value={yearTotal?.toLocaleString('en-GB') ?? '—'}
            title="Rolling-year total reported by GitHub's contribution calendar"
          />
          <ScrapbookPet activity={today} updating={updating} />
        </div>
      </div>
    </motion.section>
  );
}
