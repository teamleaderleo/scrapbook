import { ActivityScoreboard } from '@/components/home/activity-scoreboard';
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
  const base = 'ring-1 ring-inset ring-black/[0.05] dark:ring-white/[0.07]';
  if (day.count === 0) return `${base} bg-[#c9c7c1] dark:bg-[#292a2f]`;

  const ratio = maximum === 0 ? 0 : day.count / maximum;
  if (ratio > 0.8) return `${base} bg-[#faf8f2] dark:bg-[#eeeaf2]`;
  if (ratio > 0.55) return `${base} bg-[#e8e2ec] dark:bg-[#c9c2d0]`;
  if (ratio > 0.3) return `${base} bg-[#d4cddb] dark:bg-[#8e8798]`;
  if (ratio > 0.12) return `${base} bg-[#bfb8c7] dark:bg-[#66606d]`;
  return `${base} bg-[#a9a3af] dark:bg-[#4b4750]`;
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
  const unit = activity.source === 'public-events' ? 'public actions' : 'contributions';

  return (
    <ViewportPageShell
      className="relative bg-[#ecebe6] text-[#17181b] dark:bg-[#101115] dark:text-[#eeeae3]"
      contentClassName="relative text-inherit"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-55 dark:opacity-20"
        style={{
          backgroundImage:
            'linear-gradient(rgba(30,30,34,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(30,30,34,0.035) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 top-20 h-72 w-72 rounded-full bg-[#d7d1df]/50 blur-3xl dark:bg-[#29262f]/45" />
        <div className="absolute -right-28 bottom-10 h-80 w-80 rounded-full bg-[#d9d6cf]/75 blur-3xl dark:bg-[#1b1c20]/70" />
      </div>

      <div className="relative mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex flex-col gap-4 sm:gap-5">
          <header className="flex items-end justify-between gap-4 border-b border-black/12 pb-3 dark:border-white/12">
            <div>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-black/48 dark:text-white/45">
                Digital scrapbook / live counter
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">GitHub activity</h1>
            </div>
            <Link
              href={`https://github.com/${activity.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-1 text-sm text-black/52 transition hover:text-black dark:text-white/52 dark:hover:text-white"
            >
              @{activity.username}
              <ArrowUpRight size={14} />
            </Link>
          </header>

          <ActivityScoreboard
            today={activity.today}
            weekTotal={activity.weekTotal}
            yearTotal={activity.total}
            unit={unit}
          />

          <section className="rounded-[1.25rem] border border-black/12 bg-[#dedcd6]/78 p-4 shadow-[0_14px_35px_rgba(24,24,26,0.07)] dark:border-white/10 dark:bg-[#18191d]/90 dark:shadow-none sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-black/48 dark:text-white/45">Recent activity</p>
                <p className="mt-0.5 text-sm text-black/58 dark:text-white/55">Last 35 days</p>
              </div>
              <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-black/45 dark:text-white/45">
                <span>less</span>
                <span className="h-2.5 w-2.5 rounded-[3px] bg-[#a9a3af]" />
                <span className="h-2.5 w-2.5 rounded-[3px] bg-[#d4cddb]" />
                <span className="h-2.5 w-2.5 rounded-[3px] bg-[#faf8f2] ring-1 ring-inset ring-black/[0.05]" />
                <span>more</span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-7 gap-2 sm:gap-2.5" aria-label="35 days of GitHub activity">
              {activity.days.map((day, index) => {
                const label = `${formatDay(day.date)} · ${day.count.toLocaleString('en-US')} ${unit}`;
                const isLatest = index === activity.days.length - 1;
                return (
                  <div key={day.date} className="group relative">
                    <div
                      tabIndex={0}
                      role="img"
                      className={`aspect-square rounded-[0.5rem] transition duration-150 hover:-translate-y-0.5 hover:scale-[1.04] focus:-translate-y-0.5 focus:scale-[1.04] focus:outline-none focus:ring-2 focus:ring-black/35 dark:focus:ring-white/45 ${activityClass(day, maximum)} ${isLatest ? 'outline outline-2 outline-offset-2 outline-black/20 dark:outline-white/25' : ''}`}
                      aria-label={label}
                    />
                    <div className="pointer-events-none absolute bottom-[calc(100%+0.45rem)] left-1/2 z-20 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-black/15 bg-[#17181b] px-2 py-1 font-mono text-[10px] text-[#f2eee7] shadow-lg group-hover:block group-focus-within:block dark:border-white/15">
                      {label}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-3 flex justify-between font-mono text-[10px] text-black/45 dark:text-white/42">
              <span>{formatDay(activity.days[0]?.date ?? '')}</span>
              <span>{formatDay(activity.days.at(-1)?.date ?? '')}</span>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {activity.repositories.map((repository) => (
              <Link
                key={repository.name}
                href={repository.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex min-w-0 items-center justify-between gap-4 rounded-xl border border-black/12 bg-[#f2f0ea]/68 px-4 py-3.5 transition hover:-translate-y-0.5 hover:border-black/25 hover:bg-[#f7f4ed] dark:border-white/10 dark:bg-[#18191d]/85 dark:hover:border-white/22 dark:hover:bg-[#1d1e23]"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">{repository.name}</span>
                  <span className="mt-0.5 block truncate text-xs text-black/48 dark:text-white/45">
                    {repository.description ?? `github.com/${activity.username}/${repository.name}`}
                  </span>
                </span>
                <ArrowUpRight size={15} className="shrink-0 text-black/35 transition group-hover:text-black/70 dark:text-white/35 dark:group-hover:text-white/75" />
              </Link>
            ))}
          </section>

          <p className="font-mono text-[10px] uppercase tracking-[0.13em] text-black/42 dark:text-white/38">
            {activity.source === 'public-profile'
              ? 'Public GitHub contribution graph'
              : activity.source === 'public-events'
                ? 'Public GitHub events fallback'
                : 'GitHub data unavailable'}
            {' · '}refreshes every five minutes
          </p>
        </div>
      </div>
    </ViewportPageShell>
  );
}
