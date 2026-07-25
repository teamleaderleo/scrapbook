import SiteNav from '@/components/site-nav';
import { getGitHubHomeData, type ContributionDay } from '@/lib/github-home';
import { ArrowUpRight } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Leo · GitHub activity',
  description: 'Recent public GitHub activity from teamleaderleo.',
};

function activityClass(day: ContributionDay, maximum: number): string {
  if (day.count === 0) return 'bg-slate-200/70 dark:bg-slate-800';
  const ratio = maximum === 0 ? 0 : day.count / maximum;
  if (ratio > 0.75) return 'bg-violet-500/80';
  if (ratio > 0.45) return 'bg-violet-400/70';
  if (ratio > 0.2) return 'bg-violet-300/70 dark:bg-violet-500/45';
  return 'bg-violet-200/80 dark:bg-violet-500/25';
}

function formatDay(date: string): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`));
}

export default async function Page() {
  const activity = await getGitHubHomeData();
  const maximum = Math.max(...activity.days.map((day) => day.count), 0);

  return (
    <main
      className="min-h-screen bg-sidebar-background text-foreground"
      style={{
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <SiteNav />

      <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b pb-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">GitHub activity</h1>
            <p className="mt-1 text-sm text-muted-foreground">Last seven days.</p>
          </div>
          <Link
            href={`https://github.com/${activity.username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            @{activity.username}
            <ArrowUpRight size={14} />
          </Link>
        </header>

        <section className="py-8">
          <div className="flex items-baseline gap-3">
            <span className="text-5xl font-semibold tabular-nums tracking-tight sm:text-6xl">
              {activity.total ?? '—'}
            </span>
            <span className="text-sm text-muted-foreground">
              {activity.source === 'public-profile' ? 'contributions' : 'public actions'}
            </span>
          </div>

          <div className="mt-8 grid grid-cols-7 gap-2" aria-label="Seven days of GitHub activity">
            {activity.days.map((day) => (
              <div key={day.date} className="min-w-0">
                <div
                  className={`aspect-square rounded-lg ${activityClass(day, maximum)}`}
                  title={`${formatDay(day.date)}: ${day.count}`}
                  aria-label={`${formatDay(day.date)}: ${day.count}`}
                />
                <p className="mt-2 truncate text-center text-[11px] text-muted-foreground">
                  {new Intl.DateTimeFormat('en-US', { weekday: 'narrow', timeZone: 'UTC' }).format(
                    new Date(`${day.date}T00:00:00Z`),
                  )}
                </p>
                <p className="mt-0.5 text-center text-xs font-medium tabular-nums">{day.count}</p>
              </div>
            ))}
          </div>

          <p className="mt-6 text-xs text-muted-foreground">
            {activity.source === 'public-profile'
              ? 'Public GitHub contribution graph'
              : activity.source === 'public-events'
                ? 'Public GitHub events fallback'
                : 'GitHub data unavailable'}
            {' · '}cached for five minutes
          </p>
        </section>

        <section className="border-t py-8">
          <h2 className="text-sm font-medium text-muted-foreground">Current projects</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {activity.repositories.map((repository) => (
              <Link
                key={repository.name}
                href={repository.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-xl border bg-background p-4 transition hover:border-violet-300 dark:hover:border-violet-500/50"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium">{repository.name}</span>
                  <ArrowUpRight
                    size={15}
                    className="text-muted-foreground transition group-hover:text-violet-500"
                  />
                </div>
                {repository.description && (
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {repository.description}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
