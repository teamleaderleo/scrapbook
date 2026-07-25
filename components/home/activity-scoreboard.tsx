'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

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
}: {
  today: number;
  weekTotal: number;
  yearTotal: number | null;
}) {
  const [countdown, setCountdown] = useState('--:--:--');
  const panelRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const update = () => setCountdown(countdownToMidnight());
    update();
    const interval = window.setInterval(update, 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    return () => {
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
    };
  }, []);

  const movePanel = (clientX: number, clientY: number, currentTarget: HTMLElement) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const rect = currentTarget.getBoundingClientRect();
    const x = Math.max(-1, Math.min(1, ((clientX - rect.left) / rect.width - 0.5) * 2));
    const y = Math.max(-1, Math.min(1, ((clientY - rect.top) / rect.height - 0.5) * 2));

    if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
    frameRef.current = window.requestAnimationFrame(() => {
      if (!panelRef.current) return;
      panelRef.current.style.transform = `perspective(900px) rotateX(${(-y * 1.4).toFixed(2)}deg) rotateY(${(x * 1.8).toFixed(2)}deg) translate3d(${(x * 1.4).toFixed(2)}px, ${(y * 1.1).toFixed(2)}px, 0)`;
    });
  };

  const resetPanel = () => {
    if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
    frameRef.current = window.requestAnimationFrame(() => {
      if (panelRef.current) panelRef.current.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) translate3d(0,0,0)';
    });
  };

  return (
    <section
      className="touch-pan-y overflow-hidden rounded-[1.4rem] border border-black/15 bg-[#d8d5ce] shadow-[0_22px_55px_rgba(24,24,26,0.13)] dark:border-white/12 dark:bg-[#202126] dark:shadow-[0_24px_70px_rgba(0,0,0,0.35)]"
      onPointerMove={(event) => movePanel(event.clientX, event.clientY, event.currentTarget)}
      onPointerDown={(event) => movePanel(event.clientX, event.clientY, event.currentTarget)}
      onPointerLeave={resetPanel}
      onPointerCancel={resetPanel}
    >
      <div
        ref={panelRef}
        className="origin-center transition-transform duration-200 ease-out motion-reduce:transform-none"
        style={{ transform: 'perspective(900px) rotateX(0deg) rotateY(0deg) translate3d(0,0,0)' }}
      >
        <div className="border-b border-black/15 bg-[#c9c6bf] px-4 py-2.5 dark:border-white/10 dark:bg-[#18191d] sm:px-5">
          <div className="flex items-center justify-between gap-4 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-black/60 dark:text-white/58">
            <span>Today</span>
            <span className="tabular-nums">rollover {countdown}</span>
          </div>
        </div>

        <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_12rem]">
          <div className="min-w-0">
            <ScoreDigits value={today} />
          </div>

          <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
            <div className="rounded-xl border border-black/10 bg-[#ece9e2]/70 px-3 py-3 dark:border-white/10 dark:bg-white/[0.035]">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-black/48 dark:text-white/45">7 days</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">{weekTotal.toLocaleString('en-US')}</p>
            </div>
            <div className="rounded-xl border border-black/10 bg-[#ece9e2]/70 px-3 py-3 dark:border-white/10 dark:bg-white/[0.035]">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-black/48 dark:text-white/45">Year</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">{yearTotal?.toLocaleString('en-US') ?? '—'}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
