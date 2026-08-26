# Resume review and handoff playbook

This file is the handoff for future resume-review sessions. It records the current checkpoint, source hierarchy, what survived independent review, and how to keep iterating without churning strong copy.

## Canonical sources

Use these in order:

1. `work/resume-current.md` owns the current default one-page content selection.
2. `work/resume-candidates.md` is the larger reservoir of alternates, historical candidates, and material that may return for role-specific versions.
3. `work/preflight-resume-evidence-map.md` owns Preflight provenance, implementation breadcrumbs, measurement authority, and double-counting warnings.
4. `work/resume-portfolio-style.md` owns writing rules.
5. `work/resume-drafts/2026-08-25-v10.tex` is the current visual/layout baseline.

Source repositories and retained evidence outrank all career copy when facts change. The LaTeX draft is not a second wording authority. If the default wording changes, update `resume-current.md` and then carry the accepted wording into the next numbered draft.

## Current baseline: V10

`2026-08-25-v10.tex` is the current one-page checkpoint after the first independent review/Thunderdome round.

Current layout choices:

- Letter paper, 11pt document, Charter.
- Margins: 0.38in top, 0.42in bottom, 0.52in left/right.
- Bullet text: 10.6pt on 12.2pt leading.
- Section titles use normal Title Case, bold weight, and a divider rule. Do not use small caps or all-caps headings because PDF text extraction became noisy or visually loud.
- Section order: Open Source Engineering → Independent Engineering → Professional Experience → Education → Technical Skills.
- Open-source PR numbers are bold and stay immediately beside the exact clause they support.
- Preflight emphasis is mostly numeric. Avoid bolding whole explanatory phrases merely because the result is important.
- Preflight shows a visible parser-friendly `github.com/teamleaderleo/preflight` URL and a short product descriptor.
- Languages and Technologies use separate full-width lines so PDF extraction preserves reading order.
- Generated PDFs are review artifacts, not repository source. Track numbered `.tex` drafts, not every compiled binary.

## What the first Thunderdome established

Four independent reviewers produced written reviews and alternate TeX variants, then completed a forced-choice arbitration round.

Strong convergence:

- Keep all four current upstream repository rows by default: Vercel AI SDK, Cloud Hypervisor, Vite, Cloudflare Workers SDK.
- Do not force React onto the default page.
- Protect both IBM bullets.
- Preflight's default core is the flagship opening, shared JSON/data architecture, texture preparation/storage, campaign runtime, Janino, and desktop/productization.
- The aggregate `>12s` third-party callback receipt was the unanimous first Preflight cut. It remains strong portfolio/interview material.
- Texture prefetch + VRAM won the default seventh Preflight slot 3–1 over the linter or whitespace.
- The mod linter remains a strong role-specific alternate rather than a default bullet.
- The desktop sentence should keep cross-platform architecture, bundled Java, durable history, and signed updates/rollback. Ship wireframes and profile management move to portfolio material.
- `12,584 cached objects` does not need resume space. V10 keeps only the compact `~990k values` fidelity scale.
- The campaign defensive-copy `15.4M empty script calls` receipt moves to portfolio/interview material.
- V10 keeps the same-corpus texture-layout result `33.53s → 14.174s`; reviewers split 2–2, and the current editorial decision is that physical layout adds a distinct storage/locality signal.
- The current section order survived the arbitration plurality. Do not reorder sections casually without a real A/B test.

## Current Preflight default selection

V10 uses seven Preflight bullets:

1. flagship startup/reverse-engineering opening: **101s → 13.69s**
2. shared JSON/CSV read layer and typed-tree representation
3. texture-cache decision moved ahead of the **~27s** serialized prefetch queue plus **1.22 GiB VRAM** padding removal
4. campaign mutation-tracked indexes and **117.9M** unchanged recomputations avoided
5. texture publication/storage/physical layout
6. Janino compilation caching and generated-class deduplication
7. desktop productization

Default alternates:

- mod linter / source-side ecosystem analysis
- aggregate third-party startup callbacks
- React Fragment listener repair
- Stensibly
- Glaeda
- Glossless

A role-specific resume may swap alternates in, but something else should leave. Do not add projects merely because the page can physically fit them.

## Writing rules that survived repeated review

- Lead with the failure prevented, behavior changed, or system result. Do not lead with internal invariants or implementation variables.
- Consequence → fix → number → receipt is a strong default order.
- No semicolons in resume bullets. Avoid em dashes.
- Delete modifiers when removing them leaves the engineering claim unchanged.
- Keep modifiers only when they add technical meaning or scope (`obfuscated`, `third-party`, `single-threaded` can matter).
- Prefer one dense causal sentence to a benchmark mini-paragraph when the evidence belongs to one causal arc.
- Stable workload counts belong in the clause they explain.
- Lead with useful findings for analysis/linter tools, not calibration/null-result statistics.
- Never manufacture FPS or end-to-end deltas by adding component measurements from different runs.
- Use technical nouns an expert understands, but give enough context for a reader with zero Starsector knowledge.
- A heading may carry domain/product context, but it must not replace the project thesis.
- For upstream work, keep the PR number immediately after the exact clause it supports.
- If one short token or metric wraps onto its own line, prefer a local wording trim before shrinking the whole document.
- Do not add filler merely to occupy whitespace.

## Parser and rendering rules

- Check the rendered page after every material change.
- Also extract/copy the PDF as plain text and inspect reading order. V9/V10 caught two issues this way: small-caps headings extracted as spaced letters, and a side-by-side Skills line extracted out of order.
- Prefer visible URLs for important owned projects even when the text is clickable.
- Use normal Title Case section headings rather than small caps or all caps.
- Keep a small amount of bottom whitespace if the page reads better. Do not repack the page merely because room exists.

## How to run future cold review

Fresh reviewers should see the current PDF first, without this playbook or project history.

Ask for:

1. a 20–30 second skim and memory test
2. strongest and weakest claims
3. where close reading stopped
4. whether Preflight overwhelms upstream/IBM
5. a forced 15–20% cut
6. technical claims they would challenge in interview

Only after the cold review should a reviewer read the repository handoff and propose durable edits.

Repeated failure modes are signal. One reviewer preferring a synonym is noise.

## Next broader work

The resume thesis is stable enough to propagate outward.

Priority order:

1. Preflight README / technical overview: make the project legible as both a deep performance investigation and a finished cross-platform companion app. Do not copy resume density into the README.
2. Scrapbook / personal site: present the strongest engineering stories as separate narratives with room for mechanisms, failures, evidence, and visuals.
3. Portfolio/interview material: preserve the lock/restart/crash/invalidation failures, rejected experiments, measurement corrections, linter calibration, third-party callback work, Hangar tracing, and source breadcrumbs that are too detailed for the one-page resume.

The resume is now an index of the strongest receipts. The public docs should explain them rather than repeat them.