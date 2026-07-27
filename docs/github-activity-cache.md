# GitHub activity refresh

The homepage reads public GitHub activity through `getGitHubHomeData()`. Live client refreshes use `getGitHubHomeResult()` through `/api/github-activity`.

## Freshness and failure policy

- One shared policy module owns every refresh and retry duration.
- The Next.js data cache keeps a successful upstream result fresh for 30 seconds across server instances and during homepage rendering.
- The connected API route keeps a 25-second in-process snapshot so concurrent requests inside one server instance share the same promise and value.
- The browser asks for a live snapshot every 30 seconds while the page is visible.
- The API response is explicitly `no-store` for browsers, generic CDNs, and Vercel's CDN. A browser poll therefore reaches the server coordinator instead of receiving the same five-minute edge object repeatedly.
- A previous successful server result remains eligible as stale data for one hour.
- Failed server refreshes use exponential retry backoff from 30 seconds to a five-minute cap.
- A failure never replaces a previous successful snapshot with zero values.
- `/api/github-activity` returns `503` only when neither the persistent data cache nor the current instance has a usable successful snapshot.

The layers now have one clear job each: the Next.js data cache bounds GitHub traffic across instances, the instance coordinator coalesces concurrent work and preserves stale-on-error behaviour, and the browser receives the newest server snapshot without an additional CDN freshness clock.

## Diagnostics

Successful JSON responses include a `diagnostics` object. An unavailable `503` response includes the same object so an incident can distinguish an empty cache from a stale fallback.

Important fields:

- `cacheStatus`: `miss`, `hit`, or `stale` for the current server-instance coordinator;
- `upstreamSource`: `public-profile`, `public-events`, or `unavailable`;
- `lastUpstreamAttempt` and `lastUpstreamFetch`;
- `consecutiveFailures` and `nextRetryAt`;
- `rateLimit`, populated when the REST events fallback returns GitHub rate-limit headers.

The route mirrors the most useful values in `X-Activity-*` headers, including cache status, source, failure count, last attempt, last successful fetch, next retry, refresh durations, and REST rate-limit details. `X-Request-Id` ties a response to server logs.

## Inspection

Use the API directly when investigating the homepage activity panel:

```bash
curl -i https://<deployment>/api/github-activity
```

The response should include `Cache-Control: private, no-store, max-age=0`, `CDN-Cache-Control: no-store`, and `Vercel-CDN-Cache-Control: no-store`.

A Vercel preview is useful because serverless instance reuse and route headers cannot be fully proven by a local process. Unit tests remain the source of truth for the cache state machine and response policy.
