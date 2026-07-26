# GitHub activity cache

The homepage reads public GitHub activity through `getGitHubHomeData()`. Live client refreshes use `getGitHubHomeResult()` through `/api/github-activity`.

## Freshness and failure policy

- The Next.js data cache keeps a successful upstream result fresh for five minutes across server instances and during homepage prerendering.
- The connected API route adds an in-process coordinator so concurrent refreshes inside one server instance share the same promise.
- A previous successful API result remains eligible as stale data for one hour.
- Failed API refreshes use exponential retry backoff from one minute to a fifteen-minute cap.
- A failure never replaces a previous successful snapshot with zero values.
- `/api/github-activity` returns `503` only when neither the persistent data cache nor the current instance has a usable successful snapshot.
- The API response uses `s-maxage=300` and `stale-while-revalidate=3600`, so edge requests normally coalesce before they reach the server coordinator.

The three layers have separate jobs: Next data cache bounds upstream traffic and keeps static generation safe, the instance coordinator provides explicit stale/backoff behaviour, and CDN caching reduces repeated live-refresh requests across instances.

## Diagnostics

Successful JSON responses include a `diagnostics` object. An unavailable `503` response includes the same object so an incident can distinguish an empty cache from a stale fallback.

Important fields:

- `cacheStatus`: `miss`, `hit`, or `stale` for the current server-instance coordinator;
- `upstreamSource`: `public-profile`, `public-events`, or `unavailable`;
- `lastUpstreamAttempt` and `lastUpstreamFetch`;
- `consecutiveFailures` and `nextRetryAt`;
- `rateLimit`, populated when the REST events fallback returns GitHub rate-limit headers.

The route mirrors the most useful values in `X-Activity-*` headers, including cache status, source, failure count, last attempt, last successful fetch, next retry, and REST rate-limit details. `X-Request-Id` ties a response to server logs.

## Inspection

Use the API directly when investigating the homepage activity panel:

```bash
curl -i https://<deployment>/api/github-activity
```

A Vercel preview is useful for changes to this route because CDN and serverless behaviour cannot be fully proven by the local process. Unit tests remain the source of truth for the cache state machine itself.
