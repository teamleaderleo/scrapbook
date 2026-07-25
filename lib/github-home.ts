import { unstable_cache } from 'next/cache';

const GITHUB_USERNAME = 'teamleaderleo';
const FEATURED_REPOSITORIES = ['smolrunner', 'stensibly'] as const;
const CACHE_SECONDS = 300;
const DISPLAY_TIME_ZONE = 'America/Los_Angeles';

export type ContributionDay = {
  date: string;
  count: number;
};

export type GitHubHomeData = {
  username: string;
  source: 'public-profile' | 'public-events' | 'unavailable';
  generatedAt: string;
  total: number | null;
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

function dateKeyInTimeZone(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function getRecentDateKeys(now = new Date()): string[] {
  const [year, month, day] = dateKeyInTimeZone(now, DISPLAY_TIME_ZONE)
    .split('-')
    .map(Number);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(Date.UTC(year, month - 1, day - (6 - index)));
    return date.toISOString().slice(0, 10);
  });
}

function parseContributionCount(label: string): number | null {
  if (/no contributions?/i.test(label)) return 0;
  const match = label.match(/([\d,]+) contributions?/i);
  return match ? Number(match[1].replaceAll(',', '')) : null;
}

export function parsePublicContributionHtml(html: string): Map<string, number> {
  const tooltipById = new Map<string, number>();
  const tooltipPattern = /<tool-tip\b[^>]*for="([^"]+)"[^>]*>([\s\S]*?)<\/tool-tip>/gi;

  for (const match of html.matchAll(tooltipPattern)) {
    const text = match[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const count = parseContributionCount(text);
    if (count !== null) tooltipById.set(match[1], count);
  }

  const result = new Map<string, number>();
  const cellPattern = /<(?:td|rect)\b([^>]*data-date="(\d{4}-\d{2}-\d{2})"[^>]*)>/gi;

  for (const match of html.matchAll(cellPattern)) {
    const attributes = match[1];
    const date = match[2];
    const directCount = attributes.match(/data-count="(\d+)"/i);
    if (directCount) {
      result.set(date, Number(directCount[1]));
      continue;
    }

    const id = attributes.match(/id="([^"]+)"/i)?.[1];
    if (id && tooltipById.has(id)) result.set(date, tooltipById.get(id) ?? 0);
  }

  return result;
}

async function fetchPublicProfileDays(): Promise<ContributionDay[]> {
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

  return getRecentDateKeys().map((date) => ({ date, count: counts.get(date) ?? 0 }));
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

async function fetchPublicEventDays(): Promise<ContributionDay[]> {
  const events = await githubJson<RestEvent[]>(
    `https://api.github.com/users/${GITHUB_USERNAME}/events/public?per_page=100`,
  );
  const counts = new Map<string, number>();

  for (const event of events) {
    if (!event.created_at) continue;
    const weight = eventWeight(event);
    if (weight === 0) continue;
    const key = dateKeyInTimeZone(new Date(event.created_at), DISPLAY_TIME_ZONE);
    counts.set(key, (counts.get(key) ?? 0) + weight);
  }

  return getRecentDateKeys().map((date) => ({ date, count: counts.get(date) ?? 0 }));
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
    const days = await fetchPublicProfileDays();
    return {
      username: GITHUB_USERNAME,
      source: 'public-profile',
      generatedAt: new Date().toISOString(),
      total: days.reduce((sum, day) => sum + day.count, 0),
      days,
      repositories: await repositoriesPromise,
    };
  } catch (profileError) {
    console.error('GitHub public contribution fetch failed', profileError);
  }

  try {
    const days = await fetchPublicEventDays();
    return {
      username: GITHUB_USERNAME,
      source: 'public-events',
      generatedAt: new Date().toISOString(),
      total: days.reduce((sum, day) => sum + day.count, 0),
      days,
      repositories: await repositoriesPromise,
    };
  } catch (eventError) {
    console.error('GitHub public event fetch failed', eventError);
    const days = getRecentDateKeys().map((date) => ({ date, count: 0 }));
    return {
      username: GITHUB_USERNAME,
      source: 'unavailable',
      generatedAt: new Date().toISOString(),
      total: null,
      days,
      repositories: await repositoriesPromise,
    };
  }
}

const getCachedGitHubHomeData = unstable_cache(
  loadGitHubHomeData,
  ['github-homepage-v3'],
  { revalidate: CACHE_SECONDS },
);

export async function getGitHubHomeData(): Promise<GitHubHomeData> {
  return getCachedGitHubHomeData();
}
