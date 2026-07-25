'use client';

import { useEffect, useMemo, useState } from 'react';

function countdownToMidnight() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const seconds = Math.max(0, Math.floor((midnight.getTime() - now.getTime()) / 1000));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  return [hours, minutes, remainder].map((part) => String(part).padStart(2, '0')).join(':');
}

function ScoreDigits({ value }: { value: number }) {
  const digits = useMemo(() => String(Math.max(0, value)).padStart(4, '0').split(''), [value]);

  return (
    <div className="flex min-w-0 gap-1.5 sm:gap-2" aria-label={`${value} contributions today`}>
      {digits.map((digit, index) => (
        <span
          key={`${index}-${digit}`}
          className="relative flex aspect-[0.72] min-w-0 flex-1 items-center justify-center overflow-hidden rounded-md border border-white/10 bg-[#17181b] px-1 font-mono text-[clamp(2.6rem,9vw,6.9rem)] font-semibold leading-none text-[#f1efe9] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),inset_0_-18px_32px_rgba(0,0,0,0.3),0_8px_20px_rgba(0,0,0,0.15)]"
        >
          <span aria-hidden="true" className="absolute inset-x-0 top-1/2 h-px bg-black/70" />
          <span aria-hidden="true" className="absolute inset-x-0 top-1/2 h-px -translate-y-px bg-white/[0.045]" />
          <span className="relative -translate-y-[0.02em] tabular-nums">{digit}</span>
        </span>
      ))}
    </div>
  );
}

export function ActivityScoreboard({
  today,
  weekTotal,
  yearTotal,
  unit,
}: {
  today: number;
  weekTotal: number;
  yearTotal: number | null;
  unit: string;
}) {
  const [countdown, setCountdown] = useState('--:--:--');

  useEffect(() => {
    const update = () => setCountdown(countdownToMidnight());
    update();
    const interval = window.setInterval(update, 1000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <section className="overflow-hidden rounded-[1.4rem] border border-black/15 bg-[#d8d5ce] shadow-[0_22px_55px_rgba(24,24,26,0.13)] dark:border-white/12 dark:bg-[#202126] dark:shadow-[0_24px_70px_rgba(0,0,0,0.35)]">
      <div className="border-b border-black/15 bg-[#c9c6bf] px-4 py-2.5 dark:border-white/10 dark:bg-[#18191d] sm:px-5">
        <div className="flex items-center justify-between gap-4 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-black/60 dark:text-white/58">
          <span>Contribution counter</span>
          <span className="tabular-nums">rollover {countdown}</span>
        </div>
      </div>

      <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_12rem]">
        <div className="min-w-0">
          <div className="mb-2 flex items-end justify-between gap-3">
            <div>
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-black/55 dark:text-white/55">Today</p>
              <p className="mt-0.5 text-xs text-black/45 dark:text-white/42">{unit}</p>
            </div>
            <span className="rounded-full border border-black/10 bg-black/[0.045] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-black/55 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/55">
              local midnight
            </span>
          </div>
          <ScoreDigits value={today} />
        </div>

        <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
          <div className="rounded-xl border border-black/10 bg-[#ece9e2]/70 px-3 py-3 dark:border-white/10 dark:bg-white/[0.035]">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-black/48 dark:text-white/45">Last 7 days</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">{weekTotal.toLocaleString('en-US')}</p>
          </div>
          <div className="rounded-xl border border-black/10 bg-[#ece9e2]/70 px-3 py-3 dark:border-white/10 dark:bg-white/[0.035]">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-black/48 dark:text-white/45">This year</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">{yearTotal?.toLocaleString('en-US') ?? '—'}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
