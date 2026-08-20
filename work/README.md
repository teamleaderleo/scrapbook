# Work

This directory is Leo's living record of engineering work: shipped results, strong investigations, useful reversals, external validation, measurements, and stories that may later become resume, portfolio, interview, or outreach material.

It is deliberately broader than a resume and narrower than a raw activity log.

The source repositories remain authoritative for code, issues, pull requests, benchmarks, reviews, CI receipts, and product state. `work/` is a synthesis layer: it records what happened, why it matters, and how the evidence may be useful without pretending to replace the primary source.

## Why this exists

A one-page resume has to throw almost everything away. LinkedIn also flattens independent engineering into a poor imitation of employment history. Neither is a good place to remember the actual work.

This directory keeps the larger record so that later resume work can select from evidence instead of reconstructing months of work from memory.

The operating idea is simple:

- record concrete work generously;
- distinguish fact from interpretation;
- preserve reversals and failed theories when they demonstrate useful judgment;
- let resume rankings churn without rewriting history;
- keep links to the canonical evidence;
- do not manufacture impact merely because a repository name is recognizable.

A second operating principle is **append first, reconcile later**. Leo often synthesizes quickly and then moves on. The record should make that sustainable: capture useful conclusions while they are fresh, then let later agents retrieve, compare, deduplicate, challenge, and compress the corpus when a concrete decision needs it.

Agents are therefore part of the retrieval layer as well as the implementation layer. They should be able to bring old evidence back into working memory, notice stale claims, and answer "haven't I already done something like this?" without forcing the human to reconstruct old context from chats.

## Files

- [`portfolio-inventory.md`](portfolio-inventory.md) — unified retrieval index across owned systems, upstream contributions, adopted findings, reversals, reports, and research-only work; start here before a resume or LinkedIn rewrite.
- [`resume-candidates.md`](resume-candidates.md) — intentionally churny ranking of the strongest current resume material.
- [`records/preflight.md`](records/preflight.md) — detailed Preflight performance/product evidence and candidate stories.
- [`records/open-source.md`](records/open-source.md) — selected open-source engineering evidence and the larger bench.
- [`records/working-style.md`](records/working-style.md) — append-first synthesis, domain-agnostic slope, agents-as-retrieval, and the recall-practice model.
- [`records/vercel-fit-2026-08-11.md`](records/vercel-fit-2026-08-11.md) — point-in-time Vercel role-fit calibration and current earlier-shaped role evidence.
- [`records/interview-success-set.md`](records/interview-success-set.md) — all-cause interview coverage model, current risk ranking, and backlog-derived drill generator.
- [`records/prerequisite-doctrine.md`](records/prerequisite-doctrine.md) — remove interview information asymmetry by mapping explicit/implied prerequisites, personal deltas, and required mastery depth before studying.
- [`records/cpp-positioning.md`](records/cpp-positioning.md) — C++ as a role prerequisite and market shift rather than an automatic differentiation strategy.
- [`records/frontend-positioning.md`](records/frontend-positioning.md) — frontend as first-class product engineering, where it differentiates, and where artistic experimentation belongs.
- [`archive/2026-08-11-signal-audit.md`](archive/2026-08-11-signal-audit.md) — first broad snapshot of the current body of work and the narrative it supports.
- [`AGENTS.md`](AGENTS.md) — local instructions for agents updating this record.

The inventory is intentionally the central index rather than a second source of technical truth. Detailed records own the deeper story; source repositories and upstream threads own the facts.

## What belongs here

Good candidates include:

- a shipped or accepted change with a concrete technical story;
- a measured performance result with a defensible measurement boundary;
- an investigation that materially changed the chosen design;
- a negative result that prevented a wrong or unsafe change;
- a maintainer interaction that demonstrates review judgment or repair-boundary understanding;
- a product milestone that changes the external credibility of an independent project;
- a strong cross-repository pattern that says something useful about Leo's engineering style.

Not every PR, commit, issue, or experiment deserves an entry. Volume is evidence only when the individual work survives scrutiny.

## Evidence language

Prefer precise states over prestige language:

- `merged` / `published` when that happened;
- `maintainer-approved` when approval exists but merge is separate;
- `submitted` when the upstream PR exists;
- `validated candidate` when the implementation is proven in an owned carrier but not submitted;
- `investigation` when the mechanism is established but the repair is not ready;
- `superseded` or `negative result` when later evidence changed the conclusion.

Do not silently turn an owned-fork candidate into an upstream contribution. Do not erase a useful result because it was not merged. The job is accurate signal, not bureaucratic scorekeeping.

## Public posture

This material is intentionally personal and can be candid about technical judgment. It should still be written so that a curious engineer, recruiter, or hiring manager could read it without needing private conversation context.

The public `/work` surface is a readable projection of selected records, not a dump of every internal ranking note. Its typed selection lives in `lib/work-records.ts` and is available to human readers at `/work` and machine readers at `/api/work`. The repository remains more exhaustive than the site.
