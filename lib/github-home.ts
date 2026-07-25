import { unstable_cache } from 'next/cache';
import {
  dateKeyInTimeZone,
  getRecentDateKeys,
  parsePublicContributionHtml,
} from './github-activity-utils';

const GITHUB_USERNAME = 'teamleaderleo';
const FEATURED_REPOSITORIES = ['smolrunner', 'stensibly'] as const;
const CACHE_SECONDS = 300;
const HOME_WINDOW_DAYS = 35;

export type ContributionDay = {
  date: string;
  count: number;
};

export type GitHubHomeData = {
  username: string;
  source: 'public-profile' | 'public-events' | 'unavailable';
  generatedAt: string;
  total: number | null;
  periodLabel: 'this year' | 'last 35 days';
  today: number;
  weekTotal: number;
  activeDays: number;
  currentStreak: number;
  days: ContributionDay[];
  repositories: Array<{
    name: string;
    url: string;
    description: string | null;
  }>;
};

type RestEvent = {
  type: string;
  created_at: string | null;
  payload?: {
    action?: string;
    size?: number;
    distinct_size?: number;
  };
};

type RestRepository = {
  name: string;
  html_url: string;
  description: string | null;
};

type ActivitySource = GitHubHomeData['source'];
type ActivitySummary = Pick<
  GitHubHomeData,
  'total' | 'periodLabel' | 'today' | 'weekTotal' | 'activeDays' | 'currentStreak' | 'days'
>;

function daysFromCounts(counts: Map<string, number>, now: Date, length = HOME_WINDOW_DAYS) {
  return getRecentDateKeys(now, length).map((date) => ({ date, count: counts.get(date) ?? 0 }));
}

function countCurrentStreak(days: ContributionDay[]): number {
  let index = days.length - 1;

  // Keep yesterday's streak visible until the current day has activity.
  if (days[index]?.count === 0) index -= 1;

  let streak = 0;
  while (index >= 0 && days[index].count > 0) {
    streak += 1;
    index -= 1;
  }

  return streak;
}

function summarizeCounts(
  counts: Map<string, number>,
  source: ActivitySource,
  now = new Date(),
): ActivitySummary {
  const days = daysFromCounts(counts, now);
  const today = dateKeyInTimeZone(now);
  const periodLabel: GitHubHomeData['periodLabel'] =
    source === 'public-profile' ? 'this year' : 'last 35 days';
  const periodEntries =
    source === 'public-profile'
      ? [...counts.entries()].filter(([date]) => date.startsWith(today.slice(0, 4)) && date <= today)
      : days.map((day) => [day.date, day.count] as const);
  const streakDays =
    source === 'public-profile' ? daysFromCounts(counts, now, 366) : days;

  return {
    total: periodEntries.reduce((sum, [, count]) => sum + count, 0),
    periodLabel,
    today: days.at(-1)?.count ?? 0,
    weekTotal: days.slice(-7).reduce((sum, day) => sum + day.count, 0),
    activeDays: periodEntries.filter(([, count]) => count > 0).length,
    currentStreak: countCurrentStreak(streakDays),
    days,
  };
}

async function fetchPublicProfileCounts(): Promise<Map<string, number>> {
  const response = await fetch(`https://github.com/users/${GITHUB_USERNAME}/contributions`, {
    cache: 'no-store',
    headers: {
      Accept: 'text/html',
      'User-Agent': 'teamleaderleo-scrapbook',
    },
  });

  if (!response.ok) throw new Error(`GitHub contribution page returned ${response.status}`);

  const counts = parsePublicContributionHtml(await response.text());
  if (counts.size === 0) throw new Error('GitHub contribution page could not be parsed');

  return counts;
}

function eventWeight(event: RestEvent): number {
  if (event.type === 'PushEvent') {
    return Math.max(event.payload?.distinct_size ?? event.payload?.size ?? 1, 1);
  }
  if (event.type === 'PullRequestEvent') return 1;
  if (event.type === 'IssuesEvent' && event.payload?.action === 'opened') return 1;
  if (event.type === 'PullRequestReviewEvent' && event.payload?.action === 'created') return 1;
  return 0;
}

async function githubJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    cache: 'no-store',
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'teamleaderleo-scrapbook',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });

  if (!response.ok) throw new Error(`GitHub REST returned ${response.status}`);
  return (await response.json()) as T;
}

async function fetchPublicEventCounts(): Promise<Map<string, number>> {
  const events = await githubJson<RestEvent[]>(
    `https://api.github.com/users/${GITHUB_USERNAME}/events/public?per_page=100`,
  );
  const counts = new Map<string, number>();

  for (const event of events) {
    if (!event.created_at) continue;
    const weight = eventWeight(event);
    if (weight === 0) continue;
    const key = dateKeyInTimeZone(new Date(event.created_at));
    counts.set(key, (counts.get(key) ?? 0) + weight);
  }

  return counts;
}

async function fetchRepositories() {
  try {
    const repositories = await githubJson<RestRepository[]>(
      `https://api.github.com/users/${GITHUB_USERNAME}/repos?per_page=100&type=owner`,
    );

    return FEATURED_REPOSITORIES.map((name) => {
      const repository = repositories.find((candidate) => candidate.name === name);
      return {
        name,
        url: repository?.html_url ?? `https://github.com/${GITHUB_USERNAME}/${name}`,
        description: repository?.description ?? null,
      };
    });
  } catch {
    return FEATURED_REPOSITORIES.map((name) => ({
      name,
      url: `https://github.com/${GITHUB_USERNAME}/${name}`,
      description: null,
    }));
  }
}

async function loadGitHubHomeData(): Promise<GitHubHomeData> {
  const repositoriesPromise = fetchRepositories();

  try {
    const summary = summarizeCounts(await fetchPublicProfileCounts(), 'public-profile');
    return {
      username: GITHUB_USERNAME,
      source: 'public-profile',
      generatedAt: new Date().toISOString(),
      ...summary,
      repositories: await repositoriesPromise,
    };
  } catch (profileError) {
    console.error('GitHub public contribution fetch failed', profileError);
  }

  try {
    const summary = summarizeCounts(await fetchPublicEventCounts(), 'public-events');
    return {
      username: GITHUB_USERNAME,
      source: 'public-events',
      generatedAt: new Date().toISOString(),
      ...summary,
      repositories: await repositoriesPromise,
    };
  } catch (eventError) {
    console.error('GitHub public event fetch failed', eventError);
    const summary = summarizeCounts(new Map(), 'unavailable');
    return {
      username: GITHUB_USERNAME,
      source: 'unavailable',
      generatedAt: new Date().toISOString(),
      ...summary,
      total: null,
      repositories: await repositoriesPromise,
    };
  }
}

const getCachedGitHubHomeData = unstable_cache(
  loadGitHubHomeData,
  ['github-homepage-v4'],
  { revalidate: CACHE_SECONDS },
);

export async function getGitHubHomeData(): Promise<GitHubHomeData> {
  return getCachedGitHubHomeData();
}
