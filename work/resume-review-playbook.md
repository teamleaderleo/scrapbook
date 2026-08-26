# Resume review and handoff playbook

This file is the handoff for future resume-review sessions. It records the current checkpoint, source hierarchy, what survived independent review, and how to keep iterating without churning strong copy.

## Canonical sources

Use these in order:

1. `work/resume-current.md` owns the current default one-page content selection and wording.
2. `work/records/preflight-live-performance.md` owns the current career-facing Preflight performance headline and moving performance numbers.
3. `work/resume-candidates.md` is the larger reservoir of alternates, historical candidates, and material that may return for role-specific versions.
4. `work/preflight-resume-evidence-map.md` owns Preflight provenance, implementation breadcrumbs, and double-counting warnings. It is an evidence index, not a competing current-headline authority.
5. `work/resume-portfolio-style.md` owns writing guidance.
6. `work/resume-drafts/2026-08-25-v10.tex` is the current visual/layout baseline.

Source repositories and retained evidence outrank all career copy when facts change. The LaTeX draft is not a second wording authority. If the default wording changes, update `resume-current.md` and then carry the accepted wording into the next numbered draft.

## Preflight measurement rule

The selected career-facing headline is **101s → 13.69s**. Preserve it exactly unless Leo explicitly chooses a new headline.

The accumulated current run history may be used to show that the current regime is repeatable, but **do not replace 13.69s with a median or rounded value**. Likewise, do not replace the headline with the historical 89.00s → 15.53s same-session A/B pair.

Every startup run measured with the same game-log clock is an elapsed-time observation of the same quantity. A named campaign may make a pair useful for a causal comparison, and its permutation statistics may help answer that comparison question, but neither the campaign label nor the statistics give those elapsed times a privileged status for resume wording.

Archived reviewer notes that question whether 13.69s is the “right” endpoint because it is a best/low run are superseded on this editorial point. They remain useful for their other resume feedback.

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

These describe V10. A later target, rendering problem, or stronger editorial choice can change them without first proving the old choice wrong.

## What the first Thunderdome observed

Four independent reviewers produced written reviews and alternate TeX variants, then completed a forced-choice arbitration round. That process is historical context for V10, not a required method for future review.

Review-round observations:

- Reviewers favored keeping the four current upstream repository rows: Vercel AI SDK, Cloud Hypervisor, Vite, Cloudflare Workers SDK.
- React did not earn default-page space in that round.
- V10 kept both IBM bullets; future target-specific or space-driven edits may revisit that choice.
- The V10 Preflight core became the flagship opening, shared JSON/data architecture, texture preparation/storage, campaign runtime, Janino, and desktop/productization.
- The aggregate `>12s` third-party callback receipt was the unanimous first Preflight cut. It remains strong portfolio/interview material.
- Texture prefetch + VRAM won the seventh V10 Preflight slot 3–1 over the linter or whitespace.
- The mod linter remained a strong role-specific alternate rather than a default bullet.
- Reviewers favored keeping cross-platform architecture, bundled Java, durable history, and signed updates/rollback in the desktop sentence. Ship wireframes and profile management moved to portfolio material.
- `12,584 cached objects` did not earn V10 space. V10 kept only the compact `~990k values` fidelity scale.
- The campaign defensive-copy `15.4M empty script calls` receipt moved to portfolio/interview material.
- V10 kept the same-corpus texture-layout result `33.53s → 14.174s`; reviewers split 2–2, and the editorial choice at that checkpoint was that physical layout added a distinct storage/locality signal.
- The section order is a V10 checkpoint, not a permanent rule. Reorder it when a target role or a concrete reading problem gives a reason; reviewer votes do not create an obligation to run an editorial A/B experiment.

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

Role-specific changes should keep the one-page resume legible and make additions earn their space. Do not mechanically require a one-for-one swap merely because the current checkpoint has a particular count.

## Useful writing heuristics from repeated review

These are working defaults for readability, not a mandatory sentence template. Keep the ones that solve a real problem in the current bullet; ignore one when another phrasing is clearer and equally accurate.

- Lead with the failure prevented, behavior changed, or system result when that gives the reader the point sooner than an implementation noun.
- Consequence → fix → number → receipt is a useful default when that order reads naturally, not a required template.
- Use punctuation that keeps a dense bullet easy to parse. Semicolons and em dashes are fine when they improve the sentence; do not ban or add them mechanically.
- Delete modifiers when removing them leaves the engineering claim unchanged.
- Keep modifiers when they add technical meaning or scope (`obfuscated`, `third-party`, `single-threaded` can matter).
- Prefer one dense causal sentence to a benchmark mini-paragraph when the evidence belongs to one causal arc.
- Stable workload counts usually read best in the clause they explain.
- Lead with useful findings for analysis/linter tools rather than calibration/null-result statistics when the finding is the accomplishment.
- Never manufacture FPS or end-to-end deltas by adding component measurements from different runs.
- Use technical nouns an expert understands, but give enough context for a reader with zero Starsector knowledge.
- A heading may carry domain/product context, but it should not be asked to carry the complete project thesis by itself.
- For upstream work, keep the PR number close enough to the clause it supports that attribution stays legible.
- If one short token or metric wraps onto its own line, try a local wording trim before shrinking the whole document.
- Do not add filler merely to occupy whitespace.

## Parser and rendering checks

- Check the rendered page after a material layout or wording change that could affect wrapping or hierarchy.
- Also extract/copy the PDF as plain text when reading order may have changed. V9/V10 caught two issues this way: small-caps headings extracted as spaced letters, and a side-by-side Skills line extracted out of order.
- Prefer visible URLs for important owned projects when parser legibility matters even if the text is clickable.
- V10 uses normal Title Case section headings rather than small caps or all caps because those alternatives produced worse extraction or visual results in that checkpoint.
- Keep a small amount of bottom whitespace when the page reads better. Do not repack the page merely because room exists.

## How to run future cold review

A cold reviewer should see the artifact before being given the repository's editorial history; otherwise the handoff can prime the very judgment the review is meant to observe.

The review should answer questions that can actually change the page: what was remembered on a quick scan, which claims felt strongest or weakest, where attention or comprehension broke, whether the section balance worked, what the reviewer would cut if space became tight, and which technical claims they would challenge in interview.

There is **no required skim duration, cut percentage, reviewer count, or forced-choice ritual**. Use whatever review setup exposes a real reading problem. Only after the cold read should a reviewer inspect the repository handoff when that context is useful.

Repeated failure modes are signal. One reviewer preferring a synonym is usually noise.

## Possible broader follow-up

The resume can project outward into other surfaces when there is a concrete reason to work on them:

- Preflight README / technical overview can make the project legible as both a deep performance investigation and a finished cross-platform companion app without copying resume density.
- Scrapbook / personal site can give the strongest engineering stories room for mechanisms, failures, evidence, and visuals.
- Portfolio/interview material can preserve the lock/restart/crash/invalidation failures, rejected experiments, measurement corrections, linter calibration, third-party callback work, Hangar tracing, and source breadcrumbs that are too detailed for the one-page resume.

The resume is an index of the strongest receipts. Public docs can explain them rather than repeat them.
