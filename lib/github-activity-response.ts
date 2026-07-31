import {
  GITHUB_ACTIVITY_CLIENT_REFRESH_SECONDS,
  GITHUB_ACTIVITY_STALE_SECONDS,
  GITHUB_ACTIVITY_UPSTREAM_FRESH_SECONDS,
} from './github-activity-policy';
import type { GitHubHomeResult } from './github-home';

export { GITHUB_ACTIVITY_CLIENT_REFRESH_SECONDS } from './github-activity-policy';

export type PublicGitHubActivityDiagnostics = Pick<
  GitHubHomeResult['diagnostics'],
  | 'cacheStatus'
  | 'upstreamSource'
  | 'lastUpstreamAttempt'
  | 'lastUpstreamFetch'
  | 'consecutiveFailures'
  | 'nextRetryAt'
>;

export function publicGitHubActivityDiagnostics(
  result: GitHubHomeResult,
): PublicGitHubActivityDiagnostics {
  const { diagnostics } = result;
  return {
    cacheStatus: diagnostics.cacheStatus,
    upstreamSource: diagnostics.upstreamSource,
    lastUpstreamAttempt: diagnostics.lastUpstreamAttempt,
    lastUpstreamFetch: diagnostics.lastUpstreamFetch,
    consecutiveFailures: diagnostics.consecutiveFailures,
    nextRetryAt: diagnostics.nextRetryAt,
  };
}

export function createGitHubActivityHeaders(result: GitHubHomeResult, requestId: string) {
  const { activity, diagnostics } = result;
  const headers = new Headers({
    'Cache-Control': 'private, no-store, max-age=0',
    'CDN-Cache-Control': 'no-store',
    'Vercel-CDN-Cache-Control': 'no-store',
    'X-Activity-Cache': diagnostics.cacheStatus,
    'X-Activity-Source': diagnostics.upstreamSource,
    'X-Activity-Failures': String(diagnostics.consecutiveFailures),
    'X-Client-Refresh-Seconds': String(GITHUB_ACTIVITY_CLIENT_REFRESH_SECONDS),
    'X-Upstream-Cache-Seconds': String(GITHUB_ACTIVITY_UPSTREAM_FRESH_SECONDS),
    'X-Stale-Fallback-Seconds': String(GITHUB_ACTIVITY_STALE_SECONDS),
    'X-Request-Id': requestId,
  });

  if (activity.source !== 'unavailable') {
    headers.set('X-Activity-Generated-At', activity.generatedAt);
  }
  if (diagnostics.lastUpstreamAttempt) {
    headers.set('X-Activity-Last-Attempt', diagnostics.lastUpstreamAttempt);
  }
  if (diagnostics.lastUpstreamFetch) {
    headers.set('X-Activity-Last-Upstream-Fetch', diagnostics.lastUpstreamFetch);
  }
  if (diagnostics.nextRetryAt) {
    headers.set('X-Activity-Next-Retry-At', diagnostics.nextRetryAt);
  }

  return headers;
}
