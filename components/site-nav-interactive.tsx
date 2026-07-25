'use client';

import { DiscordIcon } from '@/components/icons/discord-icon';
import { ThemeToggle } from '@/components/theme-toggle';
import { ChevronDown, Clock3 } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

export function TimeLink() {
  const [time, setTime] = useState('--:--');

  useEffect(() => {
    const updateTime = () => {
      setTime(
        new Intl.DateTimeFormat(undefined, {
          hour: '2-digit',
          minute: '2-digit',
        }).format(new Date()),
      );
    };

    updateTime();
    const interval = window.setInterval(updateTime, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <Link
      href="/time"
      className="group flex shrink-0 items-center gap-1.5 rounded-full border bg-muted/40 px-2 py-1 text-xs font-semibold text-muted-foreground shadow-sm transition hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      title="Open the time converter"
      aria-label={`Open the time converter. Local time ${time}`}
    >
      <Clock3 size={13} className="hidden sm:block" />
      <span className="font-mono tabular-nums">{time}</span>
    </Link>
  );
}

export function NavMenu({ label, children }: { label: string; children: ReactNode }) {
  const detailsRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const closeOnOutsideTap = (event: PointerEvent) => {
      const details = detailsRef.current;
      if (!details?.open) return;
      if (event.target instanceof Node && details.contains(event.target)) return;
      details.open = false;
    };

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && detailsRef.current?.open) {
        detailsRef.current.open = false;
      }
    };

    document.addEventListener('pointerdown', closeOnOutsideTap);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideTap);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

  return (
    <details ref={detailsRef} className="group relative min-w-0">
      <summary className="flex cursor-pointer list-none items-center gap-1 rounded-full px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
        <span>{label}</span>
        <ChevronDown size={14} className="transition-transform group-open:rotate-180" />
      </summary>
      <div className="absolute right-0 top-full z-50 mt-2 w-56 max-w-[calc(100vw-1rem)] overflow-hidden rounded-xl border bg-background/96 p-1 shadow-xl backdrop-blur">
        {children}
      </div>
    </details>
  );
}

async function copyDiscord() {
  await navigator.clipboard.writeText('teamleaderleo');
  toast.success('Discord username copied', { description: 'teamleaderleo' });
}

const discordHover =
  'hover:text-[#91889b] focus:text-[#91889b] dark:hover:text-[#cbc4d2] dark:focus:text-[#cbc4d2]';

export function DiscordButton({ menu = false }: { menu?: boolean }) {
  return (
    <button
      onClick={() => void copyDiscord()}
      className={
        menu
          ? `flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-muted focus:bg-muted focus:outline-none ${discordHover}`
          : `flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors focus:outline-none ${discordHover}`
      }
      type="button"
    >
      <DiscordIcon className="h-4 w-4 shrink-0" />
      <span>discord</span>
    </button>
  );
}

export function NavThemeToggle() {
  return <ThemeToggle />;
}
