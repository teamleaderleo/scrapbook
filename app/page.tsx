import { ActivityDashboard } from '@/components/home/activity-dashboard';
import { WindLiftCard } from '@/components/home/wind-lift-card';
import ViewportPageShell from '@/components/viewport-page-shell';
import { getGitHubHomeData } from '@/lib/github-home';
import { homeRoomNavigationItems } from '@/lib/site-navigation';
import {
  ArrowRight,
  ArrowUpRight,
  Brain,
  Compass,
  Images,
  NotebookPen,
  Palette,
  Snowflake,
  type LucideIcon,
} from 'lucide-react';
import type { Metadata } from 'next';
import { cacheLife } from 'next/cache';
import Link from 'next/link';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Leo · GitHub activity',
  description: 'Recent GitHub profile contributions from teamleaderleo.',
  alternates: { canonical: '/' },
};

const repositoryNoteOverrides: Record<string, string> = {
  smolrunner:
    'Plans host work before changing anything and inspects unknown state first.',
};

const homeRoomIcons: Record<string, LucideIcon> = {
  space: Brain,
  gallery: Images,
  journal: NotebookPen,
  atelier: Palette,
  'snow-globe': Snowflake,
};

async function HomeActivityContent() {
  'use cache';
  cacheLife({ stale: 30, revalidate: 30, expire: 3_600 });

  const activity = await getGitHubHomeData();
  const initialActivity =
    activity.source === 'unavailable'
      ? {
          source: activity.source,
          today: activity.today,
          weekTotal: activity.weekTotal,
          yearTotal: activity.total,
          days: activity.days,
          unit: 'contributions',
          generatedAt: activity.generatedAt,
        }
      : {
          source: activity.source,
          today: activity.today,
          weekTotal: activity.weekTotal,
          yearTotal: activity.total,
          days: activity.days,
          unit: 'contributions',
          generatedAt: activity.generatedAt,
        };

  return (
    <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
      <header
        className="grid gap-3 border-b border-dashed border-border/75 px-0.5 pb-4 sm:grid-cols-[minmax(0,1fr)_minmax(17rem,0.58fr)] sm:items-end sm:pb-5"
        data-home-masthead
      >
        <div>
          <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Leo&apos;s public field desk
          </p>
          <h1 className="mt-2 max-w-3xl text-[clamp(2rem,5vw,4.6rem)] font-semibold leading-[0.96] tracking-[-0.055em]">
            Things still
            <span className="block text-muted-foreground">in motion.</span>
          </h1>
        </div>
        <p className="max-w-md text-sm leading-6 text-muted-foreground sm:justify-self-end sm:pb-1">
          Systems, field notes, learning trails, and one paper dinosaur keeping
          watch.
        </p>
      </header>

      <ActivityDashboard initial={initialActivity} />

      <section
        aria-label="Recent systems"
        className="min-w-0"
        data-recent-systems
      >
        <div className="flex items-center justify-between gap-4 px-0.5">
          <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.17em] text-muted-foreground">
            Recent systems
          </p>
          <span className="shrink-0 font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
            {activity.repositories.length} projects
          </span>
        </div>

        <div className="mt-2.5 grid min-w-0 grid-cols-1 gap-2.5 md:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)]">
          {activity.repositories.map((repository, index) => (
            <WindLiftCard
              key={repository.name}
              href={repository.url}
              className={
                index === 0
                  ? 'min-h-48 p-4 md:row-span-2 md:min-h-full md:p-5'
                  : 'min-h-28 p-3.5'
              }
            >
              <div
                className={`flex flex-col justify-between gap-3 ${index === 0 ? 'min-h-40 md:min-h-full' : 'min-h-20'}`}
              >
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <ArrowUpRight
                      size={15}
                      className="shrink-0 text-muted-foreground transition-transform duration-150 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground"
                    />
                  </div>
                  <h3
                    className={`mt-3 truncate font-semibold tracking-tight ${index === 0 ? 'text-2xl sm:text-3xl' : 'text-base'}`}
                  >
                    {repository.name}
                  </h3>
                  <p
                    className={`mt-2 text-muted-foreground ${index === 0 ? 'max-w-xl text-base leading-relaxed' : 'text-sm leading-snug'}`}
                  >
                    {repositoryNoteOverrides[repository.name] ??
                      repository.note}
                  </p>
                </div>
                <span className="font-mono text-[9px] uppercase tracking-[0.13em] text-muted-foreground">
                  open repository
                </span>
              </div>
            </WindLiftCard>
          ))}
        </div>
      </section>

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
    </div>
  );
}

export default async function Page() {
  const homeActivity = await HomeActivityContent();

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

      <div className="relative mx-auto flex min-h-[calc(100dvh-3rem)] w-full max-w-7xl flex-col justify-start px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6">
        {homeActivity}
      </div>
    </ViewportPageShell>
  );
}
