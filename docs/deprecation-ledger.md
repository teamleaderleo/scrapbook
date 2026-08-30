# Deprecation ledger

Scrapbook uses this ledger as a structured recycling bin for retired code, stale branches, and ideas that should remain discoverable without pretending they are active product work.

Git history, closed issues, and closed pull requests are the source archive. Do not preserve obsolete implementations by leaving entire source files commented out in the runtime tree.

## Dispositions

### Removed

The code or artifact had no current runtime, product, migration, or evidentiary purpose and was deleted from the active tree.

A removal record should state:

- what was removed;
- why it was safe to remove;
- the evidence used to establish reachability or non-execution;
- any issue that still owns related product or data decisions;
- the recovery path through Git history.

### Superseded

A newer implementation, wording, or decision replaced the proposed change. Close the stale branch and point to the replacement.

### Archived

The work remains useful as historical evidence, an experiment result, or a future trigger, but is not an active merge candidate. Keep the closed issue or pull request; do not keep a permanently open branch to signal memory.

### Retained / blocked

The code may still own production data, deployment behavior, authorization, or a current product requirement. Keep it until the named blocker is resolved. A blocker must be concrete rather than “might be useful someday.”

## Rules

1. Start replacement work from current `main`; do not restack a stale branch wholesale.
2. A closed pull request can preserve implementation detail without remaining an active queue item.
3. Commented-out source is not an archive. Delete it once its context is captured elsewhere.
4. Do not delete schemas, migrations, data access, Server Actions, deployment controls, or authentication code without proving reachability, ownership, retention, and recovery requirements.
5. Do not delete user or production data during a repository cleanup pass.
6. Separate enduring requirements from obsolete implementations. An issue can remain open while its stale pull request closes.
7. Reopen archived ideas only with a current question, explicit acceptance criteria, and a fresh stopping rule.

## 2026-07-31 cleanup pass

### Removed: commented-only legacy dashboard source

The following files contained no executable statements. Their complete contents were commented-out remnants of the retired project/block dashboard and depended on other commented legacy hooks. They were removed from the active tree:

- `app/lib/hooks/useProjects.ts`
- `app/lib/hooks/useBlocks.ts`
- `components/dashboard/project-list.tsx`
- `components/dashboard/footer.tsx`
- `components/blocks/components/table.tsx`
- `components/blocks/components/block-thumbnail.tsx`
- `components/projects/components/project-blocks.tsx`
- `components/projects/components/project-blocks-container.tsx`
- `components/projects/forms/project-form-wrapper.tsx`
- `components/blocks/forms/block-form-wrapper.tsx`
- `components/portfolio/portfolio-view.tsx`

No runtime behavior, route, schema, migration, action, database record, or deployment configuration was changed. Git history is the recovery path.

### Removed: additional commented-only source

A second independent pass removed eight files whose entire contents were comments and which exposed no runtime export:

- `app/lib/hooks/useWebSocket.ts`
- `components/blog/blog-layout.tsx`
- `components/connection-status.tsx`
- `components/ui/components/search.tsx`
- `components/ui/components/login-form.tsx`
- `components/dashboard/latest-projects.tsx`
- `components/portfolio/block-display.tsx`
- `components/blocks/components/block-tags.tsx`

The executable `/login` page, pagination component, project/block actions, data modules, schema, and migrations remained untouched in those mechanical passes.

### Removed: legacy dashboard route tree

PR #511 removed the unreachable `/dashboard` route tree and its robots exclusion. Focused Chromium and WebKit coverage confirms former dashboard URLs return ordinary 404 responses while `/space` remains active.

Project/block actions, data modules, schema, historical migrations, and any production data remain retained under #269. No database deletion was authorized.

### Removed: public blog and editorial corpus

The owner confirmed that the public blog contained no useful, usable, or interesting data worth retaining. Issue #508 records the retirement decision.

The cleanup removed:

