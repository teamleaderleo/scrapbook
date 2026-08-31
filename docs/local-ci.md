# Local CI

Run the same broad confidence checks locally before waiting for GitHub Actions:

```bash
pnpm ci:local
```

The command requires Node 22.x. It installs the locked dependency graph, runs ESLint and the full Vitest suite, builds the production app, and rejects whitespace errors with `git diff --check`. The production build owns the routine project-wide TypeScript validation.

Local CI stays browser-free. Use Playwright separately when the question depends on browser behavior:

```bash
# tiny Chromium canary
pnpm test:e2e

# complete Chromium suite
pnpm test:e2e:full

# one focused browser check
pnpm exec playwright test tests/e2e/time-picker.spec.ts --project=chromium
```

Skip the install step when the local dependency graph is already current:

```bash
pnpm ci:local -- --skip-install
```

For a compact agent-facing success receipt, add `--quiet`:

```bash
pnpm ci:local -- --skip-install --quiet
```

Quiet mode prints one line per completed step and reveals that step's captured log only when it fails.

The command stops at the first broken boundary and prints the duration of every completed step. GitHub Actions remains the clean Linux verification environment; local CI is the quicker equivalent for routine checks.

Before a production build, Scrapbook removes stale generated route declarations from `.next/dev/types`. Next 16.3.2 can otherwise include deleted development routes in its production type check. The build wrapper holds Next's own `.next/dev` advisory lock until the production build exits, so it refuses to run while `next dev` owns that directory and prevents a new dev server from recreating stale declarations mid-build. It leaves the development bundler cache and production build output alone.

The framework repair is still open in [Next.js pull request 95638](https://redirect.github.com/vercel/next.js/pull/95638). Remove the local guard after Scrapbook pins a release containing that repair and the deleted-route reproduction passes without cleanup.
