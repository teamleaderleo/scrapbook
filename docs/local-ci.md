# Local CI

Run the same confidence checks locally before waiting for GitHub Actions:

```bash
pnpm ci:local
```

This installs the locked dependency graph, runs lint and typechecking, executes
unit tests, builds the production app, rejects whitespace errors, and runs the
Chromium browser suite. It always substitutes inert Supabase credentials so a
local verification run cannot read or mutate the live Space database.

For the slower Safari-compatible browser pass:

```bash
pnpm exec playwright install webkit # one-time browser installation
pnpm ci:local:full
```

Useful iteration flags can be passed after `--`:

```bash
pnpm ci:local -- --skip-install
pnpm ci:local -- --skip-e2e
```

The command stops at the first broken boundary and prints the duration of every
completed step. GitHub Actions remains the clean Linux verification environment;
local CI is the faster default feedback loop.
