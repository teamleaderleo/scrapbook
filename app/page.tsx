import ViewportPageShell from '@/components/viewport-page-shell';
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
    <ViewportPageShell
      className="bg-sidebar-background text-foreground"
      contentClassName="text-foreground"
    >
      <div
        className="mx-auto flex h-full w-full max-w-4xl flex-col justify-center px-4 py-4 sm:px-6 sm:py-6"
        style={{
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}
      >
        <div className="flex max-h-full flex-col gap-5 sm:gap-6">
          <header className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">GitHub activity</h1>
              <p className="mt-1 text-sm text-muted-foreground">Last seven days.</p>
            </div>
            <Link
              href={`https://github.com/${activity.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              @{activity.username}
              <ArrowUpRight size={14} />
            </Link>
          </header>

          <section className="rounded-2xl border bg-background/80 p-4 sm:p-5">
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-semibold tabular-nums tracking-tight sm:text-5xl">
                {activity.total ?? '—'}
              </span>
              <span className="text-sm text-muted-foreground">
                {activity.source === 'public-profile' ? 'contributions' : 'public actions'}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-7 gap-2" aria-label="Seven days of GitHub activity">
              {activity.days.map((day) => (
                <div key={day.date} className="min-w-0">
                  <div
                    className={`aspect-square rounded-lg ${activityClass(day, maximum)}`}
                    title={`${formatDay(day.date)}: ${day.count}`}
                    aria-label={`${formatDay(day.date)}: ${day.count}`}
                  />
                  <p className="mt-1.5 truncate text-center text-[11px] text-muted-foreground">
                    {new Intl.DateTimeFormat('en-US', {
                      weekday: 'narrow',
                      timeZone: 'UTC',
                    }).format(new Date(`${day.date}T00:00:00Z`))}
                  </p>
                  <p className="text-center text-xs font-medium tabular-nums">{day.count}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className="grid grid-cols-2 gap-3">
              {activity.repositories.map((repository) => (
                <Link
                  key={repository.name}
                  href={repository.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between gap-3 rounded-xl border bg-background/80 px-4 py-3 transition hover:border-violet-300 dark:hover:border-violet-500/50"
                >
                  <span className="min-w-0 truncate font-medium">{repository.name}</span>
                  <ArrowUpRight
                    size={15}
                    className="shrink-0 text-muted-foreground transition group-hover:text-violet-500"
                  />
                </Link>
              ))}
            </div>
          </section>

          <p className="text-xs text-muted-foreground">
            {activity.source === 'public-profile'
              ? 'Public GitHub contribution graph'
              : activity.source === 'public-events'
                ? 'Public GitHub events fallback'
                : 'GitHub data unavailable'}
            {' · '}five-minute cache
          </p>
        </div>
      </div>
    </ViewportPageShell>
  );
}
