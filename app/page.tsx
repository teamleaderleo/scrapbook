import { RecentItems } from '@/components/discovery/recent-items';
import { HomeTools } from '@/components/home/home-tools';
import { HomeNowShelf } from '@/components/home/home-now-shelf';
import { OperatorConsole } from '@/components/operator/operator-console';
import ViewportPageShell from '@/components/viewport-page-shell';
import { featuredRepositories } from '@/lib/featured-repositories';
import { homeRoomNavigationItems } from '@/lib/site-navigation';
import {
  ArrowRight,
  ArrowUpRight,
  Compass,
  Hammer,
  Images,
  NotebookPen,
  Orbit,
  Palette,
  Snowflake,
  type LucideIcon,
} from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Leo · Scrapbook',
  description:
    'Operator tools, current writing and learning, code practice, and Scrapbook rooms.',
  alternates: { canonical: '/' },
};

const homeRoomIcons: Record<string, LucideIcon> = {
  space: Orbit,
  work: Hammer,
  gallery: Images,
  journal: NotebookPen,
  atelier: Palette,
  'snow-globe': Snowflake,
};

function HomeRepositories() {
  return (
    <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
      <section
        aria-labelledby="home-repositories-title"
        className="min-w-0"
        data-recent-systems
      >
        <div className="mb-2 flex items-baseline justify-between gap-4 px-0.5">
          <h2
            id="home-repositories-title"
            className="font-mono text-[9px] font-semibold uppercase tracking-[0.17em] text-muted-foreground"
          >
            Repositories
          </h2>
          <a
            href="https://github.com/teamleaderleo"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            GitHub
          </a>
        </div>
        <div className="grid min-w-0 overflow-hidden rounded-xl border border-border/65 bg-card/70 sm:grid-cols-2">
          {featuredRepositories.map((repository, index) => (
            <a
              key={repository.name}
              href={repository.url}
              target="_blank"
              rel="noreferrer"
              data-home-repository={repository.name}
              className="group flex min-w-0 min-h-16 items-start gap-3 border-border/55 px-3 py-2.5 transition-colors hover:bg-muted/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring [&:nth-child(n+2)]:border-t sm:[&:nth-child(2)]:border-t-0 sm:[&:nth-child(even)]:border-l"
            >
              <span className="w-5 shrink-0 font-mono text-[9px] tabular-nums text-muted-foreground">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block break-words text-sm font-semibold tracking-tight">
                  {repository.name}
                </span>
                <span className="mt-1 block whitespace-normal break-words text-xs leading-5 text-muted-foreground">
                  {repository.note}
                </span>
              </span>
              <ArrowUpRight
                size={14}
                className="shrink-0 text-muted-foreground transition-transform duration-150 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground"
              />
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}

function HomeRoomShelf() {
  return (
    <section
      aria-labelledby="explore-scrapbook-title"
      className="min-w-0 md:hidden"
      data-home-room-shelf
    >
      <div className="px-0.5">
        <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.17em] text-muted-foreground">
          Explore
        </p>
        <h2
          id="explore-scrapbook-title"
          className="mt-1 text-lg font-semibold tracking-tight"
        >
          Open a room
        </h2>
      </div>

      <div className="-mx-4 mt-2.5 grid snap-x snap-mandatory grid-flow-col auto-cols-[10.5rem] gap-2.5 overflow-x-auto px-4 pb-2">
        {homeRoomNavigationItems.map(destination => {
          const Icon = homeRoomIcons[destination.id] ?? Compass;
          return (
            <Link
              key={destination.id}
              href={destination.href}
              prefetch
              data-home-room-link={destination.id}
              className="group flex min-h-28 snap-start flex-col justify-between rounded-2xl border border-border/65 bg-card p-3.5 text-card-foreground shadow-[0_8px_20px_rgba(35,31,26,0.07)] transition-[border-color,background-color,box-shadow] hover:border-foreground/25 hover:bg-card/95 hover:shadow-[0_14px_30px_rgba(35,31,26,0.11)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:shadow-[0_8px_20px_rgba(0,0,0,0.22)]"
            >
              <span className="grid h-10 w-10 place-items-center rounded-xl border border-border/70 bg-background/60">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="flex items-center justify-between gap-2 font-semibold">
                {destination.label}
                <ArrowRight
                  className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export default function Page() {
  return (
    <ViewportPageShell
      className="relative bg-background text-foreground"
      contentClassName="relative min-h-[calc(100dvh-3rem)] overflow-x-hidden text-inherit"
    >
      <div
        aria-hidden="true"
        className={`${styles.paperGrid} pointer-events-none absolute inset-0`}
        data-home-paper-grid
      />

      <div className="relative mx-auto flex min-h-[calc(100dvh-3rem)] w-full max-w-7xl flex-col justify-start gap-10 px-4 py-5 sm:px-6 sm:py-7 lg:px-8 lg:py-8">
        <OperatorConsole mode="featured" />

        <div className="flex min-w-0 flex-col gap-6 sm:gap-8">
          <RecentItems />
          <Suspense fallback={null}>
            <HomeNowShelf />
          </Suspense>
          <HomeTools />
          <HomeRepositories />

          <HomeRoomShelf />
        </div>
      </div>
    </ViewportPageShell>
  );
}
