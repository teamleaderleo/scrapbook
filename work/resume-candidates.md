# Resume candidates

This file is intentionally churny. It answers: **if Leo had to ship a one-page resume today, which evidence earns the space?**

The ranking should change as work lands, products ship, users appear, and target roles change. Falling out of this file does not make work less real; it means the marginal signal is weaker than something else competing for the same line.

## Current market framing

Working description:

> Software engineer with roughly three years of substantive engineering experience: about sixteen months of conventional industry employment plus roughly two years of independent/open-source/product engineering.

Avoid claiming three years of full-time post-graduate professional employment. Avoid calling the profile "0 YOE" when the question is ordinary software-engineering experience.

The resume itself probably does not need a YOE headline. Let the chronology and evidence support the answer when asked.

### Recent role-fit prompt

Recent recruiter outreach described a senior software-engineering contract centered on code/architecture review, technical writing, and benchmark development for coding agents. The sourcing path is unknown and may have been automated, so **do not treat the outreach itself as external validation or evidence that a Snorkel/Terminal engineer manually selected the portfolio**.

The useful part is narrower: the role description is a concrete fit hypothesis worth testing against the existing work.

- Preflight demonstrates benchmark design, instrumentation, controlled comparison, and technical writing around a difficult real system;
- the upstream work demonstrates repeated code review, repair-boundary judgment, and externally accepted changes in unfamiliar repositories;
- SmolRunner demonstrates disposable execution, recovery, and hostile-CI concerns that become directly relevant when evaluating generated code;
- Stensibly demonstrates sustained work on agent coordination, authority, provenance, and continuation.

Keep recruiter sourcing and technical fit separate. A coding-agent benchmark role surfacing in this direction is useful context for application targeting; it is not a resume accomplishment or a market endorsement by itself.

## General one-page cut — current recommendation

### Header

No summary paragraph unless a target application clearly benefits from one. Name, contact, GitHub, site, LinkedIn.

Possible quiet descriptor if space remains useful:

> Software Engineer — Runtimes, Developer Tools & Performance

Do not over-specialize if the target role is generalist.

### Selected Open-Source Engineering

#### 1. Vercel AI SDK — absolute lock

The current AI SDK signal is broader than one merged patch:

- PR #18570 merged and published directly after upstream review;
- the async-stream reader-lock investigation in PR #18371 was approved by AI SDK Factory, then landed through Factory PR #18400 with `teamleaderleo` explicitly credited as a co-author in the merged fix commit;
- the streamed size-limit/cancellation-error repair in PR #18572 was likewise approved, then landed through Factory PR #18695 with explicit co-author credit;
- the size-limit repair was also merged into the maintained v5 and v6 release branches through Factory PRs #18700 and #18702.

That is stronger than "contributed to Vercel AI SDK." It shows one direct merge plus two cases where Vercel's own automated maintenance workflow independently reproduced/adopted the repair and preserved contributor credit.

Candidate bullet family:

> Fixed stateful URL matching in `@ai-sdk/provider-utils` (merged/published) and developed two additional Web Streams cleanup/error-precedence repairs adopted by Vercel's AI SDK Factory into merged upstream commits with co-author credit; one repair was backported across maintained v5/v6 release branches.

More mechanism-heavy alternative if one line can become two:

> Made global/sticky URL-regex checks deterministic by restoring caller-owned `lastIndex`; separately fixed stream-reader cleanup after source errors and preserved actionable size-limit errors when cancellation itself fails, with the latter propagated across three maintained AI SDK branches.

Use "credited as co-author in Factory-authored merged commits" when attribution detail matters. Do not imply the Factory bot itself is a human collaborator.

#### 2. Cloud Hypervisor — lock

The two merged changes already earn the entry. The newer QCOW ownership/refcount repair now adds meaningful maintainer acceptance even while it remains open.

Candidate bullet family:

> Landed two Cloud Hypervisor fixes: replaced SSH-loss shutdown proxies with the VMM's exact shutdown event before VM/disk reuse, and propagated ACPI address/`fw_cfg`/guest-memory failures through typed VM boot errors instead of panicking.

A second line can mention validation breadth if the role is systems-heavy:

> Validated the ACPI path across x86_64/AArch64 KVM/MSHV plus fw_cfg, TDX, Clippy and the repository's RISC-V build.

