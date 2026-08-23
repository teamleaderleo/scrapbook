# CI scope

Scrapbook keeps hosted CI boring and short: lint plus unit tests in one job, and the production build in another. The jobs run in parallel.

## Hosted verification

For ordinary code changes, GitHub Actions runs two independent lanes:

- **quality** — ESLint and the full Vitest suite;
- **build** — the production Next.js build, including Next.js' TypeScript validation.

Pure Markdown changes skip the workflow. Pushes to `main` use the same lanes as pull requests.

Do not add a separate hosted `pnpm typecheck` step beside `next build`. Next.js already runs TypeScript during the production build, so serializing another full TypeScript pass adds wall-clock time without adding a second independent gate. `pnpm typecheck` remains available when a focused type-only check is useful during authoring.

Hosted CI does not install a browser, start Playwright, upload screenshot artifacts, classify UI surfaces, or replay browser checks after merge.

## Browser checks are author-side

Playwright remains available for questions that genuinely require a browser: rendered geometry, CSS behavior, hydration, pointer or keyboard interaction, browser APIs, responsive behavior, and deliberate visual inspection.

Use the narrowest check that answers the question:

```bash
# tiny browser canary
pnpm test:e2e

# one focused spec
pnpm exec playwright test tests/e2e/time-picker.spec.ts --project=chromium

# complete Chromium suite, only when it is actually useful
pnpm test:e2e:full

# explicit cross-browser sweep
pnpm test:e2e:cross-browser
```

For a visible UI change, run the app and inspect the affected route and relevant viewport directly. A local browser, a deployment preview, or the deployed site can all be useful evidence depending on what changed. Capture a screenshot when the visual result needs to be reviewed or preserved.

Do not run the complete Playwright suite by habit. Do not add a browser test for a property that can be derived from source, covered by a unit test, checked at an API boundary, or proven by the production build.

## What belongs where

Prefer Vitest for data transforms, registries, labels, API behavior, state transitions that do not depend on browser layout, and reusable component logic. Prefer the production build for TypeScript validation, route compilation, server/client boundaries, and Next.js integration failures.

Use Playwright when the assertion depends on actual browser behavior. Good examples include layout overflow, real focus behavior, media-query behavior, pointer interaction, browser storage, computed CSS, canvas interaction, and a small end-to-end hydration canary.

The default browser smoke file is intentionally tiny. The larger specs under `tests/e2e/` are opt-in diagnostic tools and should be run only when their surface is relevant. As those files are touched, move assertions down to Vitest whenever the browser adds no real signal.

## Local verification

`pnpm ci:local` runs install, lint, Vitest, the production build, and `git diff --check`. The build owns TypeScript validation here too, so local verification does not immediately repeat the same project-wide type analysis with a separate command.

Use `pnpm typecheck` directly when a type-only feedback loop is what you want. Browser work is a separate deliberate command.
