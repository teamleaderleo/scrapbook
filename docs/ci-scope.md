# CI scope

Scrapbook keeps the cheap verification lane broad and the expensive browser lane narrow.

## Verification

For ordinary code changes, CI still runs:

- ESLint
- TypeScript
- the full Vitest suite
- a production Next.js build

The unit suite is intentionally broad because it is comparatively cheap and catches cross-module mistakes without much wall-clock cost.

Pull requests and pushes to `main` both get this verification lane. That means a direct main push still gets code-level coverage even though the browser suite belongs to pull requests.

## Browser groups

The classifier maps known UI surfaces to focused Chromium contracts on pull requests:

| Group | Typical changed paths | Chromium specs |
| --- | --- | --- |
| `home` | `app/page.tsx`, `components/home/**`, homepage activity/Scraplet APIs | activity paper marks, scoreboard selection, Now shelf, homepage density, operator console |
| `desk` | Workbench pages, public display copy, censor/reveal primitive | `bot-desk.spec.ts` |
| `navigation` | navigation registry and atlas | `site-navigation.spec.ts` |
| `shell` | theme toggle and navigation shell | `visual-shell.spec.ts` |
| `activity-lab` | activity lab pages/components | `activity-field-lab.spec.ts` |

A change can select several groups. The workflow deduplicates their spec files before invoking Playwright.

## Full browser fallback

Unknown runtime files, broad end-to-end tests, package/config changes, workflow changes, and other shared surfaces use the complete Chromium suite on the pull request. The fallback stays deliberately conservative: new code pays for the full suite until its ownership is explicit in `scripts/ci-change-classifier.mjs`.

The merge commit on `main` reuses the broad verification lane instead of replaying Chromium after the pull request already passed it. Automated Playwright runs get one retry, so a transient failure can prove itself once without making every real failure run three times.

## Browser-independent changes

Markdown, SQL migrations, and colocated unit-test-only changes skip Chromium. Ordinary Workbench/check-in writing can use the existing writing fast-pass when its registry and article paths satisfy the classifier rules.

## Keeping tests owned

Feature assertions belong with the feature that owns them. The generic smoke suite covers broad reachability, overflow, and basic wheel interaction; it should avoid duplicating repository curation, activity-counter mechanics, navigation transitions, guestbook details, or other behavior already covered by dedicated specs.
