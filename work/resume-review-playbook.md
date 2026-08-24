# Resume review and handoff playbook

This file is the handoff for future resume-review sessions. It records the current checkpoint, what is already settled, and how to get useful outside criticism without immediately churning strong copy.

## Canonical sources

Use these in order:

1. `work/resume-candidates.md` owns the current career wording and candidate pool.
2. `work/preflight-resume-evidence-map.md` owns Preflight provenance, implementation breadcrumbs, measurement authority, and double-counting warnings.
3. `work/resume-portfolio-style.md` owns writing rules.
4. `work/resume-drafts/2026-08-25-v5.tex` is the locked visual/content-pressure baseline.

The LaTeX draft is not a second wording authority. If wording changes, update `resume-candidates.md` first and then carry the accepted wording into the next numbered draft.

## Current locked baseline: V5

`2026-08-25-v5.tex` is the current visual checkpoint. It deliberately includes the full current upstream set, the full Preflight candidate pool, both IBM bullets, Education, and Skills on one page. That proves the page has room before final content selection.

Current layout choices:

- Letter paper, 11pt document, Charter.
- Margins: 0.38in top, 0.42in bottom, 0.52in left/right.
- Bullet text: 9.9pt on 11.1pt leading.
- Tight section/list spacing and small negative vertical adjustments are intentional.
- Open-source PR numbers are bold.
- Preflight emphasis is mostly numeric. Avoid bolding whole explanatory phrases merely because the result is important.
- Education-to-Skills spacing is already compressed.
- Future layout iterations must use new filenames (`v6`, `v7`, etc.) rather than overwriting V5.
- Do not globally shrink typography or spacing again unless a concrete content change creates a demonstrated need. Prefer local wording trims when a wrap wastes a line.
- Generated PDFs are review artifacts, not repository source. Track the `.tex`, not every compiled binary.

## How to read the density

The page is intentionally technical. Density alone is not a defect. A reader can skim repository names, project headings, and bold measurements, stop after the Preflight opening, or continue into the deeper receipts. The important question for cold review is whether the density feels rewarding or whether readers actually lose the thread.

Do not preemptively delete technical substance because a future editor personally finds the page dense. Ask cold readers where they stopped, what they remembered, and which lines they wanted to discuss.

## Current Preflight shape

Preflight is intentionally over-complete in the candidate pool. The final resume does not owe every candidate a bullet.

The current strongest core is roughly:

1. flagship startup/reverse-engineering opening
2. JSON/CSV cache convergence and typed-tree representation
3. texture-cache durability/storage/physical-layout work
4. campaign runtime work at million-scale call volumes
5. desktop/productization story
6. Janino generated-bytecode caching/deduplication

Strong alternates include the texture/prefetch boundary, the aggregate third-party callback work, and the linter. The exact final cut should be informed by cold review and page composition rather than by repository ownership or a desire to show every technology.

SmolRunner and Glossless remain good portfolio material but currently add less new resume signal because virtualization/Rust and frontend/product work are already represented elsewhere. Stensibly is less redundant and remains worth testing if space is deliberately opened.

## Writing rules that survived repeated review

- Lead with the failure prevented, behavior changed, or system result. Do not lead with internal invariants or implementation variables.
- Consequence -> fix -> number -> receipt is a strong default order.
- Do not invent taxonomies or labels that the source does not need.
- No semicolons in resume bullets. Avoid em dashes.
- Delete adjectives/adverbs when removing them leaves the engineering claim unchanged.
- Keep modifiers only when they materially add scope or technical meaning (`obfuscated`, `third-party`, `single-threaded` can matter).
- Prefer one dense causal sentence to a benchmark mini-paragraph when the evidence belongs to one causal arc.
- Stable workload counts belong in the clause they explain, not in a detached sentence about how a benchmark was run.
- Lead with useful findings for analysis/linter tools, not calibration/null-result statistics.
- Do not manufacture FPS or end-to-end deltas by adding component measurements from different runs.
- Use technical nouns an expert understands, but give enough project context that someone with zero Starsector knowledge can follow the consequence.
- A heading may carry domain/product context, but it must not replace the project thesis.
- For upstream work, keep the PR number immediately after the exact clause it supports.

## How to run the Thunderdome

Start new review chats cold. Give the reviewer the current PDF first, without explaining Starsector, Preflight history, or why any bullet was selected. Do not prime them with this playbook before the first skim.

Recommended sequence:

### 1. Cold generalist skim

Ask the reviewer to spend about 20-30 seconds skimming. Then ask what they remember, where their attention went, where they stopped reading closely, what felt strongest, what felt unclear, and what they would cut if forced to remove 15% of the text.

### 2. Senior/staff engineer pass

Ask which claims make them want an interview, which claims sound weaker than their word count, which technical claims they would challenge, and what they would ask the candidate to substantiate.

### 3. Hiring-manager/recruiter pass

Ask whether the candidate story is coherent quickly, whether Preflight overwhelms the rest of the page, whether IBM and upstream credibility remain visible, and what they learn without reading every bullet.

### 4. Hostile editor pass

Require a 15-20% text reduction. Make the reviewer name exact clauses/bullets to remove rather than merely saying the page is dense.

### 5. Rewrite only after diagnosis

Do not ask every reviewer to rewrite the resume immediately. First collect failure modes. Rewrite only when multiple reviewers expose the same comprehension, redundancy, credibility, or hierarchy problem.

## How to interpret review disagreement

One reviewer preferring a synonym is noise. Repeated observations are signal.

High-value repeated signals include:

- several cold readers stop at the same bullet
- several readers misinterpret the same metric
- several readers cannot tell what Preflight is after the opening
- several senior engineers independently pick the same bullets as interview material
- several reviewers cut the same receipt under forced reduction
- the open-source/IBM sections disappear from memory because Preflight monopolizes attention

Do not optimize toward a single reviewer's personal prose taste. Keep source-supported technical substance unless it repeatedly harms comprehension or hierarchy.

## Layout iteration rule

Render after each material content change. Judge both page count and visual reading behavior. If one short token or metric wraps onto its own line, prefer a local wording trim before shrinking the whole document. V5 reached one page with the entire current pool, so future content cuts should generally buy readability or room for another genuinely distinct signal, not justify further global compression.

## Next broader work

Once cold review stabilizes the resume thesis, propagate the stable framing outward rather than updating every public document while the resume is still moving:

- Preflight README / technical overview: make the full engineering story easier to discover without weakening the evidence hierarchy.
- Scrapbook / personal site: give the strongest Preflight stories room to breathe instead of reproducing the dense one-page resume.
- Portfolio/interview material: preserve the lock/restart/crash/invalidation failures, rejected experiments, measurement corrections, and source breadcrumbs that are too detailed for the resume but excellent technical discussion material.