Current follow-on: PR #8721 moves QCOW L2 refcount ownership before L1 publication so failure cannot leave a reachable table eligible for allocator reuse after reopen. `weltling` approved the direction and regressions; `rbradford` later found a remaining deferred-release error window and requested that the old-L2 release be made local to the handoff. The current head folds that review into the implementation and removes the deferred release path. GitHub still carries the earlier requested-changes review pending a refreshed review, so do not call this landed or fully approved yet.

For a general resume, the first merged-work line may be enough. For systems roles, the QCOW review story is already excellent interview material even before final disposition.

#### 3. Cloudflare Workers SDK — strong current

The Miniflare teardown/lifecycle PR #15143 and the Access credential fix #15080 are both **merged**.

Candidate bullet family:

> Landed a Miniflare teardown fix that starts `workerd` termination before independent browser/proxy cleanup can delay it, preserves the first cleanup failure, waits for runtime exit, and continues remaining teardown.

Useful paired line for Cloudflare/devtools roles:

> Separately fixed stale Cloudflare Access service-token headers surviving environment changes by separating current credential state from legitimately cached interactive authorization; the repair merged with regression coverage for removed and incomplete credentials.

This is now a two-merge Cloudflare cluster spanning teardown lifecycle and credential/cache state correctness.

#### 4. Vite — promoted current

Vite now has enough external validation to stand as a real resume specimen rather than a bench logo:

- PR #23207 merged: closes temporary Rolldown optimizer-analysis bundles on success and error;
- PR #23165 remains open but has approvals from two Vite maintainers: preserves Rollup/Rolldown `closeBundle(error)` semantics after `buildEnd` failure;
- PR #23208 remains active around repeated config-resolution idempotence and has already incorporated maintainer test-placement feedback.

Candidate bullet family while #23165 remains open:

> Fixed Vite optimizer resource leakage by closing temporary custom-extension Rolldown analysis builds on success/error; separately aligned dev-server teardown with Rollup/Rolldown `closeBundle(error)` semantics after `buildEnd` failure, approved by two Vite maintainers.

If #23165 merges, simplify the status language and treat the pair as two landed lifecycle/correctness fixes.

#### 5. SWC — compiler-axis pending slot

The original SWC investigation included discarded-result `instanceof` observability. A maintainer explicitly preferred retaining SWC/Terser's existing assumption for that path, so the current PR was narrowed instead of defending the broader semantics change.

PR #12110 now targets the cleaner correctness bug: operand-shape constant folding can produce the **wrong boolean result**, for example folding a null-prototype object as `instanceof Object` incorrectly. The current head removes those unsafe folds and keeps the existing discarded-result behavior unchanged. There is no current maintainer approval; the latest maintainer thread is outdated against the current diff but remains unresolved.

Candidate bullet family if the narrowed direction lands:

> Fixed incorrect SWC `instanceof` constant folding that could return the wrong boolean for null-prototype objects; removed unsafe operand-shape folds and added regressions in the repository's existing optimizer/minifier fixtures.

This is still useful because it adds a compiler/minifier axis, but the current claim should be the narrower constant-folding repair rather than the earlier `Symbol.hasInstance`/discarded-result thesis.

#### Bench / alternates

- Zustand hydration generation race — technically clean, lower marginal signal after AI SDK/Cloudflare; useful if upstream attribution becomes especially strong.
- BuildKit rootless/rootful reproducibility — excellent for systems-specific applications.
- Playwright MCP shutdown authority — reported a reachable production lifecycle-control route; a Playwright maintainer subsequently merged PR #42133 gating `/killkillkill` under test and closed the report as completed. Good accepted-finding story, probably not scarce one-page space.
- Bat/Delta/fd/urllib3/Serde/Rspack — strong Fieldwork/portfolio/interview bench; promote selectively with upstream validation or target-role fit.
- runc #5389 — interview story, not current resume headline.

### Independent Engineering

#### Preflight — absolute lock, largest allocation

Do not compress Preflight into a single generic project bullet. It is the strongest owned-work proof and should receive roughly **three dense bullets / six-ish lines** in Leo's actual typography.

The 2026-08-15 controlled campaign materially improves the headline evidence. On one 83-mod profile, in one interleaved session, five accepted baseline runs and five accepted accelerated runs measured **89.00s → 15.53s**, with no exclusions. PR #440 has now merged that comparison into the project's published claim/docs; the older 101s and 15.88s points remain chronology, not the preferred before/after pair.

