# Engineering impact ledger

This directory keeps a compact, evidence-backed record of engineering consequences that are easy to lose inside a large pull-request history.

The originating repository remains authoritative. These records preserve the useful interpretation: what changed, what was measured, which numbers are baselines versus reductions, and which claims may overlap.

## Files

- records/ contains curated Markdown records with machine-readable front matter.
- sources/github-prs.jsonl is the compact offline snapshot used to mine future candidates without repeatedly querying GitHub.
- sources/sync-state.json records the configured sources and the last incremental sync.
- public/data/impact-index-v1.json is the generated compact query index.
- public/data/impact-summary-v1.json is the generated aggregate and headline view.

The generated files are projections. The Markdown records are canonical for curated impact claims.

## Claim discipline

Every quantitative claim carries:

- dimension and metric;
- direction: baseline, reduction, shift, reliability, or throughput;
- value and unit;
- recurrence;
- confidence: measured, derived, projected, or observed;
- measurement window and population when known;
- an overlap group when another claim could touch the same population.

Only claims explicitly marked additive may be summed. Baselines, capacity shifts, projected savings, and overlapping claims stay separate.

This is deliberate. A paid-runner routing change can overlap with a later change that eliminates some of the same runner minutes. A critical-path reduction can also save compute without implying that every minute is an engineer-minute. Dollar scenarios belong downstream of the factual claims and their accounting assumptions.

## Local use

Refresh the compact GitHub snapshot:

    pnpm impact:sync

Force a full refresh:

    pnpm impact:sync -- --full

The sync uses one GitHub GraphQL search page per 100 matching pull requests. It stores titles, dates, diff statistics, labels, a body digest, and a bounded set of metric-bearing lines; it does not keep every full PR body.

Rebuild the public query files after editing curated records:

    pnpm impact:build

Verify the generated files match the records:

    pnpm impact:audit

Query curated records without any GitHub traffic:

    pnpm impact:query -- cache
    pnpm impact:query -- --area ci
    pnpm impact:query -- --dimension reliability

Mine the raw snapshot for uncurated candidates:

    pnpm impact:query -- --candidates latency
    pnpm impact:query -- --candidates --repo manaflow-ai/cmux

## Public read path

The site exposes the generated index at /api/work-impact and a human view at /work/impact.

The API supports q, repo, area, dimension, and id query parameters. A fresh agent can therefore inspect the impact record with one small request instead of walking hundreds of GitHub pull requests.
