'use client';

import { SiteAtlas } from '@/components/site-atlas';
import { ThemeToggle } from '@/components/theme-toggle';
import { isNavigationItemActive, primaryNavigationItems } from '@/lib/site-navigation';
import { Clock3 } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

function TimeLink({ active }: { active: boolean }) {
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
      prefetch
      aria-current={active ? 'page' : undefined}
      data-site-time
      className={`group inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-xs font-semibold shadow-[0_3px_10px_rgba(20,20,24,0.08)] transition-[background-color,box-shadow] hover:bg-muted hover:shadow-[0_6px_14px_rgba(20,20,24,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transition-none dark:shadow-[0_4px_12px_rgba(0,0,0,0.28)] ${
        active
          ? 'border-foreground/30 bg-foreground/[0.075] text-foreground'
          : 'border-border/70 bg-card text-foreground'
      }`}
      title="Open time"
      aria-label={`Open time. Local time ${time}`}
    >
      <Clock3 size={13} aria-hidden="true" />
      <span className="font-mono tabular-nums">{time}</span>
    </Link>
  );
}

export function SiteNavBar() {
  const pathname = usePathname() || '/';
  const directItems = primaryNavigationItems.filter((item) => item.id !== 'home');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  return (
    <nav
      aria-label="Site navigation"
      className="sticky top-0 z-50 h-12 min-w-0 border-b border-border/70 bg-background text-foreground shadow-[0_1px_0_rgba(255,255,255,0.22),0_8px_24px_rgba(20,20,24,0.08)] dark:shadow-[0_1px_0_rgba(255,255,255,0.04),0_10px_28px_rgba(0,0,0,0.28)]"
      data-site-nav
      data-site-nav-ready={ready ? 'true' : undefined}
    >
      <div className="mx-auto h-full max-w-7xl px-2 sm:px-4 lg:px-6">
        <div className="flex h-full min-w-0 items-center gap-1 sm:gap-1.5">
          <Link
            href="/"
            prefetch
            aria-current={pathname === '/' ? 'page' : undefined}
            data-site-home
            className="inline-flex h-11 min-w-0 max-w-[8.5rem] shrink items-center truncate rounded-md px-1.5 text-sm font-bold tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:max-w-none sm:text-base"
          >
            teamleaderleo
          </Link>

          <TimeLink active={pathname === '/time' || pathname.startsWith('/time/')} />

          <div className="ml-2 hidden min-w-0 flex-1 items-center justify-center gap-1 xl:flex">
            {directItems.map((item) => {
              const active = isNavigationItemActive(pathname, item);
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  prefetch
                  aria-current={active ? 'page' : undefined}
                  data-site-primary-link={item.id}
                  className={`inline-flex h-11 items-center rounded-full px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                    active
                      ? 'bg-foreground text-background'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-1">
            <ThemeToggle />
            <SiteAtlas />
          </div>
        </div>
      </div>
    </nav>
  );
}