Current story families:

**Outcome / product**

Candidate wording from the controlled pair:

> Built a Java-agent performance layer for an 83-mod Starsector installation; a controlled interleaved campaign measured main-menu startup at 89.00s baseline versus 15.53s accelerated across five accepted runs per condition, with no exclusions.

If the resume needs one more clause, spend it on safety/compatibility rather than another number:

> ... while exact source/classloader/bytecode gates automatically return changed or unsupported inputs to the original runtime path.

Do not compare the historical ~101s worst case to the 15.53s controlled accelerated median as if they were one experiment.

**Runtime / compatibility**

> Precompute and replay merged game/mod data, textures, audio, resource indexes and Janino-generated class maps through exact source/classloader/bytecode-shape gates; changed, corrupt or unsupported inputs automatically fall back to the original runtime path.

**Investigation / performance**

> Built JFR, seam-level timing and unattended A/B tooling that exposed critical-path bottlenecks hidden by logs/profilers—including a ~27s prefetch wait and million-scale resource-path walks—and repeatedly killed lower-value optimization theories before implementation.

Possible role-specific swaps:

- Janino direct aggregate 18.014s → 2.364s / 86.9%;
- 1.22 GiB texture padding removed;
- resource/path construction story;
- audio predecode architecture;
- Tauri/multi-platform packaging and opt-in diagnostics;
- current transformed-class / prepared-texture activation evidence.

For Valve/performance roles, Preflight can consume more space and Stensibly can disappear.

#### Stensibly — one dense line in general cut

The useful distinction is not "made an MCP app." It is the responsibility/authority model and live hosted implementation.

Candidate:

> Built and operate a hosted human-agent responsibility/authority ledger across Cloudflare Workers, Convex, REST and MCP, with durable claims/leases, idempotent commands, scoped credentials and compare-and-swap GitHub publication.

One line is probably enough unless the target is agent infrastructure/distributed coordination.

#### SmolRunner — optional one dense line

Candidate:

> Building a Rust controller for disposable GitHub Actions workers on Lima, with pinned worker/template identity, durable no-replay lifecycle checkpoints, capacity admission, crash recovery and fail-closed VM ownership/cleanup.

Good for systems/infra/security roles. For broad product roles it may lose the space to Glossless or disappear entirely.

#### Glossless — role-specific

Use for frontend/product/graphics roles. The project gives visual/product breadth and a concrete deployed surface that Stensibly/SmolRunner do not replace.

Do not force it into every cut merely because it was historically a major resume project.

### Industry Experience

#### IBM — compact corroboration

IBM proves conventional team/employer experience. It no longer needs to define the page.

Likely one or two bullets:

- Java E2E/integration work across IBM Cloud AI/ML/big-data paths with Kafka/Spark/Snowflake and hybrid/on-prem environments; critical RBAC issue coordinated across three teams.
- Onboarding/setup reduced 3h → 15m through a consolidated maintained workflow/documentation path.

Do not over-polish IBM into something more technically important than the current work. Its value is conventional production/team context.

### Education

One line near the bottom:

> University of Toronto — BSc, Mathematics, Statistics & Computer Science — 2024

### Skills

Keep boring and compact.

Current default candidate:

> **Languages:** TypeScript/JavaScript, Rust, Java, Python, Go, SQL
> **Technologies:** Linux, React, Node.js, Cloudflare Workers, Docker, AWS, PostgreSQL, Git

Tailor lightly by role.

Do not put KVM/MSHV/fw_cfg/TDX in the generic skills line merely because Cloud Hypervisor validation touched them. Those details belong in the evidence that used them.

## Target cut: Vercel / devtools / AI runtime

Priority order:

1. Vercel AI SDK — direct merge plus Factory-adopted/co-authored fixes is now the strongest upstream cluster.
2. Cloud Hypervisor (proves range outside TS/AI).
3. Cloudflare Workers SDK — two merged lifecycle/state correctness fixes.
4. Vite — one merge plus a two-maintainer-approved lifecycle repair.
5. SWC rises above Vite if the narrowed constant-folding repair is accepted and the compiler/minifier axis is useful for the target.
6. Preflight, framed as runtime/instrumentation/performance and controlled evaluation rather than game fandom first.
7. Stensibly gets one stronger line because agent coordination/MCP/hosted authority is relevant.
8. SmolRunner rises when the role touches coding-agent execution, sandboxes, CI, or benchmark harnesses.