- all `/blog` routes, metadata, category pages, article rendering, and editorial-policy UI;
- blog parsing, types, list/byline/layout components, revision reader, editorial diff/version runtime, and their tests;
- eleven files under `content/posts`;
- the `content/editorial` notes, revision manifest, and stored draft;
- the blog destination from primary navigation and Site Atlas;
- `/blog` from the sitemap;
- blog entries from `/feed.xml`.

`/feed.xml` remains available as a journal-only feed containing public document-backed journal entries. Internal journal receipts remain excluded.

No Space content, journal records, authentication, database rows, credentials, or deployment controls were changed. Git history is the recovery path for any retired post or editorial file.

### Removed: disconnected legacy login surface

Issue #507 established that `/login` was a decorative Acme-style panel with no navigation, redirect, callback, middleware, or protected-route caller. The current Space sign-in flow uses Supabase directly from `components/space/app-sidebar.tsx` and returns through `/auth/callback`.

The cleanup removed:

- `app/login/page.tsx`;
- the commented-only `components/auth-modal.tsx` prototype;
- `components/ui/components/old-button.tsx`, which had no remaining caller;
- `components/ui/assets/acme-logo.tsx`, which was used only by the retired page;
- the nonexistent `/login/` path from robots metadata.

Focused browser coverage confirms `/login` returns an ordinary not-found response and `/space` does not redirect to it. No Supabase credentials, provider options, callbacks, user data, database accounts, admin detection, or authorization policy changed. Git history is the recovery path.

### Superseded or archived pull requests

- #381 — oversized private check-in plugin prototype archived; issue #378 retains the capability decision and decomposition boundary.
- #422 — typed Space shortcut-registry implementation archived 95 commits behind `main`; issue #410 retains the requirement.
- #425 — tactile-lab implementation archived 87 commits behind `main`; issue #411 retains the experiment question.
- #426 — mobile Space action/editor-sheet implementation archived 87 commits behind `main`; issue #414 retains the product requirement.
- #441 — historical Switchyard visit proposal; not current Scrapbook work.
- #446 — old time-page redesign archived 32 commits behind `main`; retain its design evidence, not its branch.
- #452 — README snapshot archived 23 commits behind `main`; regenerate documentation from current production.
- #454 — historical Teacup visit proposal; not current Scrapbook work.
- #457 — superseded by the shorter production-accurate time-tool copy already on `main`.
- #462 — snow-globe work already landed; the separate homepage Antigravity effect is archived as an optional experiment.
- #465 — stale navigation implementation archived; the requirement was delivered from current `main` by #510.
- #467 — historical Pressure Valve visit proposal; not current Scrapbook work.
- #468 — generation-aware guestbook test idea archived until a non-Generation-2 entry is deliberately supported.
- #473 — stale combined Generation 3 lab branch; underlying research remains in #443, #447, and #448.
- #481 — historical Palette Finch visit proposal; not current Scrapbook work.
- #499 — broad GitHub activity prototype superseded by the narrower merged #502 correction.

### Retained / blocked

- #269 — executable legacy project/block actions and data layer remain until reachability, authorization, production-data retention, and repository-only removal decisions are evidenced. Schema and historical migrations remain retained.
- #378 — private ChatGPT check-in capability remains a product decision. Any implementation must start from current `main` as narrow ingress/auth, read-only, fixed-write, and deployed-acceptance slices.
- #410 — shortcut centralisation remains useful, but must be designed against current Space handlers.
- #411 — tactile interaction lab remains optional research rather than a queued implementation.
- #414 — mobile Space actions/editor behavior remains a current-product decision independent of the archived dependency branch.

## 2026-08-09 hygiene pass

### Removed: orphaned dashboard, project, login, and WebSocket source

A repository-wide literal path, filename, import, and exported-symbol search found no caller for the following tracked files. Their original route trees and UI owners were already retired, and `components/projects/error.tsx` was not a Next.js error boundary because it lived under `components/` rather than `app/`:

