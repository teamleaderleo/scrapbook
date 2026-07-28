import { describe, expect, it, vi } from 'vitest';
import {
  fetchGitHubContributionCalendar,
  parseGitHubContributionCalendar,
} from './github-contribution-calendar';

const payload = {
  data: {
    user: {
      contributionsCollection: {
        contributionCalendar: {
          totalContributions: 18,
          weeks: [
            {
              contributionDays: [
                { date: '2026-07-27', contributionCount: 7 },
                { date: '2026-07-28', contributionCount: 11 },
              ],
            },
          ],
        },
      },
    },
  },
};

describe('parseGitHubContributionCalendar', () => {
  it('reads official per-day counts and the calendar total', () => {
    const result = parseGitHubContributionCalendar(payload);

    expect([...result.counts.entries()]).toEqual([
      ['2026-07-27', 7],
      ['2026-07-28', 11],
    ]);
    expect(result.total).toBe(18);
    expect(result.rateLimit).toBeNull();
  });

  it('rejects partial or malformed calendars instead of publishing zeroes', () => {
    expect(() => parseGitHubContributionCalendar({ data: { user: null } })).toThrow(
      'contribution calendar was missing',
    );
    expect(() =>
      parseGitHubContributionCalendar({
        data: {
          user: {
            contributionsCollection: {
              contributionCalendar: {
                totalContributions: 1,
                weeks: [{ contributionDays: [{ date: 'July 28', contributionCount: 1 }] }],
              },
            },
          },
        },
      }),
    ).toThrow('contribution day was invalid');
  });
});

describe('fetchGitHubContributionCalendar', () => {
  it('uses GitHub GraphQL with bearer authentication and the requested login', async () => {
    const fetchImpl = vi.fn(async (..._args: Parameters<typeof fetch>) =>
      new Response(JSON.stringify(payload), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': '5000',
          'X-RateLimit-Remaining': '4998',
          'X-RateLimit-Used': '2',
          'X-RateLimit-Reset': '1785258000',
          'X-RateLimit-Resource': 'graphql',
        },
      }),
    );

    const result = await fetchGitHubContributionCalendar(
      'teamleaderleo',
      'profile-token',
      fetchImpl,
    );

    expect(result.total).toBe(18);
    expect(result.rateLimit).toEqual({
      limit: 5000,
      remaining: 4998,
      used: 2,
      resetAt: '2026-07-28T17:00:00.000Z',
      resource: 'graphql',
    });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe('https://api.github.com/graphql');
    expect(init?.method).toBe('POST');
    expect(new Headers(init?.headers).get('authorization')).toBe('Bearer profile-token');
    expect(JSON.parse(String(init?.body))).toMatchObject({
      variables: { login: 'teamleaderleo' },
    });
  });
});
