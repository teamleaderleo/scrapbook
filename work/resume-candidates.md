# Resume candidates

This file is intentionally churny. It answers: **if Leo had to ship a one-page resume today, which evidence earns the space?**

The ranking should change as work lands, products ship, users appear, and target roles change. Falling out of this file does not make work less real; it means the marginal signal is weaker than something else competing for the same line.

## Current market framing

Working description:

> Software engineer with roughly three years of substantive engineering experience: about sixteen months of conventional industry employment plus roughly two years of independent/open-source/product engineering.

Avoid claiming three years of full-time post-graduate professional employment. Avoid calling the profile "0 YOE" when the question is ordinary software-engineering experience.

The resume itself probably does not need a YOE headline. Let the chronology and evidence support the answer when asked.

## General one-page cut — current recommendation

### Header

No summary paragraph unless a target application clearly benefits from one. Name, contact, GitHub, site, LinkedIn.

Possible quiet descriptor if space remains useful:

> Software Engineer — Runtimes, Developer Tools & Performance

Do not over-specialize if the target role is generalist.

### Selected Open-Source Engineering

#### 1. Vercel AI SDK — lock

Best current proof:

- merged and published upstream;
- subtle shared-state/API correctness;
- human approval plus release receipt;
- compact enough to understand quickly.

Candidate bullet family:

> Fixed nondeterministic global/sticky URL-regex evaluation in `@ai-sdk/provider-utils` by evaluating from index zero and restoring caller-owned `lastIndex`; added Node/Edge regressions covering repeated, mismatch and throw paths; merged and published upstream.

Do not waste resume space saying "contributed to Vercel AI SDK." The mechanism is the signal.

#### 2. Cloud Hypervisor — lock

The two merged changes already earn the entry. A newer QCOW ownership/refcount repair is under upstream review and can strengthen this further if accepted.

Candidate bullet family:

> Landed two Cloud Hypervisor fixes: replaced SSH-loss shutdown proxies with the VMM's exact shutdown event before VM/disk reuse, and propagated ACPI address/`fw_cfg`/guest-memory failures through typed VM boot errors instead of panicking.

A second line can mention validation breadth if the role is systems-heavy:

> Validated the ACPI path across x86_64/AArch64 KVM/MSHV plus fw_cfg, TDX, Clippy and the repository's RISC-V build.

Current follow-on: PR #8721 moves QCOW L2 refcount ownership before L1 publication so failure cannot leave a reachable table eligible for allocator reuse after reopen. It has focused block/io_uring regressions and broad build/Clippy coverage; no human review yet. Do not fold it into a landed resume claim unless accepted.

For a general resume, the first line may be enough.

#### 3. Cloudflare Workers SDK — strong current

The Access credential fix is now human-approved with Wrangler CODEOWNERS satisfied; it remains open. A second Miniflare teardown/lifecycle PR is also active but still awaiting human approval.

Candidate bullet family:

> Fixed stale Cloudflare Access service-token headers surviving environment changes by separating current credential state from legitimately cached interactive authorization; added regressions for removed/partial credentials while preserving cookie reuse.

Keep the final resume wording status-accurate: approved upstream is meaningful external validation, but do not imply merge until GitHub records one.

#### 4. Vite — promoted current

Vite now has enough external validation to stand as a real resume specimen rather than a bench logo:

- PR #23207 merged: closes temporary Rolldown optimizer-analysis bundles on success and error;
- PR #23165 remains open but has approvals from two Vite maintainers: preserves Rollup/Rolldown `closeBundle(error)` semantics after `buildEnd` failure;
- PR #23208 remains active around repeated config-resolution idempotence.

Candidate bullet family while #23165 remains open:

> Fixed Vite optimizer resource leakage by closing temporary custom-extension Rolldown analysis builds on success/error; separately aligned dev-server teardown with Rollup/Rolldown `closeBundle(error)` semantics after `buildEnd` failure, approved by two Vite maintainers.

If #23165 merges, simplify the status language and treat the pair as two landed lifecycle/correctness fixes.

#### 5. SWC — high-upside pending slot

If maintainer review accepts the direction, this remains unusually valuable because it adds a compiler/minifier axis rather than another adjacent web-tooling example.

Candidate bullet family:

> Preserved observable `instanceof` evaluation across SWC optimizer/minifier paths where dead-result cleanup could discard `Symbol.hasInstance` calls or exceptions; removed unsafe operand-shape folds and added optimizer-owned regressions.

Until human/upstream acceptance exists, keep in the bullpen rather than presenting it as equivalent to landed work.

#### Bench / alternates

- Zustand hydration generation race — technically clean, lower marginal signal after AI SDK/Cloudflare; useful if upstream attribution becomes especially strong.
- BuildKit rootless/rootful reproducibility — excellent for systems-specific applications.
- Bat/Delta/fd/urllib3/Serde/Rspack — strong Fieldwork/portfolio/interview bench; promote selectively with upstream validation or target-role fit.
- runc #5389 — interview story, not current resume headline.

### Independent Engineering

#### Preflight — absolute lock, largest allocation

Do not compress Preflight into a single generic project bullet. It is the strongest owned-work proof and should receive roughly **three dense bullets / six-ish lines** in Leo's actual typography.

Current story families:

**Outcome / product**

> Built a Java-agent performance layer for an 80+ mod Starsector installation; current development builds reach the main menu in a 15.88s warm record, with a fresh same-cohort release benchmark pending before publishing a final before/after percentage.

Potential future replacement after release cohort:

> Reduced 83-mod Starsector startup from X to Y across N interleaved release-candidate runs ...

Use the fresh cohort, not mismatched development-stage endpoints, for the final public delta.

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
- current 42/42 class-cache and 15,469 texture hit evidence.

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

1. Vercel AI SDK.
2. Cloud Hypervisor (proves range outside TS/AI).
3. Cloudflare Workers SDK.
4. Vite — now externally validated through one merge plus a two-maintainer-approved lifecycle repair.
5. SWC rises above Vite if accepted and the compiler/minifier axis is useful for the target.
6. Preflight, but frame as runtime/instrumentation/performance rather than game fandom first.
7. Stensibly gets one stronger line because agent coordination/MCP/hosted authority is relevant.
8. SmolRunner only if space survives.

Useful application thesis:

> Already able to enter Vercel-owned code, understand lifecycle/state boundaries, and produce accepted fixes; independent work shows the ability generalizes beyond the codebase.

Do not imply OSS creates entitlement to an interview. It makes a targeted cold application unusually well-supported.

## Target cut: Valve / game/runtime/performance

Priority order changes substantially:

1. **Preflight dominates the page.** Give it the most acreage.
2. Cloud Hypervisor.
3. Best systems/compiler OSS specimens.
4. SmolRunner may beat Stensibly because runtime/crash/recovery systems are more relevant.
5. Glossless can appear if visual/graphics/product breadth helps.
6. Web-library correctness examples are supporting evidence, not identity.

Possible Preflight emphasis:

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

## Current identity thesis

The page should make a reader infer something close to:

> Early-career chronology, roughly three years of substantive engineering activity, unusually strong evidence of entering unfamiliar systems and finding correctness/performance/lifecycle boundaries, plus one owned performance product deep enough to demonstrate sustained technical pursuit.

The resume's job is to resolve the chronology/capability mismatch quickly enough that a human wants to ask about it.
