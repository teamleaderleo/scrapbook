import { unstable_cache } from 'next/cache';

const GITHUB_USERNAME = 'teamleaderleo';
const FEATURED_REPOSITORIES = ['smolrunner', 'stensibly'] as const;
const CACHE_SECONDS = 600;
const PACIFIC_TIME_ZONE = 'America/Los_Angeles';

export type GitHubActivitySource = 'graphql' | 'public-rest' | 'unavailable';

export type ContributionDay = {
  date: string;
  count: number;
};

export type RepositorySummary = {
  name: string;
  nameWithOwner: string;
  url: string;
  description: string | null;
  stars: number;
  forks: number;
  updatedAt: string | null;
  latestCommitMessage: string | null;
  latestCommitUrl: string | null;
};

export type PullRequestSummary = {
  number: number;
  title: string;
  url: string;
  body: string;
  mergedAt: string;
  repository: string;
  repositoryUrl: string;
};

export type GitHubHomeData = {
  username: string;
  source: GitHubActivitySource;
  generatedAt: string;
  stats: {
    today: number | null;
    lastSevenDays: number | null;
    year: number | null;
    streak: number;
    label: 'contributions' | 'public actions';
  };
  days: ContributionDay[];
  featuredRepositories: RepositorySummary[];
  recentPullRequests: PullRequestSummary[];
};

type GraphQLContributionDay = {
  date: string;
  contributionCount: number;
};

type GraphQLRepository = {
  name: string;
  nameWithOwner: string;
  url: string;
  description: string | null;
  stargazerCount: number;
  forkCount: number;
  updatedAt: string;
  defaultBranchRef: {
    target: {
      messageHeadline?: string;
      committedDate?: string;
      url?: string;
    };
  } | null;
};

type GraphQLPullRequest = {
  number: number;
  title: string;
  url: string;
  bodyText: string | null;
  mergedAt: string | null;
  repository: {
    nameWithOwner: string;
    url: string;
    isPrivate: boolean;
  };
};

type GraphQLResponse = {
  data?: {
    user: {
      recent: {
        contributionCalendar: {
          totalContributions: number;
          weeks: Array<{
            contributionDays: GraphQLContributionDay[];
          }>;
        };
      };
      year: {
        contributionCalendar: {
          totalContributions: number;
        };
      };
      pullRequests: {
        nodes: GraphQLPullRequest[];
      };
    } | null;
    smolrunner: GraphQLRepository | null;
    stensibly: GraphQLRepository | null;
  };
  errors?: Array<{ message: string }>;
};

type RestEvent = {
  type: string;
  created_at: string | null;
  payload?: {
    action?: string;
    size?: number;
    distinct_size?: number;
    pull_request?: {
      merged?: boolean;
    };
  };
};

type RestRepository = {
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
};

type RestSearchPullRequest = {
  number: number;
  title: string;
  html_url: string;
  body: string | null;
  updated_at: string;
  closed_at: string | null;
  repository_url: string;
};

type RestSearchResponse = {
  items?: RestSearchPullRequest[];
};

const GRAPHQL_QUERY = `
  query GitHubHomepage(
    $login: String!
    $recentFrom: DateTime!
    $yearFrom: DateTime!
    $to: DateTime!
  ) {
    user(login: $login) {
      recent: contributionsCollection(from: $recentFrom, to: $to) {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              date
              contributionCount
            }
          }
        }
      }
      year: contributionsCollection(from: $yearFrom, to: $to) {
        contributionCalendar {
          totalContributions
        }
      }
      pullRequests(
        first: 24
        states: [MERGED]
        orderBy: { field: UPDATED_AT, direction: DESC }
      ) {
        nodes {
          number
          title
          url
          bodyText
          mergedAt
          repository {
            nameWithOwner
            url
            isPrivate
          }
        }
      }
    }
    smolrunner: repository(owner: $login, name: "smolrunner") {
      ...RepositoryCard
    }
    stensibly: repository(owner: $login, name: "stensibly") {
      ...RepositoryCard
    }
  }

  fragment RepositoryCard on Repository {
    name
    nameWithOwner
    url
    description
    stargazerCount
    forkCount
    updatedAt
    defaultBranchRef {
      target {
        ... on Commit {
          messageHeadline
          committedDate
          url
        }
      }
    }
  }
`;

