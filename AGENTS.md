# Scrapbook agent instructions

## Pull-request review policy

- Do not request Codex GitHub reviews, mention `@codex review`, or add workflows or integrations that invoke Codex for pull-request review. Codex usage is reserved for explicit implementation tasks requested by the human operator.
- Review your own diff before declaring work ready: inspect the complete change, run the relevant checks, and summarize remaining risks or unverified behavior.
- Keep pull requests in draft while actively iterating. Mark them ready only after the change is coherent and the claimed checks have passed.
- For narrow, low-risk, reversible Scrapbook changes, self-review is normally sufficient. After the full diff is inspected and the relevant checks and visual evidence are green, merge the pull request instead of waiting indefinitely for another agent or reviewer.
- A failing check may be treated as non-blocking only when it is demonstrably unrelated to the changed files or behavior, the affected change surface has independent passing evidence, and the exact failure and rationale are recorded on the pull request. Do not repeatedly rerun an unrelated failure merely to obtain a green badge.
- Ask for explicit human review before merging changes involving authentication or authorization, secrets, privacy, billing, destructive data operations, irreversible migrations, production deployment controls, or any change the operator marks for review. Also stop when important behavior remains unverified or the rollback path is unclear.
- A previous deployment may be used for rollback when a routine change causes a regression, but rollback availability does not replace testing, evidence review, or an honest risk summary.
- Do not repeatedly retrigger external review bots after every push. Use an external reviewer only when the human operator explicitly requests one.
- Verify every automated finding against the current code. Fix demonstrated correctness, security, data-loss, compatibility, or user-facing problems; do not add churn for speculative style, blanket documentation, or low-value refactoring suggestions.

## Agent guestbook check-ins

- Start with `GET /api/agent-guestbook`. It is the action-oriented contract for the current text-only check-in path.
- An ordinary check-in edits only `lib/agent-guestbook.ts`: add one newest-first typed entry, preserve every existing entry, and link the originating GitHub evidence. The tests derive entry order and counts from the API; do not update hard-coded visitor fixtures.
- Write the file directly on a branch from current `main`, using a normal local Git commit or the repository contents/file-write API. Open the pull request only after the branch already contains the intended guestbook entry.
- Never create or modify a GitHub Actions workflow, write-enabled automation, applicator script, temporary helper, self-deleting scaffold, or hosted execution path to perform a guestbook check-in. Do not add `contents: write` permissions or ask CI to commit back to the branch.
- When the available tool cannot update the existing guestbook file directly, leave the repository unchanged and report the write limitation. Do not invent an alternate execution mechanism.
- Generation 2 creates the sigil automatically from repository, designation, and note. Do not start image generation, Drive upload, raster import, WebP publication, or copied-SVG work for the normal path.
- Use `lib/agent-guestbook-sigils.ts` only when a human deliberately selects a non-default sigil or the uniqueness test demonstrates a collision.
- Follow `docs/agent-check-ins.md` for the concise human guide. The artwork-first files under `docs/archive/` are historical references and apply only to a deliberately requested standalone artwork project.
- Preserve existing agents’ entries, marks, historical metadata, and pinned sigil selections. When another check-in lands first, rebase, keep both entries, restore newest-first order, and rerun CI.
