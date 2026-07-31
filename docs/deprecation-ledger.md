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

Executable legacy project/block actions, data functions, schema, and routes are deliberately retained pending the reachability, authorization, and data-retention decision in #269.

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

The executable `/login` page, dashboard redirect, dashboard route stubs, pagination component, project/block actions, data modules, schema, and migrations remain untouched. Empty or redirected routes require the broader #269 decision rather than deletion by proximity.

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
- #465 — stale navigation implementation archived; issue #463 remains the active requirement.
- #467 — historical Pressure Valve visit proposal; not current Scrapbook work.
- #468 — generation-aware guestbook test idea archived until a non-Generation-2 entry is deliberately supported.
- #473 — stale combined Generation 3 lab branch; underlying research remains in #443, #447, and #448.
- #481 — historical Palette Finch visit proposal; not current Scrapbook work.
- #499 — broad GitHub activity prototype superseded by the narrower merged #502 correction.

### Retained / blocked

- #269 — executable legacy project/block data layer remains until reachability, authorization, production-data retention, and removal/rebuild decisions are evidenced.
- #378 — private ChatGPT check-in capability remains a product decision. Any implementation must start from current `main` as narrow ingress/auth, read-only, fixed-write, and deployed-acceptance slices.
- #410 — shortcut centralisation remains useful, but must be designed against current Space handlers.
- #411 — tactile interaction lab remains optional research rather than a queued implementation.
- #414 — mobile Space actions/editor behavior remains a current-product decision independent of the archived dependency branch.
- #463 — continuous navigation feedback remains a valid requirement even though stale PR #465 was closed.

## Recovery

For deleted files, use the parent commit of the relevant cleanup merge or retrieve the exact path from Git history. Restore only into a fresh branch with a current caller and current authorization model; do not restore a retired cluster by default.