- `components/dashboard/footer-tiptap-editor.tsx`
- `components/editor/content-preview.tsx`
- `components/hardcoded-sticky-note.tsx`
- `components/portfolio/portfolio.css`
- `components/projects/components/tag-manager.tsx`
- `components/projects/components/tiptap-editor-project-blocks.tsx`
- `components/projects/error.tsx`
- `components/simple-auth-modal.tsx`
- `dist/socket-server.js`

The tag manager was entirely commented out. The sticky note contained demo login credentials for the retired landing/login flow. The compiled WebSocket server had no source owner, package script, deployment entrypoint, route, or client. Current Space authentication, editing, schemas, database access, and deployment controls remain unchanged.

### Removed: public assets owned only by retired surfaces

The following assets had no current literal reference, import, metadata reference, documented archival role, or dynamic URL owner. Git history ties them to the retired landing/login page, project/block dashboard, or disconnected Scrapbook showcase:

- `public/landing-desktop.jpg`
- `public/landing-mobile.jpg`
- `public/placeholder-default.png`
- `public/placeholder-file.png`
- `public/placeholder-text.png`
- `public/blocks/app-wireframes.pdf`
- `public/blocks/homepage-mockup.png`
- `public/blocks/logo-concepts.png`
- `public/scrapbook/blog-landing-preview.webp`
- `public/scrapbook/network-performance-diff.webp`
- `public/scrapbook/platform-vscode-overview.webp`
- `public/scrapbook/server-actions-example.webp`
- `public/scrapbook/tiptap-editor-demo.webp`

The numbered `public/img1.jpg` through `public/img10.jpg` carousel images remain: `components/three-carousel/three-carousel.tsx` constructs those URLs at runtime from its default `/img` prefix, so a literal filename search alone would incorrectly classify them as unused. Current Gallery agent artwork and Journal documents also remain.

No database row, user content, schema, migration, credential, or live route was removed. Git history is the recovery path for every deleted file.

### Removed: obsolete Drizzle model and commands

The live runtime database boundary is the lazy `postgres` client in
`app/lib/db/db.ts`. Its only callers issue explicit SQL for proxy-health reads
and writes. The unused Drizzle model and CLI configuration described only the
retired account/project/block schema, so they were removed along with the
misleading `generate`, `migrate`, and `studio` scripts and unused dependencies.

Checked-in SQL files under `drizzle/` remain the migration ledger. No table or
row was removed by this repository cleanup; the related live Data API grants
were retired separately with a reversible SQL migration.

## 2026-08-25 reconciliation

### Completed: legacy project/block runtime retirement

Issue #269 is closed as completed. The executable project/block/tag actions, data helpers, client remnants, Drizzle model, and related dormant runtime have been retired. Checked-in SQL migrations remain historical migration evidence; they are not an active product blocker. The July 31 `Retained / blocked` entry above records the state at that time and no longer describes current `main`.

### Promoted: Generation 3 guestbook

The archived #473 branch remains historical research. The useful Generation 3 direction was restarted from current `main`, promoted through #635 and #638, and now owns ordinary generated guestbook sigils. Historical Generation 1 and Generation 2 pins remain only for reproducibility.

### Removed: dead ThreeCarousel source and demo assets

The Gallery's live projected Tesseract scene moved to `components/gallery/tesseract-scene.tsx`. The unreachable carousel implementation, its drag/wrap helpers and stylesheet, and `public/img1.jpg` through `public/img10.jpg` were removed after repository-wide caller checks found no live owner. The August 9 note that retained those images is therefore superseded. Git history and old PR #641 remain the recovery path for the discarded demo.

The direct package family that existed only for the dead carousel is separately tracked by #640 for lockfile regeneration. The active Gallery scene itself uses React Three Fiber and Three.js.

### Removed: unused UI and workaround residue

A second caller pass removed unused top-level UI wrappers for alert, badge, card, checkbox, dropdown menu, keyboard key, pagination, popover, select, switch, table, textarea, and the unused avatar asset wrapper. It also removed the caller-free `MinimalSiteNav`, old `home.module.css`, the unused React DOM class-order patch script, and the abandoned WebHint configuration.

