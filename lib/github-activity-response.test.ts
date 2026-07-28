import { describe, expect, it } from 'vitest';
import { createGitHubActivityHeaders } from './github-activity-response';
import type { GitHubHomeResult } from './github-home';

function result(source: GitHubHomeResult['activity']['source']): GitHubHomeResult {
  return {
    activity: {
      username: 'teamleaderleo',
      source,
      generatedAt: '2026-07-27T01:00:00.000Z',
      total: 18,
      periodLabel: source === 'public-profile' ? 'last year' : 'last 35 days',
      today: 3,
      weekTotal: 9,
      activeDays: 5,
      currentStreak: 2,
      days: [],
      repositories: [],
    },
    diagnostics: {
      cacheStatus: 'stale',
      upstreamSource: source,
      lastUpstreamAttempt: '2026-07-27T01:05:00.000Z',
      lastUpstreamFetch: '2026-07-27T01:00:00.000Z',
      consecutiveFailures: 2,
      nextRetryAt: '2026-07-27T01:07:00.000Z',
      rateLimit: null,
    },
  };
}

describe('createGitHubActivityHeaders', () => {
  it('keeps live polling out of browser and CDN caches while exposing diagnostics', () => {
    const headers = createGitHubActivityHeaders(result('public-profile'), 'request-123');

    expect(headers.get('cache-control')).toBe('private, no-store, max-age=0');
    expect(headers.get('cdn-cache-control')).toBe('no-store');
    expect(headers.get('vercel-cdn-cache-control')).toBe('no-store');
    expect(headers.get('x-client-refresh-seconds')).toBe('30');
    expect(headers.get('x-upstream-cache-seconds')).toBe('30');
    expect(headers.get('x-stale-fallback-seconds')).toBe('3600');
    expect(headers.get('x-activity-cache')).toBe('stale');
    expect(headers.get('x-activity-source')).toBe('public-profile');
    expect(headers.get('x-activity-generated-at')).toBe('2026-07-27T01:00:00.000Z');
    expect(headers.get('x-activity-last-attempt')).toBe('2026-07-27T01:05:00.000Z');
    expect(headers.get('x-activity-last-upstream-fetch')).toBe('2026-07-27T01:00:00.000Z');
    expect(headers.get('x-activity-next-retry-at')).toBe('2026-07-27T01:07:00.000Z');
    expect(headers.get('x-activity-failures')).toBe('2');
    expect(headers.has('x-activity-ratelimit-limit')).toBe(false);
    expect(headers.get('x-request-id')).toBe('request-123');
  });

  it('does not label an unavailable placeholder as generated activity', () => {
    const headers = createGitHubActivityHeaders(result('unavailable'), 'request-456');

    expect(headers.get('x-activity-source')).toBe('unavailable');
    expect(headers.has('x-activity-generated-at')).toBe(false);
  });
});
