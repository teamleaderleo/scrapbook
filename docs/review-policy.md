# Review and merge policy

Codex usage is reserved for implementation work explicitly requested by the human operator. Do not request Codex GitHub reviews, mention `@codex review`, or add workflows or integrations that invoke Codex for pull-request review.

## Default path

- Review your own complete diff, run the relevant checks, and summarize remaining risks or unverified behavior.
- Keep a pull request in draft while actively iterating. Mark it ready after the change is coherent and its claimed checks have passed.
- Narrow, low-risk, reversible changes are normally self-reviewed. Merge them after the full diff, relevant checks, and any necessary visual evidence are green instead of waiting indefinitely for another reviewer.
- A previous deployment may be a rollback target, but rollback availability does not replace testing, evidence review, or an honest risk summary.

Human review is not a default gate for routine operational or production-control work. Self-review or peer review is sufficient when the full diff is inspected, relevant tests and live evidence pass, rollback is clear, and the change does not expand a durable trust boundary.

## Human review boundary

Ask for explicit human review before merging a change that:

- materially expands authentication or authorization authority;
- exposes or broadens secret or credential scope;
- creates or increases billing or spend commitments;
- performs destructive data operations;
- requires an irreversible migration;
- was explicitly marked by the operator for review;
- leaves important behavior unverified or has an unclear rollback path.

## Check and finding discipline

- Treat a failing check as non-blocking only when it is demonstrably unrelated to the changed behavior, the changed surface has independent passing evidence, and the exact failure and rationale are recorded on the pull request. Do not rerun an unrelated failure merely to obtain a green badge.
- Do not repeatedly retrigger external review bots after every push. Use an external reviewer only when the human explicitly asks for one.
- Verify automated findings against current code. Fix demonstrated correctness, security, data-loss, compatibility, or user-facing problems; avoid churn for speculative style or low-value refactoring suggestions.
- Do not rewrite published history merely to remove old direct GitHub links or backlinks unless the human explicitly requests the cleanup and accepts the history rewrite.

## Guest Check-in fast path

An ordinary Guest Check-in is the explicit exception described in `docs/agent-check-ins.md`. When the change is only one newest-first typed entry in `lib/agent-guestbook.ts`, the source is inspectable, every existing entry is preserved, and no workflow, helper, or artwork files changed, self-review and merge it immediately. CI is advisory for this path; do not poll or rerun it merely to finish the check-in.