Useful application thesis:

> Already able to enter Vercel-owned code, understand lifecycle/state boundaries, and produce fixes that merge directly or are adopted by the AI SDK Factory with retained co-author credit; independent work shows the same ability generalizes beyond the codebase.

Do not imply OSS creates entitlement to an interview. It makes a targeted cold application unusually well-supported.

## Target cut: coding-agent evaluation / benchmark engineering

This is now a concrete target category rather than only a hypothetical one.

Priority order:

1. **Preflight** — controlled experiments, benchmark design, instrumentation, falsifiable claims, technical evidence writing.
2. **Vercel AI SDK** — AI-tooling codebase familiarity plus upstream accepted lifecycle/error-state work.
3. **SmolRunner** — disposable execution, exact worker identity, crash recovery, cleanup, hostile-CI thinking.
4. **Cloud Hypervisor / Vite / Cloudflare** — diverse specimens of code review and lifecycle/correctness reasoning in unfamiliar codebases.
5. **Stensibly** — agent authority, continuation, provenance, and coordination.

Useful thesis:

> Already doing the ingredients of coding-agent benchmark work: entering arbitrary repositories, finding behavioral boundaries, writing discriminating regressions, building reproducible execution/evidence systems, and explaining why a result is trustworthy.

This target is where the breadth becomes unusually coherent rather than looking scattered.

## Target cut: Valve / game/runtime/performance

Priority order changes substantially:

1. **Preflight dominates the page.** Give it the most acreage.
2. Cloud Hypervisor.
3. Best systems/compiler OSS specimens.
4. SmolRunner may beat Stensibly because runtime/crash/recovery systems are more relevant.
5. Glossless can appear if visual/graphics/product breadth helps.
6. Web-library correctness examples are supporting evidence, not identity.

Possible Preflight emphasis:

- controlled 89.00s → 15.53s same-profile campaign;
- runtime instrumentation of an obfuscated game/mod ecosystem;
- Java bytecode transformations;
- JFR and critical-path performance work;
- graphics/audio/resource-loader investigation;
- generated code / Janino;
- Rosetta/JIT/platform behavior;
- mod compatibility and fail-open source drift;
- real desktop packaging, updater/rollback, diagnostics and gameplay pilots.

The pitch is not "Starsector modder." It is "engineer who cracked open a real game/mod runtime, built instrumentation around it, made it radically faster, and productized the result without owning the underlying source ecosystem."

## Target cut: systems / infra

Priority order:

1. Cloud Hypervisor.
2. BuildKit or another strong Linux Fieldwork candidate if externally validated.
3. Preflight runtime/bytecode/performance.
4. SmolRunner.
5. Vercel AI SDK as cross-language correctness proof.
6. Cloudflare as state/credential/lifecycle semantics.

If the QCOW L2 ownership repair lands, Cloud Hypervisor becomes an even stronger lead because the accepted work then spans VM lifecycle, boot error propagation, and block-image metadata ownership.

Stensibly becomes optional unless the role values distributed coordination.

## What not to do

- Do not make the page a logo wall.
- Do not list every open PR to prove volume.
- Do not over-index on "high impact" wording without a specific mechanism/result.
- Do not call independent work freelance work unless client/service work actually happened.
- Do not call the profile 0 YOE when the question is ordinary engineering experience.
- Do not claim three years of conventional post-grad full-time employment.
- Do not let IBM sit above the current work simply because it is an employer name.
- Do not waste Preflight's acreage on a generic technology stack line.
- Do not encode internal Fieldwork evidence levels into recruiter-facing prose unless they solve a real credibility question.
- Do not turn recruiter outreach into a resume bullet or treat unknown sourcing as validation; use the actual role description only as a targeting hypothesis.

## Current identity thesis

The page should make a reader infer something close to:

> Nontraditional early-career chronology, roughly three years of substantive engineering activity, unusually strong evidence of entering unfamiliar systems and finding correctness/performance/lifecycle boundaries, repeated external acceptance across Vercel AI SDK, Vite, Cloud Hypervisor and Cloudflare, plus one owned performance product deep enough to demonstrate sustained technical pursuit and benchmark discipline.

The resume's job is to resolve the chronology/capability mismatch quickly enough that a human wants to ask about it.