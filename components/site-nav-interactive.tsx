'use client';

import { SiteAtlas } from '@/components/site-atlas';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  isNavigationItemActive,
  primaryNavigationItems,
} from '@/lib/site-navigation';
import { Clock3 } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, useSyncExternalStore } from 'react';

const subscribeToHydration = () => () => {};
const getHydratedSnapshot = () => true;
const getServerSnapshot = () => false;

function TimeLink({ active }: { active: boolean }) {
  const [time, setTime] = useState('--:--');

  useEffect(() => {
    const updateTime = () => {
      setTime(
        new Intl.DateTimeFormat(undefined, {
          hour: '2-digit',
          minute: '2-digit',
        }).format(new Date())
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
      className={`group inline-flex h-12 shrink-0 items-center gap-1.5 border-r border-border/60 px-3 text-xs font-semibold transition-colors hover:bg-muted/75 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring motion-reduce:transition-none ${
        active
          ? 'bg-foreground/[0.075] text-foreground'
          : 'bg-transparent text-muted-foreground hover:text-foreground'
      }`}
      title="Open time"
      aria-label={`Open the time converter. Local time ${time}`}
    >
      <Clock3 size={13} aria-hidden="true" />
      <span className="font-mono tabular-nums">{time}</span>
    </Link>
  );
}

export function SiteNavBar() {
  const pathname = usePathname() || '/';
  const directItems = primaryNavigationItems.filter(item => item.id !== 'home');
  const ready = useSyncExternalStore(
    subscribeToHydration,
    getHydratedSnapshot,
    getServerSnapshot
  );

  return (
    <nav
      aria-label="Site navigation"
      className="sticky top-0 z-50 h-12 min-w-0 border-b border-border/70 bg-background text-foreground shadow-[0_8px_24px_rgba(20,20,24,0.06)] dark:shadow-[0_10px_28px_rgba(0,0,0,0.22)]"
      data-site-nav
      data-site-nav-ready={ready ? 'true' : undefined}
    >
      <div className="mx-auto h-full max-w-7xl border-x border-border/50">
        <div className="flex h-full min-w-0 items-center">
          <Link
            href="/"
            prefetch
            aria-current={pathname === '/' ? 'page' : undefined}
            data-site-home
            className="inline-flex h-12 min-w-0 flex-1 items-center truncate border-r border-border/60 px-3 text-sm font-bold tracking-tight transition-colors hover:bg-muted/55 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:max-w-none sm:flex-none sm:px-4 sm:text-base"
          >
            teamleaderleo
          </Link>

          <TimeLink
            active={pathname === '/time' || pathname.startsWith('/time/')}
          />

          <div className="hidden h-full min-w-0 flex-1 items-stretch justify-center sm:flex">
            {directItems.map(item => {
              const active = isNavigationItemActive(pathname, item);
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  prefetch
                  aria-current={active ? 'page' : undefined}
                  data-site-primary-link={item.id}
                  className={`relative inline-flex h-12 min-w-0 flex-1 items-center justify-center border-r border-border/45 px-2 text-xs font-medium transition-colors first:border-l focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring lg:px-4 lg:text-sm ${
                    active
                      ? 'bg-foreground/[0.07] text-foreground after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:bg-foreground'
                      : 'text-muted-foreground hover:bg-muted/65 hover:text-foreground'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="ml-auto flex h-full shrink-0 items-stretch">
            <ThemeToggle variant="rail" />
            <SiteAtlas variant="rail" />
          </div>
        </div>
      </div>
    </nav>
  );
}
