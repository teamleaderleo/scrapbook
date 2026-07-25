import ViewportPageShell from '@/components/viewport-page-shell';
import { getGitHubHomeData, type ContributionDay } from '@/lib/github-home';
import { ArrowUpRight } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Leo · GitHub activity',
  description: 'Recent public GitHub activity from teamleaderleo.',
  alternates: { canonical: '/' },
};

function activityClass(day: ContributionDay, maximum: number): string {
  const base = 'ring-1 ring-inset ring-black/[0.035] dark:ring-white/[0.07]';
  if (day.count === 0) return `${base} bg-[#d7d2dc]/60 dark:bg-[#332f38]`;

  const ratio = maximum === 0 ? 0 : day.count / maximum;
  if (ratio > 0.8) return `${base} bg-white dark:bg-[#f5f2f8]`;
  if (ratio > 0.55) return `${base} bg-[#eeeaf2] dark:bg-[#c9c2d0]`;
  if (ratio > 0.3) return `${base} bg-[#ddd7e3] dark:bg-[#92899d]`;
  if (ratio > 0.12) return `${base} bg-[#cec7d6] dark:bg-[#686071]`;
  return `${base} bg-[#beb6c8] dark:bg-[#504957]`;
}

function formatDay(date: string): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`));
}

function Metric({ label, value, suffix }: { label: string; value: number; suffix?: string }) {
  return (
    <div className="rounded-xl border border-[#ddd8e4]/80 bg-white/45 px-3 py-2.5 dark:border-[#3b3542] dark:bg-white/[0.035]">
      <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums tracking-tight">
        {value}
        {suffix ? <span className="ml-1 text-xs font-normal text-muted-foreground">{suffix}</span> : null}
      </p>
    </div>
  );
}

export default async function Page() {
  const activity = await getGitHubHomeData();
  const maximum = Math.max(...activity.days.map((day) => day.count), 0);

  return (
    <ViewportPageShell
      className="relative bg-[#f7f6f9] text-foreground dark:bg-[#17151b]"
      contentClassName="relative text-foreground"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-[#ddd7e7]/65 blur-3xl dark:bg-[#403948]/35" />
        <div className="absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-[#eeeaf3]/90 blur-3xl dark:bg-[#2d2933]/60" />
      </div>

      <div
        className="relative mx-auto flex min-h-full w-full max-w-5xl flex-col justify-center px-4 py-5 sm:px-6 sm:py-7"
        style={{
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}
      >
        <div className="flex w-full flex-col gap-4 sm:gap-5">
          <header className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">GitHub activity</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Year-to-date totals and the last 35 days.
              </p>
            </div>
            <Link
              href={`https://github.com/${activity.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-1 text-sm text-muted-foreground transition hover:text-foreground"
            >
              @{activity.username}
              <ArrowUpRight size={14} />
            </Link>
          </header>

          <section className="overflow-hidden rounded-[1.75rem] border border-[#ddd8e4] bg-white/55 shadow-[0_20px_60px_rgba(70,60,82,0.08)] backdrop-blur-sm dark:border-[#39333f] dark:bg-[#211e26]/85 dark:shadow-none">
            <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
              <div className="p-5 sm:p-6">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  {activity.periodLabel}
                </p>
                <div className="mt-2 flex items-end gap-3">
                  <span className="text-5xl font-semibold tabular-nums tracking-[-0.055em] sm:text-6xl">
                    {activity.total ?? '—'}
                  </span>
                  <span className="pb-1.5 text-sm text-muted-foreground">
                    {activity.source === 'public-events' ? 'public actions' : 'contributions'}
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-2.5">
                  <Metric label="Today" value={activity.today} />
                  <Metric label="Last 7 days" value={activity.weekTotal} />
                  <Metric label="Active days" value={activity.activeDays} />
                  <Metric
                    label="Current streak"
                    value={activity.currentStreak}
                    suffix={activity.currentStreak === 1 ? 'day' : 'days'}
                  />
                </div>
              </div>

              <div className="border-t border-[#ddd8e4] bg-[#efecf3]/55 p-5 sm:p-6 lg:border-l lg:border-t-0 dark:border-[#39333f] dark:bg-[#1c1920]/65">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    Last 35 days
                  </p>
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <span>less</span>
                    <span className="h-2.5 w-2.5 rounded-[3px] bg-[#beb6c8] dark:bg-[#504957]" />
                    <span className="h-2.5 w-2.5 rounded-[3px] bg-[#ddd7e3] dark:bg-[#92899d]" />
                    <span className="h-2.5 w-2.5 rounded-[3px] bg-white ring-1 ring-inset ring-black/[0.04] dark:bg-[#f5f2f8]" />
                    <span>more</span>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-7 gap-2 sm:gap-2.5" aria-label="35 days of GitHub activity">
                  {activity.days.map((day) => (
                    <div
                      key={day.date}
                      className={`aspect-square rounded-[0.55rem] transition-transform duration-150 hover:-translate-y-0.5 ${activityClass(day, maximum)}`}
                      title={`${formatDay(day.date)}: ${day.count}`}
                      aria-label={`${formatDay(day.date)}: ${day.count}`}
                    />
                  ))}
                </div>

                <div className="mt-3 flex justify-between text-[11px] text-muted-foreground">
                  <span>{formatDay(activity.days[0]?.date ?? '')}</span>
                  <span>{formatDay(activity.days.at(-1)?.date ?? '')}</span>
                </div>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {activity.repositories.map((repository) => (
              <Link
                key={repository.name}
                href={repository.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex min-w-0 items-center justify-between gap-4 rounded-2xl border border-[#ddd8e4] bg-white/45 px-4 py-3.5 transition hover:border-[#c9c1d2] hover:bg-white/70 dark:border-[#39333f] dark:bg-[#211e26]/65 dark:hover:border-[#5b5363] dark:hover:bg-[#25212a]"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">{repository.name}</span>
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                    {repository.description ?? `github.com/${activity.username}/${repository.name}`}
                  </span>
                </span>
                <ArrowUpRight
                  size={15}
                  className="shrink-0 text-[#958c9f] transition group-hover:text-[#6f6678] dark:text-[#aaa2b2] dark:group-hover:text-[#d8d2df]"
                />
              </Link>
            ))}
          </section>

          <p className="text-xs text-muted-foreground">
            {activity.source === 'public-profile'
              ? 'Public GitHub contribution graph'
              : activity.source === 'public-events'
                ? 'Public GitHub events fallback'
                : 'GitHub data unavailable'}
            {' · '}updated every five minutes
          </p>
        </div>
      </div>
    </ViewportPageShell>
  );
}
