import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

export function PageCurl({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute bottom-0 right-0 h-8 w-8 overflow-hidden rounded-tl-[1.15rem]',
        className,
      )}
    >
      <span className="absolute bottom-[-1px] right-[-1px] h-8 w-8 bg-[linear-gradient(135deg,transparent_0_49%,hsl(var(--material-paper-edge)/0.3)_50%_54%,hsl(var(--material-paper-face))_55%)] shadow-[-3px_-3px_8px_hsl(var(--material-steel-shadow)/0.08)]" />
    </span>
  );
}

export function StitchedRule({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'block h-px w-full opacity-55 [background-image:repeating-linear-gradient(90deg,hsl(var(--material-paper-edge)/0.9)_0_4px,transparent_4px_8px)]',
        className,
      )}
    />
  );
}

export function PressedSprig({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 64 88"
      className={cn('pointer-events-none h-20 w-14 text-[#8f9b78] opacity-55 dark:text-[#aeb899]', className)}
      fill="none"
    >
      <path d="M31 82C30 58 35 34 50 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M35 58c-12-1-19-7-22-17 11 0 19 5 22 17Z" fill="currentColor" fillOpacity="0.32" stroke="currentColor" strokeWidth="1" />
      <path d="M40 43c9-4 15-11 16-21-9 2-15 9-16 21Z" fill="currentColor" fillOpacity="0.28" stroke="currentColor" strokeWidth="1" />
      <path d="M31 69c-8-2-14-7-17-15 8 0 14 5 17 15Z" fill="currentColor" fillOpacity="0.22" stroke="currentColor" strokeWidth="1" />
      <circle cx="50" cy="9" r="4" fill="#c9928d" fillOpacity="0.6" />
      <circle cx="44" cy="16" r="2.5" fill="#d2aa75" fillOpacity="0.65" />
    </svg>
  );
}

export function CozyNote({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <aside
      className={cn(
        'material-paper relative overflow-hidden rounded-lg border px-3 py-2.5 text-left shadow-[0_5px_14px_rgba(52,45,36,0.09)]',
        className,
      )}
    >
      <span className="material-tape-strip !left-4 !top-[-0.38rem] !w-8 !translate-x-0 !rotate-[-3deg]" data-side="top" aria-hidden="true" />
      <p className="font-mono text-[8px] font-bold uppercase tracking-[0.15em] opacity-55">{label}</p>
      <p className="mt-1 text-[11px] leading-4 opacity-75">{children}</p>
      <PageCurl className="h-5 w-5 opacity-75 [&>span]:h-5 [&>span]:w-5" />
    </aside>
  );
}
