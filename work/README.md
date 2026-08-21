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

## Files

- [`current-state.md`](current-state.md) — short live-status overlay across the current body of work; read this first when repository status has moved faster than the deeper records.
- [`portfolio-inventory.md`](portfolio-inventory.md) — unified retrieval index across owned systems, upstream contributions, adopted findings, reversals, reports, and research-only work.
- [`resume-candidates.md`](resume-candidates.md) — intentionally churny ranking of the strongest current resume material.
- [`resume-language-bank.md`](resume-language-bank.md) — richer candidate bullets, application theses, and interview story formulations that are worth preserving even when they do not fit the current one-page cut.
- [`fit-and-interviews.md`](fit-and-interviews.md) — living hypotheses about role/team/interview fit, questions that can discriminate those hypotheses, and signals to retain after hiring processes.
- [`interview-calibration.md`](interview-calibration.md) — preparation-sensitive interpretation of interview/test performance and how to make future interview targets legible enough to train for deliberately.
- [`records/preflight.md`](records/preflight.md) — detailed Preflight performance/product evidence and candidate stories.
- [`records/open-source.md`](records/open-source.md) — selected open-source engineering evidence and the larger bench.
- [`archive/2026-08-11-signal-audit.md`](archive/2026-08-11-signal-audit.md) — first broad snapshot of the current body of work and the narrative it supports.
- [`AGENTS.md`](AGENTS.md) — local instructions for agents updating this record.

For current status, read `current-state.md` first. The inventory remains the central durable retrieval index rather than a second source of technical truth. Detailed records own the deeper story; source repositories and upstream threads own the facts.

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
