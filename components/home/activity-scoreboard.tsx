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
  const digits = useMemo(
    () => String(Math.max(0, Math.floor(value))).slice(-4).padStart(4, '0').split(''),
    [value],
  );
  const digitRefs = useRef<Array<HTMLSpanElement | null>>([]);
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
        const moveX = Math.max(-1, Math.min(1, deltaX / Math.max(rect.width, 1))) * influence * 2.5;
        const moveY = Math.max(-1, Math.min(1, deltaY / Math.max(rect.height, 1))) * influence * 2;
        const rotateX = -moveY * 0.55;
        const rotateY = moveX * 0.55;

        digit.style.transform = `translate3d(${moveX.toFixed(2)}px, ${moveY.toFixed(2)}px, 0) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`;
      }
    });
  };

  return (
    <div
      className="flex min-w-0 touch-pan-y gap-1.5 sm:gap-2"
      aria-label={`${value} contributions today`}
      onPointerMove={(event) => moveDigits(event.clientX, event.clientY, event.currentTarget)}
      onPointerDown={(event) => moveDigits(event.clientX, event.clientY, event.currentTarget)}
      onPointerLeave={resetDigits}
      onPointerCancel={resetDigits}
      onPointerUp={resetDigits}
    >
      {digits.map((digit, index) => (
        <span
          key={index}
          ref={(element) => {
            digitRefs.current[index] = element;
          }}
          data-activity-digit
          className="relative flex aspect-[0.76] min-w-0 flex-1 items-center justify-center overflow-hidden rounded-md border border-white/10 bg-[#17181b] px-1 font-mono text-[clamp(2.35rem,8vw,4.8rem)] font-semibold leading-none text-[#f1efe9] shadow-[inset_0_1px_0_rgba(255,255,255,0.05),inset_0_-12px_22px_rgba(0,0,0,0.25),0_4px_12px_rgba(0,0,0,0.14)] transition-transform duration-150 ease-out motion-reduce:transform-none"
          style={{ transform: 'translate3d(0, 0, 0) rotateX(0deg) rotateY(0deg)' }}
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

  useEffect(() => {
    const update = () => setCountdown(countdownToMidnight());
    update();
    const interval = window.setInterval(update, 1000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <section className="overflow-hidden rounded-[1.25rem] border border-black/15 bg-[#d8d5ce] shadow-[0_14px_34px_rgba(24,24,26,0.11)] dark:border-white/12 dark:bg-[#202126] dark:shadow-[0_16px_40px_rgba(0,0,0,0.28)]">
      <div className="border-b border-black/15 bg-[#c9c6bf] px-4 py-2 dark:border-white/10 dark:bg-[#18191d]">
        <div className="flex items-center justify-between gap-4 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-black/60 dark:text-white/58">
          <span>Today</span>
          <span className="tabular-nums">resets in {countdown}</span>
        </div>
      </div>

      <div className="grid gap-3 p-3.5 sm:p-4">
        <ScoreDigits value={today} />
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-0.5 font-mono text-[11px] uppercase tracking-[0.11em] text-black/55 dark:text-white/48">
          <span>
            7 days <strong className="ml-1 font-semibold text-black/78 dark:text-white/78">{weekTotal.toLocaleString('en-GB')}</strong>
          </span>
          <span>
            Year <strong className="ml-1 font-semibold text-black/78 dark:text-white/78">{yearTotal?.toLocaleString('en-GB') ?? '—'}</strong>
          </span>
        </div>
      </div>
    </section>
  );
}
