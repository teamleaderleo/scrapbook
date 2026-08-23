# CI scope

Scrapbook keeps hosted CI boring: install, lint, typecheck, unit tests, and a production build.

## Hosted verification

For ordinary code changes, GitHub Actions runs:

- ESLint
- TypeScript
- the full Vitest suite
- a production Next.js build

Pure Markdown changes skip the workflow. Pushes to `main` use the same verification job as pull requests.

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

Prefer Vitest for data transforms, registries, labels, API behavior, state transitions that do not depend on browser layout, and reusable component logic. Prefer the production build for route compilation, server/client boundaries, and Next.js integration failures.

Use Playwright when the assertion depends on actual browser behavior. Good examples include layout overflow, real focus behavior, media-query behavior, pointer interaction, browser storage, computed CSS, canvas interaction, and a small end-to-end hydration canary.

The default browser smoke file is intentionally tiny. The larger specs under `tests/e2e/` are opt-in diagnostic tools and should be run only when their surface is relevant. As those files are touched, move assertions down to Vitest whenever the browser adds no real signal.

## Local verification

`pnpm ci:local` mirrors hosted verification and stays browser-free. Browser work is a separate deliberate command, so an agent can build and verify the application without accidentally paying for the whole Playwright suite.
