import SiteNav from '@/components/site-nav';
import { getGitHubHomeData, type ContributionDay } from '@/lib/github-home';
import {
  ArrowUpRight,
  GitCommitHorizontal,
  GitFork,
  GitPullRequest,
  Sparkles,
  Star,
} from 'lucide-react';
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'What Leo has been up to',
  description:
    'Recent GitHub contributions, public repositories, and merged pull requests from teamleaderleo.',
};

function formatNumber(value: number | null): string {
  if (value === null) return '—';
  return new Intl.NumberFormat('en-CA').format(value);
}

function formatDate(value: string | null): string {
  if (!value) return 'recently';

  return new Intl.DateTimeFormat('en-CA', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

function formatRelativeDate(value: string, referenceValue: string): string {
  const elapsedDays = Math.max(
    0,
    Math.floor(
      (new Date(referenceValue).getTime() - new Date(value).getTime()) /
        86_400_000,
    ),
  );

  if (elapsedDays === 0) return 'today';
  if (elapsedDays === 1) return 'yesterday';
  if (elapsedDays < 7) return `${elapsedDays} days ago`;

  return formatDate(value);
}

function excerpt(value: string): string {
  const cleaned = value
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/[`#>*_[\]()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) return 'A recently merged piece of work.';
  if (cleaned.length <= 220) return cleaned;
  return `${cleaned.slice(0, 217).trimEnd()}…`;
}

function activityClass(day: ContributionDay, maximum: number): string {
  if (day.count === 0) return 'bg-muted';

  const ratio = maximum === 0 ? 0 : day.count / maximum;
  if (ratio > 0.75) return 'bg-emerald-500';
  if (ratio > 0.45) return 'bg-emerald-500/75';
  if (ratio > 0.2) return 'bg-emerald-500/50';
  return 'bg-emerald-500/25';
}

function dataSourceCopy(source: 'graphql' | 'public-rest' | 'unavailable'): string {
  if (source === 'graphql') {
    return 'GitHub contribution calendar · refreshed about every 10 minutes';
  }

  if (source === 'public-rest') {
    return 'Public GitHub activity · refreshed about every 10 minutes';
  }

  return 'GitHub data is taking a nap';
}

export default async function Page() {
  const activity = await getGitHubHomeData();
  const maximumDay = Math.max(...activity.days.map((day) => day.count), 0);
  const publicRepositoriesUrl = `https://github.com/${activity.username}?tab=repositories&type=public`;

  return (
    <main className="min-h-screen bg-sidebar-background text-foreground">
      <SiteNav />

      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <header className="mb-8 max-w-3xl sm:mb-10">
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-600 dark:text-emerald-400">
            <Sparkles size={14} />
            live from github
          </div>
          <h1 className="text-balance text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
            what has Leo been up to?
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            Contributions climbing, agents running, pull requests landing. This is the
            current trail of sparks.
          </p>
        </header>

        <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="overflow-hidden rounded-3xl border bg-background p-6 shadow-sm sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {activity.stats.label} today
                </p>
                <p className="mt-2 text-7xl font-black tabular-nums tracking-[-0.08em] sm:text-8xl">
                  {formatNumber(activity.stats.today)}
                </p>
              </div>

              <Link
                href={`https://github.com/${activity.username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold text-muted-foreground transition hover:-translate-y-0.5 hover:bg-muted hover:text-foreground"
              >
                @{activity.username}
                <ArrowUpRight size={14} />
              </Link>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-muted/60 p-4">
                <p className="text-2xl font-bold tabular-nums">
                  {formatNumber(activity.stats.lastSevenDays)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">last 7 days</p>
              </div>
              <div className="rounded-2xl bg-muted/60 p-4">
                <p className="text-2xl font-bold tabular-nums">
                  {formatNumber(activity.stats.year)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {activity.stats.year === null ? 'year total with token' : 'this year'}
                </p>
              </div>
              <div className="col-span-2 rounded-2xl bg-muted/60 p-4 sm:col-span-1">
                <p className="text-2xl font-bold tabular-nums">
                  {activity.stats.streak}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">day streak</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border bg-background p-6 shadow-sm sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold">the last two weeks</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Every square wants to become greener.
                </p>
              </div>
              <GitCommitHorizontal className="text-emerald-500" size={22} />
            </div>

            <div className="mt-8 grid grid-cols-7 gap-2" aria-label="Fourteen days of GitHub activity">
              {activity.days.map((day) => (
                <div
                  key={day.date}
                  className={`aspect-square rounded-md ${activityClass(day, maximumDay)}`}
                  title={`${day.date}: ${day.count}`}
                  aria-label={`${day.date}: ${day.count}`}
                />
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between gap-4 text-xs text-muted-foreground">
              <span>{dataSourceCopy(activity.source)}</span>
              <span className="shrink-0 tabular-nums">
                {formatDate(activity.generatedAt)}
              </span>
            </div>
          </div>
        </section>

        <section className="mt-10 sm:mt-14">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                currently cooking
              </p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                featured public repositories
              </h2>
            </div>
            <Link
              href={publicRepositoriesUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
            >
              all public repositories
              <ArrowUpRight size={14} />
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {activity.featuredRepositories.map((repository) => (
              <Link
                key={repository.nameWithOwner}
                href={repository.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-3xl border bg-background p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      {repository.nameWithOwner}
                    </p>
                    <h3 className="mt-1 text-2xl font-black tracking-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                      {repository.name}
                    </h3>
                  </div>
                  <ArrowUpRight
                    className="text-muted-foreground transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground"
                    size={20}
                  />
                </div>

                <p className="mt-4 min-h-12 text-sm leading-6 text-muted-foreground">
                  {repository.description ??
                    (repository.name === 'smolrunner'
                      ? 'A careful little runner growing into serious host automation.'
                      : 'Durable coordination and communication for agents doing real work.')}
                </p>

                {repository.latestCommitMessage && (
                  <div className="mt-5 rounded-2xl bg-muted/60 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      latest commit
                    </p>
                    <p className="mt-1 text-sm font-medium">
                      {repository.latestCommitMessage}
                    </p>
                  </div>
                )}

                <div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Star size={13} /> {formatNumber(repository.stars)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <GitFork size={13} /> {formatNumber(repository.forks)}
                  </span>
                  <span>
                    updated{' '}
                    {formatRelativeDate(
                      repository.updatedAt ?? activity.generatedAt,
                      activity.generatedAt,
                    )}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-10 sm:mt-14">
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              recently merged
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              the changelog, with a pulse
            </h2>
          </div>

          {activity.recentPullRequests.length > 0 ? (
            <div className="space-y-3">
              {activity.recentPullRequests.map((pullRequest, index) => (
                <article
                  key={pullRequest.url}
                  className="rounded-2xl border bg-background p-5 shadow-sm sm:p-6"
                >
                  <div className="flex gap-4">
                    <div className="mt-0.5 hidden h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 sm:flex dark:text-emerald-400">
                      <GitPullRequest size={17} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        {index < 2 && (
                          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 font-semibold text-emerald-700 dark:text-emerald-300">
                            notable
                          </span>
                        )}
                        <Link
                          href={pullRequest.repositoryUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold hover:text-foreground"
                        >
                          {pullRequest.repository}
                        </Link>
                        <span>#{pullRequest.number}</span>
                        <span>
                          merged{' '}
                          {formatRelativeDate(
                            pullRequest.mergedAt,
                            activity.generatedAt,
                          )}
                        </span>
                      </div>

                      <Link
                        href={pullRequest.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group mt-2 inline-flex items-start gap-2 text-lg font-bold leading-6 hover:text-emerald-600 dark:hover:text-emerald-400"
                      >
                        {pullRequest.title}
                        <ArrowUpRight
                          className="mt-1 shrink-0 text-muted-foreground transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                          size={15}
                        />
                      </Link>

                      <p className="mt-3 max-w-4xl text-sm leading-6 text-muted-foreground">
                        {excerpt(pullRequest.body)}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed bg-background p-8 text-center text-sm text-muted-foreground">
              The PR feed is between refreshes. The repository links above are awake.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
