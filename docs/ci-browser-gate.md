# Chromium pull-request gate

Scrapbook keeps the full hosted Chromium suite for every change that may affect browser behavior. A pull request may skip browser setup only when every changed path belongs to the deliberately small browser-independent allowlist.

## Always run Chromium

The browser job runs for:

- every push to `main`;
- `app/**`, `components/**`, and runtime `lib/**` changes;
- `tests/e2e/**`;
- `public/**` rendered content and assets;
- package manifests and lockfiles;
- Next.js, Playwright, TypeScript, build, and tooling configuration;
- `.github/**` workflow changes;
- scripts and automation helpers;
- mixed pull requests where even one path is browser-relevant;
- unknown paths;
- any pull request whose base/head diff cannot be resolved safely.

The default is always to run the browser suite.

## Browser-independent allowlist

A pull request may skip Chromium only when every changed path is one of:

- `docs/**`;
- root `README.md`;
- colocated `*.test.ts` or `*.test.tsx` unit-test files outside `tests/e2e/**` and `.github/**`.

`verify` still runs lint, TypeScript, the full unit suite, and the production build for these pull requests.

## Decision path

1. The e2e job checks out enough history to compare the pull-request base and head.
2. `scripts/ci-change-classifier.mjs` classifies the changed paths.
3. `scripts/ci-change-classifier-cli.mjs` exposes the decision to GitHub Actions and writes the reason/path buckets to the job summary.
4. When `run_browser=true`, the job installs dependencies, installs only Chrome OS dependencies, runs the complete hosted `channel: 'chrome'` Playwright project, and uploads the normal visual/failure artifacts.
5. When `run_browser=false`, those expensive steps are skipped.

## Guardrail

Keep the allowlist small. A path class should enter it only when repository evidence shows that changing that class cannot alter browser runtime behavior or deployed rendered content. Ambiguity belongs on the full-browser path.

The classifier itself is unit-tested. Workflow wiring is validated in two directions: a workflow/script change must run Chromium, while a docs-only proof pull request must stop after classification.

Related: #576 and PRs #582/#586.
