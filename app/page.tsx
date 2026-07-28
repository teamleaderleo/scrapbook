import { ActivityDashboard } from '@/components/home/activity-dashboard';
import { WindLiftCard } from '@/components/home/wind-lift-card';
import ViewportPageShell from '@/components/viewport-page-shell';
import { getGitHubHomeData } from '@/lib/github-home';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { connection } from 'next/server';
import { Suspense } from 'react';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Leo · GitHub activity',
  description: 'Recent GitHub profile contributions from teamleaderleo.',
  alternates: { canonical: '/' },
};

const repositoryNoteOverrides: Record<string, string> = {
  smolrunner: 'Plans host work before changing anything and inspects unknown state first.',
};

const scrapbookDestinations = [
  {
    id: 'space',
    href: '/space',
    eyebrow: 'Clipping drawer',
    label: 'Space',
    description: 'Search notes, references, code, and review queues.',
  },
  {
    id: 'journal',
    href: '/journal',
    eyebrow: 'Evidence ledger',
    label: 'Journal',
    description: 'Follow repository-backed records from the agent pod.',
  },
  {
    id: 'gallery',
    href: '/gallery',
    eyebrow: 'Object room',
    label: 'Gallery',
    description: 'Play with the projected object and meet recent visitors.',
  },
  {
    id: 'atelier',
    href: '/atelier',
    eyebrow: 'Worktable',
    label: 'Atelier',
    description: 'Try interface sketches and early navigation experiments.',
  },
] as const;

function HomeActivityFallback() {
  return (
    <div
      className="flex min-w-0 flex-col gap-4 sm:gap-5"
      aria-label="Loading GitHub activity"
      data-home-activity-loading
    >
      <div
        className="grid min-w-0 items-stretch gap-3.5 sm:gap-4"
        style={{
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 24rem), 1fr))',
        }}
      >
        <div className="min-h-[15.5rem] rounded-[1.25rem] border border-border/70 bg-card shadow-[0_16px_38px_rgba(24,24,26,0.08)] [@media(max-height:780px)]:min-h-[14.5rem]" />
        <div className="min-h-[15.5rem] rounded-[1.25rem] border border-border/70 bg-card shadow-[0_16px_38px_rgba(24,24,26,0.08)] [@media(max-height:780px)]:min-h-[14.5rem]" />
      </div>
      <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3" aria-hidden="true">
        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={index}
            className="min-h-28 rounded-[1.1rem] border border-border/65 bg-card/75"
          />
        ))}
      </div>
    </div>
  );
}

async function HomeActivityContent() {
  await connection();
  const activity = await getGitHubHomeData();
  const days = activity.days.slice(-35);
  const yearTotal = activity.periodLabel === 'last year' ? activity.total : null;

  return (
    <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
      <ActivityDashboard
        initial={{
          today: activity.today,
          weekTotal: activity.weekTotal,
          yearTotal,
          days,
          unit: 'contributions',
          generatedAt: activity.generatedAt,
        }}
      />

      <section aria-label="Recent systems" className="min-w-0" data-recent-systems>
        <div className="flex items-center justify-between gap-4 px-0.5">
          <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.17em] text-muted-foreground">
            Recent systems
          </p>
          <span className="shrink-0 font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
            {activity.repositories.length} projects
          </span>
        </div>

        <div className="mt-2.5 grid min-w-0 grid-cols-1 gap-2.5 md:grid-cols-3">
          {activity.repositories.map((repository) => (
            <WindLiftCard
              key={repository.name}
              href={repository.url}
              className="min-h-28 p-3.5"
            >
              <div className="flex min-h-20 flex-col justify-between gap-3">
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="truncate font-medium">{repository.name}</h3>
                    <ArrowUpRight
                      size={15}
                      className="shrink-0 text-muted-foreground transition-transform duration-150 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground"
                    />
                  </div>
                  <p className="mt-2 text-sm leading-snug text-muted-foreground">
                    {repositoryNoteOverrides[repository.name] ?? repository.note}
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
        <div className="flex items-end justify-between gap-4 px-0.5">
          <div>
            <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.17em] text-muted-foreground">
              Continue exploring
            </p>
            <h2 id="explore-scrapbook-title" className="mt-1 text-lg font-semibold tracking-tight">
              Pick a room in the scrapbook
            </h2>
          </div>
          <span className="hidden font-mono text-[9px] uppercase tracking-[0.13em] text-muted-foreground sm:block">
            four useful stops
          </span>
        </div>

        <div className="-mx-4 mt-2.5 grid snap-x snap-mandatory grid-flow-col auto-cols-[minmax(16rem,82vw)] gap-2.5 overflow-x-auto px-4 pb-2">
          {scrapbookDestinations.map((destination, index) => (
            <Link
              key={destination.id}
              href={destination.href}
              prefetch
              data-home-room-link={destination.id}
              className="group relative min-w-0 snap-start overflow-hidden rounded-2xl border border-border/65 bg-card p-3.5 text-card-foreground shadow-[0_8px_20px_rgba(35,31,26,0.07)] transition-[border-color,background-color,box-shadow] hover:border-foreground/25 hover:bg-card/95 hover:shadow-[0_14px_30px_rgba(35,31,26,0.11)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:shadow-[0_8px_20px_rgba(0,0,0,0.22)] dark:hover:shadow-[0_16px_34px_rgba(0,0,0,0.32)]"
            >
              <span
                aria-hidden="true"
                className="absolute right-3 top-3 font-mono text-[9px] tabular-nums text-muted-foreground/45"
              >
                {String(index + 1).padStart(2, '0')}
              </span>
              <p className="pr-8 font-mono text-[8px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                {destination.eyebrow}
              </p>
              <h3 className="mt-2 text-base font-semibold tracking-tight">{destination.label}</h3>
              <p className="mt-1.5 min-h-10 text-sm leading-snug text-muted-foreground">
                {destination.description}
              </p>
              <span className="mt-3 inline-flex items-center gap-1.5 font-mono text-[9px] font-semibold uppercase tracking-[0.13em] text-muted-foreground transition-colors group-hover:text-foreground">
                Open room
                <ArrowRight
                  size={13}
                  aria-hidden="true"
                  className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
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

      <div className="relative mx-auto flex min-h-[calc(100dvh-3rem)] w-full max-w-7xl flex-col justify-start px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6">
        <Suspense fallback={<HomeActivityFallback />}>
          <HomeActivityContent />
        </Suspense>
      </div>
    </ViewportPageShell>
  );
}