function toDateKey(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: PACIFIC_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function getRecentDateKeys(total: number): string[] {
  const now = new Date();
  const keys: string[] = [];

  for (let offset = total - 1; offset >= 0; offset -= 1) {
    keys.push(toDateKey(new Date(now.getTime() - offset * 86_400_000)));
  }

  return keys;
}

function calculateStreak(days: ContributionDay[]): number {
  let streak = 0;

  for (let index = days.length - 1; index >= 0; index -= 1) {
    if (days[index].count <= 0) break;
    streak += 1;
  }

  return streak;
}

function orderPullRequests(pullRequests: PullRequestSummary[]): PullRequestSummary[] {
  const featured = FEATURED_REPOSITORIES.flatMap((repositoryName) => {
    const match = pullRequests.find(
      (pullRequest) => pullRequest.repository.split('/').at(-1) === repositoryName,
    );
    return match ? [match] : [];
  });

  const selectedUrls = new Set(featured.map((pullRequest) => pullRequest.url));
  const remaining = pullRequests
    .filter((pullRequest) => !selectedUrls.has(pullRequest.url))
    .sort(
      (left, right) =>
        new Date(right.mergedAt).getTime() - new Date(left.mergedAt).getTime(),
    );

  return [...featured, ...remaining].slice(0, 8);
}

function graphQLRepositoryToSummary(
  repository: GraphQLRepository | null,
): RepositorySummary | null {
  if (!repository) return null;

  const target = repository.defaultBranchRef?.target;

  return {
    name: repository.name,
    nameWithOwner: repository.nameWithOwner,
    url: repository.url,
    description: repository.description,
    stars: repository.stargazerCount,
    forks: repository.forkCount,
    updatedAt: target?.committedDate ?? repository.updatedAt,
    latestCommitMessage: target?.messageHeadline ?? null,
    latestCommitUrl: target?.url ?? null,
  };
}

async function loadFromGraphQL(token: string): Promise<GitHubHomeData> {
  const now = new Date();
  const recentFrom = new Date(now.getTime() - 20 * 86_400_000);
  const yearFrom = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));

  const response = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    cache: 'no-store',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'teamleaderleo-scrapbook',
      'X-GitHub-Api-Version': '2026-03-10',
    },
    body: JSON.stringify({
      query: GRAPHQL_QUERY,
      variables: {
        login: GITHUB_USERNAME,
        recentFrom: recentFrom.toISOString(),
        yearFrom: yearFrom.toISOString(),
        to: now.toISOString(),
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`GitHub GraphQL returned ${response.status}`);
  }

  const payload = (await response.json()) as GraphQLResponse;
  const user = payload.data?.user;

  if (!user || payload.errors?.length) {
    throw new Error(payload.errors?.[0]?.message ?? 'GitHub user data was unavailable');
  }

  const dayMap = new Map<string, number>();
  for (const week of user.recent.contributionCalendar.weeks) {
    for (const day of week.contributionDays) {
      dayMap.set(day.date, day.contributionCount);
    }
  }

  const days = getRecentDateKeys(14).map((date) => ({
    date,
    count: dayMap.get(date) ?? 0,
  }));
  const todayKey = days.at(-1)?.date;
  const today = todayKey ? (dayMap.get(todayKey) ?? 0) : 0;
  const lastSevenDays = days.slice(-7).reduce((total, day) => total + day.count, 0);

  const pullRequests = user.pullRequests.nodes
    .filter(
      (pullRequest): pullRequest is GraphQLPullRequest & { mergedAt: string } =>
        !pullRequest.repository.isPrivate &&
        pullRequest.repository.nameWithOwner.startsWith(`${GITHUB_USERNAME}/`) &&
        Boolean(pullRequest.mergedAt),
    )
    .map((pullRequest) => ({
      number: pullRequest.number,
      title: pullRequest.title,
      url: pullRequest.url,
      body: pullRequest.bodyText ?? '',
      mergedAt: pullRequest.mergedAt,
      repository: pullRequest.repository.nameWithOwner,
      repositoryUrl: pullRequest.repository.url,
    }));

  const featuredRepositories = [payload.data?.smolrunner, payload.data?.stensibly]
    .map((repository) => graphQLRepositoryToSummary(repository ?? null))
    .filter((repository): repository is RepositorySummary => Boolean(repository));

  return {
    username: GITHUB_USERNAME,
    source: 'graphql',
    generatedAt: now.toISOString(),
    stats: {
      today,
      lastSevenDays,
      year: user.year.contributionCalendar.totalContributions,
      streak: calculateStreak(days),
      label: 'contributions',
    },
    days,
    featuredRepositories,
    recentPullRequests: orderPullRequests(pullRequests),
  };
}

function publicActionWeight(event: RestEvent): number {
  if (event.type === 'PushEvent') {
    return Math.max(event.payload?.distinct_size ?? event.payload?.size ?? 1, 1);
  }

  if (event.type === 'PullRequestEvent') {
    const action = event.payload?.action;
    if (action === 'opened' || action === 'closed' || action === 'reopened') return 1;
  }

  if (event.type === 'IssuesEvent' && event.payload?.action === 'opened') return 1;
  if (event.type === 'PullRequestReviewEvent' && event.payload?.action === 'created') return 1;

  return 0;
}

function repositoryNameFromApiUrl(repositoryUrl: string): string {
  return repositoryUrl.replace('https://api.github.com/repos/', '');
}

