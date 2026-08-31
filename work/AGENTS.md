# Work record agent instructions

These instructions apply to `work/`. Read the root [`AGENTS.md`](../AGENTS.md) first; its repository, review, and verification routes apply here.

## Purpose

`work/` is the personal engineering record and career-synthesis lane. Originating repositories remain the technical source of truth; work records carry evidence-backed interpretation and durable career context.

After substantive work elsewhere, independently ask whether it changes the durable record or current resume candidate pool.

## Before writing

1. Read the primary originating evidence: the exact issue, pull request, benchmark report, README evidence section, review, CI receipt, or current handoff.
2. Find the existing `work/` record that owns the story and extend it when one exists.
3. Separate current fact from interpretation. Preserve uncertainty with a verification note when status remains unresolved.
4. Prefer the strongest technical meaning over the most recognizable repository name.

## What earns a record

Record work when it crosses a useful evidence boundary, such as:

- a merged/published patch, meaningful maintainer acceptance, or a strongly validated distinctive candidate;
- a substantial measured performance result or a product becoming installable, usable, deployed, or externally observed;
- an investigation, negative result, reversal, or review interaction that changed the technical conclusion or repair boundary;
- a new portfolio axis such as compiler, VMM, runtime, browser tooling, distributed coordination, or packaging;
- a result with plausible resume, interview, portfolio, outreach, or career-narrative value.

Skip typo fixes, mechanical churn, routine dependency updates, superficial activity totals, and speculative findings that never reached a useful evidence boundary.

## Preserve reversals

Keep the evidence that changed the conclusion. A dropped optimization, disproven benchmark theory, corrected ownership boundary, repaired test path, or upstream supersession can be stronger evidence than an uninterrupted win.

Record why the updated decision was better.

## Resume candidate churn

`resume-candidates.md` is intentionally editorial. Rank by marginal signal on a one-page resume: distinct proof, external validation or measurable consequence, quick technical legibility, defensible claims, and fit for the target role.

A durable record survives changes in resume ranking.

## Moving benchmark owners

`records/preflight-live-performance.md` solely owns the current career-facing Preflight headline and moving performance numbers. Use it ahead of older timing prose when numbers conflict. `preflight-resume-evidence-map.md` is the provenance index.

Historical benchmark material remains evidence for the question it answered. Copy current career-facing Preflight numbers from the live-performance owner instead of freezing them into this instruction file.

## Evidence and voice

Apply the repository-wide GitHub-reference rule in [`docs/agent-access.md`](../docs/agent-access.md#github-references) to every durable evidence link.

Write plainly and technically. Strong evidence can sound proud. Describe the mechanism or consequence instead of generic praise such as "high-impact" or "complex."

Prefer:

> Replaced SSH loss as a VM-shutdown proxy with the VMM's exact shutdown event before disk/VM reuse.

over:

> Made a high-impact contribution to a complex virtualization platform.

## Pull requests

Use the ordinary Scrapbook branch/pull-request and Markdown verification path from the root instructions. Multiple agents may collaborate on one coherent work-record PR. When another PR lands first, rebase or resolve the Markdown conflicts while preserving both records, then inspect the complete diff.
