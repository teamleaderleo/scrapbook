'use client';

import type { PointerEvent, ReactNode } from 'react';
import { useEffect, useRef } from 'react';

import { cn } from '@/lib/utils';

const restTransform = 'perspective(900px) translate3d(0, 0, 0) rotateX(0deg) rotateY(0deg)';

export function WindLiftCard({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  const frame = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (frame.current !== null) window.cancelAnimationFrame(frame.current);
    };
  }, []);

  const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const writeTransform = (
    element: HTMLAnchorElement,
    transform: string,
    sheenX = '50%',
    sheenY = '50%',
  ) => {
    if (frame.current !== null) window.cancelAnimationFrame(frame.current);
    frame.current = window.requestAnimationFrame(() => {
      element.style.transform = transform;
      element.style.setProperty('--sheen-x', sheenX);
      element.style.setProperty('--sheen-y', sheenY);
    });
  };

  const settle = (element: HTMLAnchorElement) => {
    writeTransform(element, restTransform);
  };

  const lift = (element: HTMLAnchorElement) => {
    if (reduceMotion()) return;
    writeTransform(
      element,
      'perspective(900px) translate3d(0, -9px, 0) rotateX(0deg) rotateY(0deg)',
    );
  };

  const handlePointerMove = (event: PointerEvent<HTMLAnchorElement>) => {
    if (reduceMotion() || event.pointerType === 'touch') return;

    const rect = event.currentTarget.getBoundingClientRect();
    const localX = (event.clientX - rect.left) / rect.width;
    const localY = (event.clientY - rect.top) / rect.height;
    const horizontal = (localX - 0.5) * 2;
    const vertical = (localY - 0.5) * 2;
    const x = horizontal * 7;
    const y = -10 - Math.abs(horizontal) * 2;
    const rotateX = vertical * -9;
    const rotateY = horizontal * 11;

    writeTransform(
      event.currentTarget,
      `perspective(900px) translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`,
      `${Math.round(localX * 100)}%`,
      `${Math.round(localY * 100)}%`,
    );
  };

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      onPointerEnter={(event) => lift(event.currentTarget)}
      onPointerMove={handlePointerMove}
      onPointerLeave={(event) => settle(event.currentTarget)}
      onPointerCancel={(event) => settle(event.currentTarget)}
      onFocus={(event) => lift(event.currentTarget)}
      onBlur={(event) => settle(event.currentTarget)}
      style={{
        transform: restTransform,
        transformStyle: 'preserve-3d',
        transition: 'transform 260ms cubic-bezier(0.2, 0.85, 0.25, 1.15)',
        willChange: 'transform',
      }}
      className={cn(
        'group relative block overflow-hidden rounded-2xl border border-black/12 bg-[#d8d3c8] p-4 shadow-[0_8px_18px_rgb(45_39_30/0.08)] transition-[border-color,box-shadow] duration-150 hover:border-black/20 hover:shadow-[0_26px_52px_rgb(45_39_30/0.2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/65 focus-visible:ring-offset-2 focus-visible:ring-offset-[#e4e0d7] dark:border-white/12 dark:bg-[#282b30] dark:shadow-[0_8px_18px_rgb(0_0_0/0.22)] dark:hover:border-white/20 dark:hover:shadow-[0_28px_58px_rgb(0_0_0/0.48)] dark:focus-visible:ring-white/80 dark:focus-visible:ring-offset-[#1b1d21] motion-reduce:!transform-none motion-reduce:transition-none',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 mix-blend-soft-light transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
        style={{
          background:
            'radial-gradient(circle at var(--sheen-x, 50%) var(--sheen-y, 50%), rgb(255 255 255 / 0.42), transparent 48%)',
        }}
      />
      <div className="relative">{children}</div>
    </a>
  );
}
