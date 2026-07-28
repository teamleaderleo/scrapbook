import { cn } from '@/lib/utils';

export type PaperCritterKind = 'possum' | 'sparrow' | 'raccoon' | 'moth' | 'dinosaur';

export function PaperCritter({
  kind,
  className,
  label,
}: {
  kind: PaperCritterKind;
  className?: string;
  label?: string;
}) {
  return (
    <span
      role="img"
      aria-label={label ?? `A small paper ${kind}`}
      className={cn('inline-grid size-11 shrink-0 place-items-center', className)}
    >
      <svg viewBox="0 0 48 48" className="h-full w-full overflow-visible" aria-hidden="true">
        {kind === 'possum' ? <Possum /> : null}
        {kind === 'sparrow' ? <Sparrow /> : null}
        {kind === 'raccoon' ? <Raccoon /> : null}
        {kind === 'moth' ? <Moth /> : null}
        {kind === 'dinosaur' ? <Dinosaur /> : null}
      </svg>
    </span>
  );
}

function Possum() {
  return (
    <g stroke="#514d50" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round">
      <path d="M8 29c3-10 12-15 22-12 7 2 10 7 9 13-1 6-8 9-17 8-8-1-13-3-14-9Z" fill="#c8bdc6" />
      <path d="M30 18c5-7 10-8 13-4-1 5-4 8-8 10Z" fill="#eee3dc" />
      <path d="M11 31C4 30 3 23 7 20" fill="none" />
      <circle cx="37" cy="18" r="1.7" fill="#282529" stroke="none" />
      <circle cx="41" cy="22" r="1.5" fill="#d28e91" stroke="none" />
      <path d="M16 35v5M29 36v4" />
    </g>
  );
}

function Sparrow() {
  return (
    <g stroke="#544b43" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round">
      <path d="M10 29c5-12 18-15 27-7 4 4 3 10-2 14-7 5-20 2-25-7Z" fill="#d7b98b" />
      <path d="M18 25c6-6 13-5 17 2-6 1-11 5-14 9Z" fill="#a97d62" />
      <path d="m37 24 8 3-8 3Z" fill="#df9f55" />
      <circle cx="34" cy="23" r="1.7" fill="#282529" stroke="none" />
      <path d="M18 37v5M28 38v4M7 26l-4-3M8 30l-5 1" />
    </g>
  );
}

function Raccoon() {
  return (
    <g stroke="#47484b" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round">
      <path d="M11 25c0-10 7-17 17-17s17 7 17 17-7 16-17 16S11 35 11 25Z" fill="#aeb0b2" />
      <path d="m14 15-4-8 9 4M42 15l4-8-9 4" fill="#777a7f" />
      <path d="M15 22c7-8 20-8 27 0-4 8-9 11-14 11s-10-3-13-11Z" fill="#5d6065" />
      <path d="M23 32h10l-5 5Z" fill="#ece2d9" />
      <circle cx="21" cy="24" r="2" fill="#202124" stroke="none" />
      <circle cx="35" cy="24" r="2" fill="#202124" stroke="none" />
      <circle cx="28" cy="31" r="2" fill="#202124" stroke="none" />
    </g>
  );
}

function Moth() {
  return (
    <g stroke="#51495b" strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round">
      <path d="M23 18C15 7 5 9 5 22c0 8 7 13 17 9Z" fill="#cbbbd4" />
      <path d="M25 18C33 7 43 9 43 22c0 8-7 13-17 9Z" fill="#b7a8c3" />
      <path d="M24 15c4 5 4 18 0 25-4-7-4-20 0-25Z" fill="#766a7f" />
      <circle cx="15" cy="21" r="3" fill="#e8d5b1" />
      <circle cx="34" cy="21" r="3" fill="#e8d5b1" />
      <path d="M22 15 18 9M26 15l4-6" fill="none" />
    </g>
  );
}

function Dinosaur() {
  return (
    <g stroke="#4d5148" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round">
      <path d="M15 20h17c7 0 11 5 11 11H13v-5c0-3 1-5 2-6Z" fill="#c8d0ba" />
      <path d="M29 12h10c4 0 7 3 7 7v8H31l-4-5Z" fill="#e2e0c8" />
      <path d="M16 28 3 23l9 11 8-1Z" fill="#aebaa0" />
      <path d="m20 20 3-6 3 6 3-6 3 6" fill="#f4ead2" />
      <path d="M19 32v7M34 32v7" />
      <circle cx="39" cy="18" r="1.8" fill="#262923" stroke="none" />
      <circle cx="35" cy="24" r="2" fill="#d6a7ae" stroke="none" opacity="0.75" />
    </g>
  );
}