The live UI primitives with current callers remain. `lib/deprecation-boundaries.test.ts` now protects the new retired source paths from accidental restoration.

### Removed: historical browser retirement canaries

Playwright files whose only job was proving already-deleted `/login`, `/dashboard/*`, `/resume`, or `/api/claude` surfaces stayed absent were removed. The source/deprecation boundary owns those facts now. The browser suite remains for behavior that actually requires a browser, including hydration, layout, interaction, storage, and visual/canvas behavior.

The scheduled WebKit compatibility workflow and WebKit Playwright project were also retired. Author-side browser work now uses the Chromium project deliberately; routine hosted and local CI remain browser-free.

### Removed: completed one-shot deployment inspection

The temporary `signal-status-once.yml` workflow and its `.smoke/signal-status.json` receipt were deleted after their one historical OIDC inspection completed. The workflow had a hard-coded target SHA and existed only to write that receipt. Git history preserves the diagnostic result without leaving write-enabled one-shot machinery in the active workflow directory.

### Removed: repository-wide Prettier foot-gun

Prettier, its Tailwind plugin, configuration, and manual scripts were removed after the write script's hard-coded repository root caused a targeted dashboard format to rewrite hundreds of unrelated files. Hosted and local CI never depended on Prettier; ESLint, TypeScript, tests, builds, and `git diff --check` remain the active gates. Local edits should follow the surrounding file rather than initiating an unrelated whole-tree normalization.

### Removed: dormant learning prototypes

A deeper caller pass removed the isolated in-memory LeetCode sample/search pair, its review seeding helper, and the older file-backed `content/cards` reader with SM-2-era `SpaceCard` definitions. The real Space search parser, numeric comparator, FSRS adapter, Supabase mapping, and Markdown helpers remain because current Space routes still call them.

The unused `app/lib/utils/index.ts` barrel left with the file-backed cards; current callers import the remaining utilities directly.

### Removed: orphaned UI helpers and obsolete review markers

`components/paper-critter.tsx` and `components/search-params-handler.tsx` had no caller by filename or exported-symbol search and were deleted. The separate `PaperCreature` renderer remains active on current pages.

The temporary `docs/visual-review-run.md` trigger marker and the obsolete `docs/visual-review-artifacts.md` hosted-artifact note were also removed after hosted browser workflows were retired.

### Removed: artwork-first guestbook importer

The ordinary Guest Check-in path is text-only and Generation 3 creates its sigil automatically. The old raster-art path therefore no longer owns an active workflow. The cleanup removed:

- `.github/workflows/import-gallery-asset.yml`, including its `contents: write` branch-commit path and Google Drive credential flow;
- `scripts/import-gallery-asset.mjs` and `tests/gallery-asset-importer.test.ts`;
- `docs/gallery-asset-importer.md`, `docs/gallery-artwork.md`, and `docs/agent-art-creation-and-research.md` from the live guide set.

The archived v1 check-in and orchestration snapshots remain under `docs/archive/` for deliberate historical recovery. `file-type` and `sharp` now have no direct repository caller and join the package-only cleanup tracked by #640.

### Reconciled: current agent and browser guidance

The machine-readable Guest Check-in contract, pull-request template, sigil lab copy, sigil guide, and archive index now describe Generation 3 and the current lightweight publication path. Browser-independent API contract assertions moved out of Playwright and into Vitest; the remaining guestbook Playwright coverage concerns rendered Gallery behavior.

`next.config.mjs` also dropped the retired S3/CloudFront image hosts and three unused local `optimizePackageImports` aliases. Current package-level optimizations and the live Gallery/Space configuration remain.

## Recovery

For deleted files, use the parent commit of the relevant cleanup merge or retrieve the exact path from Git history. Restore only into a fresh branch with a current caller and current authorization model; do not restore a retired cluster by default.