async function publicGitHubFetch<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    cache: 'no-store',
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'teamleaderleo-scrapbook',
      'X-GitHub-Api-Version': '2026-03-10',
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub REST returned ${response.status}`);
  }

  return (await response.json()) as T;
}

async function loadFromPublicRest(): Promise<GitHubHomeData> {
  const encodedQuery = encodeURIComponent(
    `author:${GITHUB_USERNAME} is:pr is:merged`,
  );

  const [eventsPageOne, eventsPageTwo, eventsPageThree, repositories, search] =
    await Promise.all([
      publicGitHubFetch<RestEvent[]>(
        `https://api.github.com/users/${GITHUB_USERNAME}/events/public?per_page=100&page=1`,
      ),
      publicGitHubFetch<RestEvent[]>(
        `https://api.github.com/users/${GITHUB_USERNAME}/events/public?per_page=100&page=2`,
      ),
      publicGitHubFetch<RestEvent[]>(
        `https://api.github.com/users/${GITHUB_USERNAME}/events/public?per_page=100&page=3`,
      ),
      publicGitHubFetch<RestRepository[]>(
        `https://api.github.com/users/${GITHUB_USERNAME}/repos?per_page=100&sort=updated&type=owner`,
      ),
      publicGitHubFetch<RestSearchResponse>(
        `https://api.github.com/search/issues?q=${encodedQuery}&sort=updated&order=desc&per_page=24`,
      ),
    ]);

  const events = [...eventsPageOne, ...eventsPageTwo, ...eventsPageThree];
  const dayMap = new Map<string, number>();

  for (const event of events) {
    if (!event.created_at) continue;
    const weight = publicActionWeight(event);
    if (weight === 0) continue;

    const date = toDateKey(new Date(event.created_at));
    dayMap.set(date, (dayMap.get(date) ?? 0) + weight);
  }

  const days = getRecentDateKeys(14).map((date) => ({
    date,
    count: dayMap.get(date) ?? 0,
  }));
  const today = days.at(-1)?.count ?? 0;
  const lastSevenDays = days.slice(-7).reduce((total, day) => total + day.count, 0);

  const featuredRepositories = FEATURED_REPOSITORIES.map((repositoryName) => {
    const repository = repositories.find((candidate) => candidate.name === repositoryName);

    if (!repository) {
      return {
        name: repositoryName,
        nameWithOwner: `${GITHUB_USERNAME}/${repositoryName}`,
        url: `https://github.com/${GITHUB_USERNAME}/${repositoryName}`,
        description: null,
        stars: 0,
        forks: 0,
        updatedAt: null,
        latestCommitMessage: null,
        latestCommitUrl: null,
      } satisfies RepositorySummary;
    }

    return {
      name: repository.name,
      nameWithOwner: repository.full_name,
      url: repository.html_url,
      description: repository.description,
      stars: repository.stargazers_count,
      forks: repository.forks_count,
      updatedAt: repository.updated_at,
      latestCommitMessage: null,
      latestCommitUrl: null,
    } satisfies RepositorySummary;
  });

  const pullRequests = (search.items ?? [])
    .map((pullRequest) => {
      const repository = repositoryNameFromApiUrl(pullRequest.repository_url);

      return {
        number: pullRequest.number,
        title: pullRequest.title,
        url: pullRequest.html_url,
        body: pullRequest.body ?? '',
        mergedAt: pullRequest.closed_at ?? pullRequest.updated_at,
        repository,
        repositoryUrl: `https://github.com/${repository}`,
      } satisfies PullRequestSummary;
    })
    .filter((pullRequest) => pullRequest.repository.startsWith(`${GITHUB_USERNAME}/`));

  return {
    username: GITHUB_USERNAME,
    source: 'public-rest',
    generatedAt: new Date().toISOString(),
    stats: {
      today,
      lastSevenDays,
      year: null,
      streak: calculateStreak(days),
      label: 'public actions',
    },
    days,
    featuredRepositories,
    recentPullRequests: orderPullRequests(pullRequests),
  };
}

function unavailableData(): GitHubHomeData {
  const days = getRecentDateKeys(14).map((date) => ({ date, count: 0 }));

  return {
    username: GITHUB_USERNAME,
    source: 'unavailable',
    generatedAt: new Date().toISOString(),
    stats: {
      today: null,
      lastSevenDays: null,
      year: null,
      streak: 0,
      label: 'contributions',
    },
    days,
    featuredRepositories: FEATURED_REPOSITORIES.map((name) => ({
      name,
      nameWithOwner: `${GITHUB_USERNAME}/${name}`,
      url: `https://github.com/${GITHUB_USERNAME}/${name}`,
      description: null,
      stars: 0,
      forks: 0,
      updatedAt: null,
      latestCommitMessage: null,
      latestCommitUrl: null,
    })),
    recentPullRequests: [],
  };
}

async function loadGitHubHomeData(): Promise<GitHubHomeData> {
  const token = process.env.GITHUB_TOKEN ?? process.env.GITHUB_ACCESS_TOKEN;

  if (token) {
    try {
      return await loadFromGraphQL(token);
    } catch (error) {
      console.error('GitHub GraphQL homepage fetch failed', error);
    }
  }

  try {
    return await loadFromPublicRest();
  } catch (error) {
    console.error('GitHub REST homepage fetch failed', error);
    return unavailableData();
  }
}

const getCachedGitHubHomeData = unstable_cache(
  loadGitHubHomeData,
  ['github-homepage-v1'],
  { revalidate: CACHE_SECONDS },
);

export async function getGitHubHomeData(): Promise<GitHubHomeData> {
  return getCachedGitHubHomeData();
}
