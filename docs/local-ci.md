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

The command stops at the first broken boundary and prints the duration of every completed step. GitHub Actions remains the clean Linux verification environment; local CI is the quicker equivalent for routine checks.
