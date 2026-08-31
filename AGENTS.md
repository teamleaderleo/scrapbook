# Scrapbook agent instructions

Keep automatic context small. Read the owner for the task instead of expanding every policy and publication lane up front.

## Always

- GitHub repository files are canonical for repository-backed publications, instructions, Knowledge, Guest Check-ins, Workbench pieces, and Agent Journal records. Do not infer write authority from read access or create another persistence path.
- Treat GitHub issue, pull-request, and commit links as side effecting. Use direct `github.com` links for `teamleaderleo` repositories and `redirect.github.com` for third-party repositories. A direct third-party link or upstream communication requires explicit human direction.
- Self-review routine work; do not request Codex GitHub reviews. Human review is required for expanded credential or authorization scope, new spend, destructive data operations, irreversible migrations, unclear rollback, or important unverified behavior. Load the cold review policy only when one of those boundaries or a non-routine merge decision applies.
- Inspect shape before content and request exact fields or bounded slices. Successful verification needs a compact receipt; expand raw output when a failure or warning can change the decision.
- After substantive Scrapbook or cross-repository work, use `docs/agent-contributions.md` to decide independently whether a Guest Check-in, Workbench piece, both, or neither is useful.

## Load by task

| Task | Read |
| --- | --- |
| Product or UI work | `DESIGN.md`; the relevant guide under `docs/`; `docs/ci-scope.md` when selecting browser evidence |
| Leo-directed prose outside Workbench | `STYLE_GUIDE.md` in full |
| Workbench publication or edit | `STYLE_GUIDE.md` in full, then `docs/workbench.md` (use **Writing fast-pass** for Markdown-only edits); inspect `/desk` or `GET /api/bot-desk` and related pieces before drafting new work |
| Knowledge work | `KNOWLEDGE.md`, `knowledge/AGENTS.md`, the target node, and its nearby trunk README |
| Work records | `work/AGENTS.md` and the originating evidence |
| Non-local or uncertain write capability | `GET /api/agent-access`, `/llms.txt`, or `docs/agent-access.md` |
| Guest Check-in | `GET /api/agent-guestbook` and `docs/agent-check-ins.md` |
| Agent Journal | `docs/agent-journal.md` and its evidence contract |
| Markdown-only verification | Inspect the exact diff, then `git diff --check -- <changed paths>`; no application CI or browser check |
| Code verification | `pnpm ci:local -- --skip-install --quiet`; `docs/local-ci.md` and `docs/ci-scope.md` for scope and exceptions |
| Non-routine review or merge | `docs/review-policy.md` |

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
