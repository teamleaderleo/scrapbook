# Portfolio inventory

**Last broad refresh:** 2026-08-24

This is the retrieval index for career-facing engineering evidence.

It exists so a future resume, LinkedIn rewrite, portfolio page, interview packet, or application does not have to reconstruct the body of work from GitHub memory. It is deliberately broader than `resume-candidates.md` and much shorter than the source repositories.

The source repositories, upstream issues/pull requests, benchmark packets, review threads, and CI receipts remain authoritative. This file records **what each body of work proves, what state the evidence is in, and where it belongs in a career narrative**.

For moving release queues and current engineering emphasis, read [`current-state.md`](current-state.md) first. This inventory should prefer durable product/evidence boundaries over one-day branch SHAs or transient mergeability states.

## Evidence classes used here

Keep these distinctions explicit:

- **landed / published** — the change actually merged or shipped upstream;
- **maintainer-approved / accepted** — substantive upstream acceptance exists even if merge is separate;
- **finding adopted through another landing path** — the diagnosis or repair mechanism was taken upstream, but the final PR/commit belongs to another author or automation path;
- **finding accepted, repair boundary changed** — maintainers agreed there was a real problem but chose a different project-native repair;
- **submitted / awaiting disposition** — public issue or PR exists, but external acceptance is still open;
- **owned product / system** — evidence comes from a repository Leo controls rather than third-party review;
- **research investigation** — mechanism and experiments are substantial, with contribution claims reserved for work that actually crosses the upstream boundary.

Merge count is useful evidence, not the ontology.

---

## Current headline pool

### Preflight

Repository: https://github.com/teamleaderleo/preflight

Detailed Scrapbook record: [`records/preflight.md`](records/preflight.md)

State: **owned performance/product system in operational first-beta candidate execution; strongest current independent-engineering artifact**.

The clean controlled timing campaign remains the 2026-08-15 same-profile comparison: 89.00s ordinary-launch median versus 15.53s Preflight median on one 83-mod profile, five accepted runs per condition, interleaved in one session, no exclusions. Later development evidence retained a fourteen-second regime: a reviewed G1/deferred-heap-commit condition produced a 14.04s five-run median and 13.69s best observation. The repository deliberately keeps those later observations separate from the controlled before/after campaign and from the still-pending benchmark against the exact accepted package bytes.

Source and rendered-UI convergence are complete. Private signing/package rehearsals have succeeded across Linux, macOS, and Windows. The remaining first-beta gate is operational: one maintainer-authorized immutable candidate, native Windows/Linux licensed-install acceptance, package-bound startup/lifecycle/update/report evidence, and the hands-on report-intake canary.

What it proves:

- Java runtime and bytecode instrumentation in a codebase/ecosystem Leo does not own;
- performance investigation using JFR, seam timing, replay harnesses, controlled A/B campaigns, and retained evidence;
- exact compatibility identities and fail-open fallback instead of assuming prepared work remains valid;
- storage/layout optimization, including learned Compact texture packs where physical access order affects startup;
- willingness to discard or reframe attractive optimization theories when better measurement disproves them;
- native desktop packaging, signed-update machinery, privacy-bounded support, diagnostics, profiles, settings, recovery, and release evidence beyond a benchmark script.

Career use: **resume lock**. Largest owned-project allocation in a general, Valve/runtime, performance, or evaluation-oriented cut.

### Vercel AI SDK

Detailed Scrapbook record: [`records/open-source.md`](records/open-source.md)

State: **one direct merged/published fix plus two repairs adopted through AI SDK Factory with explicit co-author credit in merged upstream commits**.

The clean public cluster covers stateful regular-expression evaluation and Web Streams cleanup/error-precedence behavior. One Factory-adopted repair was also propagated into maintained v5 and v6 release branches.

What it proves:

- subtle TypeScript/runtime state and lifecycle correctness;
- focused regression design around repeated calls, cleanup, failure precedence, and caller-owned state;
- ability to produce work that survives a high-throughput AI-tooling repository's maintenance workflow.

Career use: **resume lock**, especially for Vercel, AI tooling, developer tools, coding-agent systems, and evaluation work.

### Cloud Hypervisor

Detailed Scrapbook record: [`records/open-source.md`](records/open-source.md)

State: **three merged upstream Rust/VMM contributions; deeper QCOW metadata-ownership repair still open**.

Merged work covers three distinct boundaries:

1. exact VMM shutdown events replace SSH disappearance as the lifecycle gate before VM/disk reuse;
2. ACPI construction failures propagate through typed VM boot errors instead of panicking;
3. VFIO DMA ranges crossing gaps between separately mmap'd sparse BAR areas are rejected unless one mapping covers the complete request.

The open QCOW follow-on reaches persistent metadata ownership/refcount ordering: replacement L2 tables gain ownership before L1 publication, and relocation releases the previous table at the local handoff instead of deferring ownership changes beyond the switch.

What it proves:

- low-level systems work in a real VMM;
- lifecycle synchronization, error propagation, PCI/VFIO mapping semantics, and persistent-state ownership;
- productive review iteration across several independent accepted fixes.

Career use: **resume lock** for systems/platform work and strong breadth proof elsewhere.

### Vite and Cloudflare Workers SDK

Detailed Scrapbook record: [`records/open-source.md`](records/open-source.md)

State:

- Vite: **two merged lifecycle/correctness fixes**, plus an open repeated-`resolveConfig()` idempotence follow-on;
- Cloudflare Workers SDK: **two merged repairs** covering Miniflare teardown ordering and Cloudflare Access credential freshness/cache semantics.

The Vite merges cover temporary optimizer analysis-bundle cleanup and propagation of `buildEnd` failure into `closeBundle(error)` before rethrow. The open follow-on prevents resolver-generated environment state from duplicating optimizer plugins across repeated config resolution.

What they prove:

- repeated ability to enter large mature TypeScript monorepos and locate lifecycle/state boundaries;
- resource cleanup, repeated-resolution idempotence, credential freshness, and teardown error semantics;
- responsiveness to maintainer feedback without widening the patch unnecessarily.

Career use: strong selected OSS specimens. Prefer a few mechanism-rich examples over a logo wall.

---

## Accepted findings where the final landing path differed

These demonstrate technical diagnosis and project-boundary judgment even when Leo's original PR is not the final merged artifact.

### Zustand — stale async hydration after `clearStorage()`

Public report: https://redirect.github.com/pmndrs/zustand/discussions/3554

Upstream landing: https://redirect.github.com/pmndrs/zustand/pull/3555

State: **reported with a concrete repair; upstream subsequently merged the same core production mechanism through its own PR**.

The report identified that `clearStorage()` could remove persisted state while an older async hydration remained authorized to publish afterward. Zustand already had a `hydrationVersion` generation for stale hydration; the proposed core repair was to advance that generation when clearing storage. Upstream PR 3555 merged that mechanism and broader regression coverage.

Career interpretation: Leo **identified the race and supplied the generation-invalidation repair subsequently implemented upstream**.

Resume value: technically clean bench material because stronger landed specimens already prove async/state correctness.

### BuildKit — rootless/rootful mount-point reproducibility

Leo's PR: https://redirect.github.com/moby/buildkit/pull/7033

Maintainer replacement: https://redirect.github.com/moby/buildkit/pull/7039

State: **real divergence identified and submitted; maintainer replaced the repair with a different compatibility policy**.

The underlying problem was rootless/rootful output divergence caused by mount points removed during rootless spec conversion. Leo's candidate cleaned the finalized runtime-created mount stubs after rootless conversion. The maintainer replacement kept the diagnosis but chose to restore the missing rootless mount points instead, preserving existing rootful output and avoiding a compatibility-version change.

Career interpretation: strong systems review story because the important disagreement is **which side of the compatibility boundary should move**.

Resume value: strong alternate for systems/container roles; usually interview/portfolio material in a general cut.

### runc — `MaxCPU` boundary semantics

Issue: https://redirect.github.com/opencontainers/runc/issues/5388

Leo's PR: https://redirect.github.com/opencontainers/runc/pull/5389

Maintainer replacement: https://redirect.github.com/opencontainers/runc/pull/5392

State: **real off-by-one relationship identified; maintainer preferred repairing the historical semantic boundary on the other side; Leo agreed and closed the competing patch**.

Leo's patch made the reset-mask allocation match the then-documented inclusive `MaxCPU` meaning. Maintainer review showed repository history supported making `MaxCPU` exclusive instead, which made the existing allocation expression correct and restored one meaning across the codebase.

Career interpretation: excellent evidence of review judgment: identify the symptom, recover the historical contract, and prefer the cleaner project-native repair over personal merge count.

Resume value: interview story, not headline bullet.

### Playwright — MCP HTTP shutdown authority

Issue: https://redirect.github.com/microsoft/playwright/issues/42129

Maintainer landing: https://redirect.github.com/microsoft/playwright/pull/42133

State: **finding accepted; maintainer-owned fix merged; report closed as completed**.

The report showed that the production MCP HTTP server exposed a fixed-header `/killkillkill` route that allowed an ordinary reachable HTTP client to trigger the server's graceful `SIGINT` shutdown path. It traced the route to a Windows lifecycle test, distinguished CSRF mitigation from caller/process ownership, and included a prepared parent-stdin alternative.

Upstream chose a smaller project-native boundary: PR 42133 gates `/killkillkill` on `isUnderTest()` so production MCP HTTP servers do not expose the test-only shutdown hook.

Career interpretation: accepted diagnosis with a different final repair. The strong part is locating the lifecycle-authority leak and providing a reproducible report.

Resume value: solid accepted-finding/interview material, usually below the merged Vite/Cloudflare/Cloud Hypervisor specimens on a one-page cut.

---

## FEX research — third-party systems work, not an upstream contribution

Primary Linux Fieldwork investigation: https://github.com/teamleaderleo/linux-fieldwork/pull/669

Continuation: https://github.com/teamleaderleo/linux-fieldwork/issues/672

Owned fork: https://github.com/teamleaderleo/FEX

State: **deep research investigation with owned-fork implementations and real runtime evidence; upstream contribution claims remain outside the current boundary**.

The investigation began from Apple M5 → ARM Linux VM → FEX → x86 Vulkan/Wine execution and separated into two findings:

1. a Vulkan dynamic proc-address routing hole that could bypass FEX's existing callback-safe custom path;
2. a deeper generated-thunk executable-lifetime problem where a native function pointer remains valid while its guest-side generated adapter belongs to an unloaded wrapper generation.

The lifetime work forced moved wrapper reloads, separated future-dispatch invalidation from already-selected executable code, reproduced the selected-before-unmap race, and compared ownership architectures. The strongest demonstrated long-term direction is a generated process-resident bridge containing only escaped executable glue while ordinary wrapper code/state remains unloadable. Real generated Vulkan and GL tests cover dynamic function pointers, host→guest callbacks, moved reloads, and a real amd64 `vulkaninfo --summary` under ARM64 FEX.

The owned fork also retains a Vulkan candidate around callback-sensitive dynamic proc-address routing and native GIPA/GDPA availability semantics, plus a metadata/inventory consistency check. Hosted ARM64 controls and x86/FEX runs validate the candidate boundary. The remaining recorded hardware confirmation is the Apple M5 + Venus path.

What it proves:

- dynamic-loader and executable-lifetime reasoning;
- cross-ISA thunk/ABI mediation;
- Vulkan/GL callback and function-pointer semantics;
- concurrency/reclamation boundaries;
- experimental design that lets plausible architectures lose.

Career use **today**: research/interview context. Describe the owned fork and runtime evidence directly; reserve “upstream contribution” language for work that actually crosses that boundary under upstream policy.

For Valve/runtime/platform roles this is especially useful beside Preflight and Cloud Hypervisor because it makes the common thread unmistakably runtime/compatibility/systems work rather than one unusually deep game project.

---

# Cross-repository engineering method

Detailed Scrapbook record: [`records/working-style.md`](records/working-style.md)

State: **active working model implemented across several owned systems and upstream research lanes**.

The portfolio-level point is narrower than “AI makes Leo quicker.” The stronger evidence is a recurring method across different work:

- [Preflight](https://github.com/teamleaderleo/preflight) uses agents inside one deep product while tying performance and compatibility claims to runtime evidence, controlled measurement, exact identities, and fallback behavior;
- [Fieldwork](https://github.com/teamleaderleo/fieldwork) and [Linux Fieldwork](https://github.com/teamleaderleo/linux-fieldwork) move the same code-first investigation method across unfamiliar repositories, preserve negative results, and expose selected work to independent maintainer review;
- [Stensibly](https://github.com/teamleaderleo/stensibly) externalizes responsibility, authority, leases, handoffs, provider observations, continuation, and recovery so work can survive worker replacement and provider ambiguity;
- [Cultist](https://github.com/teamleaderleo/cultist) recovers bounded repository evidence, current-work snapshots, counterexamples, provenance, and decision memory, then measures whether selected evidence changes what a fresh worker does next;
- [SmolRunner](https://github.com/teamleaderleo/smolrunner) turns operator-owned Apple-silicon compute into trust-tiered Linux execution, keeping hostile work disposable while allowing reviewed trusted state to remain resident where it earns the latency win;
- [Renderprove](https://github.com/teamleaderleo/renderprove) and [Proofwake](https://github.com/teamleaderleo/proofwake) separate browser/rendered evidence production from durable revision-evidence memory.

What it currently supports:

- human attention can concentrate on problem selection, contract choice, evidence quality, review boundaries, and consequential decisions while agents supply search, implementation, experimentation, and retrieval capacity;
- worker/session loss is treated as normal, with durable state and evidence carrying continuation across actors;
- domain transfer is visible across Java/JVM performance, TypeScript SDKs/tooling, Rust virtualization, Linux/container work, browser systems, agent coordination, execution, and evidence systems;
- several outputs have encountered independent external review, while owned systems increasingly test their own continuation, evidence, and recovery claims in dogfood.

This is the modern version of an older personal habit: capture generously, synthesize quickly, keep useful residue, and revisit it when a real problem creates demand. Speech-to-text and agents make residue cheaper to create and recover; Stensibly, Cultist, Proofwake, and the repository work records turn more of that continuity into explicit software and evidence contracts.

Career use: **synthesis narrative rather than a standalone logo/bullet**. It is especially useful for coding-agent environments, developer tools, evaluation, durable execution, and research-engineering roles because it explains why the owned systems and cross-repository work belong in one portfolio. Keep individual technical claims tied to their source repositories.

---

# Owned systems inventory

## Stensibly

Repository: https://github.com/teamleaderleo/stensibly

State: **live hosted coordination/continuation system in sustained dogfood**.

Core thesis: the board shows work; the ledger governs who may do it. Stensibly separates responsibility from authority and keeps shared coordination state outside any particular model/runtime.

Current implemented surface includes Convex-backed state, Cloudflare Worker API, browser sessions, bearer clients, REST v1, dual-era remote MCP, claims/renewable leases, events/artifacts/handoffs, idempotent commands, project/workspace scoping, and guarded exact-CAS GitHub publication. Real work now crosses disposable worker sessions through durable handoffs and provider-backed continuation.

Recent production dogfood extends that into repository attention and mail: GitHub states can compile into deterministic mail checkpoints, project-owned continuation handles survive the handoff, webhook observations feed the publisher, the Quarry mapping has automatic Gmail delivery active in the Worker, and a bounded read-only public GitHub Events fallback can supply observations for that explicit mapping.

What it proves:

- system invention rather than isolated repair;
- distributed coordination and race/lease semantics;
- authn/authz, provenance, replay/idempotency, exact preconditions, and external-effect fencing;
- continuation through worker replacement and provider ambiguity;
- ability to keep model behavior separate from server-owned authority.

Career use: **strong owned-system specimen**. One dense line on a general resume; much larger allocation for agent systems, durable execution, coordination, or reliability roles.

## SmolRunner

Repository: https://github.com/teamleaderleo/smolrunner

State: **pre-alpha trust-tiered Linux execution system in live Apple-silicon acceptance**.

The project began around bounded disposable GitHub Actions capacity from an operator-owned Mac using Lima/VZ Linux workers while GitHub remains the ordinary workflow surface. That strict disposable lane now includes prepared worker generations, official Runner Scale Set integration, Keychain credential acquisition, durable assignment/no-replay handling, clone/JIT/teardown composition, LaunchAgent supervision, controller-death evidence, exact worker ownership, and repeated physical Quarry pilots.

The product direction now includes trusted hot execution as a first-class programme. A trusted persistent lane, warm pause/resume, auto-idle behavior, hot-state path policy, immutable Git object-pool primitives/fixed generation markers, and trusted OverlayFS plan/descriptor checks allow valuable Linux state to remain resident where trust and measured value permit.

The active boundary still includes finishing the installed-service one-job disposable journey, restart-safe ownership for in-flight Lima mutations, broader sleep/reboot/outage/teardown recovery, and the hostile-worker network boundary.

What it proves:

- Rust systems/control-plane design;
- crash-consistent local state and recovery;
- identity/ownership before destructive mutation;
- CI runner/sandbox threat modeling;
- trust-tiered residency and reusable-state validity;
- careful separation of observation, authorization, planning, persistence, execution, and teardown.

Career use: **strong for systems/security/coding-agent execution roles**. Keep the pre-alpha boundary visible while describing the substantial physical controller and hot-state work that already exists.

## Cultist

Repository: https://github.com/teamleaderleo/cultist

State: **active repository-evidence research prototype in sustained dogfood**.

The installed Rust distribution is `cargo-cultist`. Public analyzers are deterministic, local, and read-only: repository convention recovery, change-time check/diff evidence, concurrent-change preflight, historical companion analysis, and CI selector analysis. Research lanes add bounded evidence packets, C1 representation, decision memory, active-work/provider adapters, and behavioral trials.

The core research question is empirical: does selected evidence change the next justified action, prevent an expensive wrong turn, or save a later worker from repeating manual investigation? Recent work also tightens provider-snapshot identity, bounded file-coverage proofs, pagination uncertainty, and active-work CI against the exact provider state it observed.

What it proves:

- provenance-bearing deterministic analysis;
- conservative `UNKNOWN` semantics where evidence cannot justify absence or independence;
- evidence selection under bounded attention/byte budgets;
- behavioral evaluation of whether repository context changes work;
- a research discipline that retains counterexamples, quiet cases, and demotion evidence.

Career use: **research/devtools supporting specimen**, especially for coding-agent context, evaluation, review intelligence, and repository-aware tooling.

## Elatura

Repository: https://github.com/teamleaderleo/elatura

State: **active prototype and dogfood beyond the original observation-only M0**.

Elatura is a local-first adaptive browser sidecar for oversized interactive applications. ChatGPT conversations large enough to freeze/crash a normal browser are the first workload, while the adapter boundary stays broader than one site.

Current main includes observe-only Firefox measurement; a locked fail-open slim mode with bounded live DOM discovery, render suppression, latest-window planning, placeholders, restoration, and drift handling; a preflighted DOM executor/browser host; local Android completion-notification sensing and diagnostics; generic adapter/conformance contracts; schema-drift rules; deterministic oversized/malformed fixtures; bounded fingerprints/cache/provenance; and broader resource/offload experiments.

The current product question is which intervention layer earns its complexity in real use: window/suppress live state, use a cheaper local representation, or move execution elsewhere while preserving the native service experience.

What it proves:

- a generalized product idea around adaptive representation of oversized authenticated applications;
- browser interception and DOM control with explicit fail-open recovery;
- privacy-preserving measurement, schema drift, cache/provenance contracts, and conservative authority gating;
- physical-device/browser dogfood feeding implementation choices.

Career use: **high-concept owned-project bench** and a plausible larger specimen for browser/runtime/product-systems roles.

## Renderprove

Repository: https://github.com/teamleaderleo/renderprove

State: **early-stage but working browser-evidence tool**.

Renderprove starts a trusted local app or inspects an existing deployment in Chromium and emits versioned browser evidence: screenshots and hashes, navigation/page facts, diagnostics, and policy disposition. It also has bounded local MCP, repeatability probes in fresh rootless Podman containers, bounded interaction plans, deterministic visual comparison, and optional Cloudflare Gemma advisory artifacts that remain explicitly non-authoritative.

What it proves:

- browser evidence contracts and deterministic/reproducible visual review;
- security boundaries around agent-driven browser interaction;
- separation of deterministic browser evidence from optional model advice;
- a coherent role in the SmolRunner → Renderprove → Proofwake → Stensibly toolchain.

Career use: supporting project, particularly for coding-agent evaluation, developer tooling, visual QA, and agent systems.

## Proofwake

Repository: https://github.com/teamleaderleo/proofwake

State: **working local revision-evidence index; Proofwake is now the primary product/command identity, with Shadowbill compatibility retained**.

Proofwake stores content-minimised observations by repository/revision so humans and agents can ask what changed, which revisions have convincing evidence, what is failing/stale/silent, and what recovered. The repository includes a durable local ledger, Git and GitHub collectors, reports, dashboard, diagnostics, and read-only MCP. The inherited Shadowbill AI-usage reckoner remains an optional module inside the broader product.

Its boundary is deliberately observational: Proofwake does not schedule CI, operate runners, deploy software, assign work, approve mutations, ingest arbitrary logs, or rank developers by raw activity.

What it proves:

- append-oriented durable evidence modeling;
- strict privacy/content-minimisation boundaries;
- source identity, freshness, failure, and recovery as explicit evidence dimensions;
- useful systems composition with Renderprove/SmolRunner/Stensibly without collapsing authority boundaries.

Career use: supporting agent/evaluation/reliability project; strongest as part of the broader execution/evidence/coordination story.

## Quarry

Repository: private `teamleaderleo/quarry`.

State: **active private trading-research lab; live-order permission disabled; execution/accounting readiness is ahead of prospective financial evidence**.

Quarry carries substantial engineering: immutable dataset and experiment identities, deterministic backtests/tournaments/walk-forward work, causal execution policy, futures/options accounting, exact risk/restart state, verification receipts, read-only broker observation, offline statement evidence, continuation handoffs, and sustained provider/data-fidelity work.

Career use today: **private/internal engineering and dogfood context**, especially where it supplies real workloads to SmolRunner and Stensibly. Keep public claims scoped to shareable engineering evidence and defer a standalone public portfolio headline until the repository's publication boundary changes.

## Scrapbook / teamleaderleo.com

Repository: https://github.com/teamleaderleo/scrapbook

State: **live personal site, private knowledge workspace, and agent-facing publication/evidence lab**.

The current repository includes the private Supabase-backed Space workspace, Operator console, public tools/experiments, Workbench publishing, repository-backed agent check-ins, an Agent Journal evidence ledger, machine-readable access/contribution contracts, GitHub activity integration, and explicit retirement of obsolete surfaces.

Routine hosted CI is intentionally compact: ESLint + Vitest and a separate production build, with persistent lint/build caches. Playwright remains an explicit author-side browser tool for changes that need browser evidence.

What it proves:

- long-lived product stewardship and willingness to delete/deprecate obsolete code;
- an unusual agent/human collaboration surface with explicit provenance and repository-backed publication;
- frontend/product breadth alongside lower-level systems work.

Career use: useful supporting proof and the public container for much of the portfolio. It should not displace stronger technical specimens on a one-page systems/devtools resume.

## Fieldwork and Linux Fieldwork

Repositories:

- https://github.com/teamleaderleo/fieldwork
- https://github.com/teamleaderleo/linux-fieldwork

State: **active code-first investigation/research workbenches**.

Fieldwork organizes public programmes, target maps, experiments, owned-repository integration trials, exact-head review, and deliberate upstream delivery. Linux Fieldwork carries the Linux/Debian variant with source imports, reproducible investigations, live-fieldwork status, and reusable review/process lessons.

Career use: method/evidence supporting systems. Their strongest value appears through the accepted upstream work and retained investigations they help produce.

## Glossless and other owned projects

Glossless remains the stronger role-specific owned specimen for frontend/product/graphics breadth. Keep it available for creator-tool, UI, browser, or graphics-oriented applications.

Other repositories can remain discoverable through GitHub without becoming resume candidates merely because they exist. Promote them here when they add a genuinely new technical axis or external/product evidence.

---

# How to use this inventory later

## One-page resume

The one-page resume should remain ruthless. Current default hierarchy is roughly:

1. Preflight;
2. Vercel AI SDK;
3. Cloud Hypervisor;
4. the best role-specific Vite/Cloudflare/system specimen;
5. one or two owned systems selected for the target: Stensibly, SmolRunner, Cultist, Elatura, Glossless;
6. compact IBM corroboration and education.

Zustand, BuildKit, runc, Playwright, FEX, Renderprove, Proofwake, Quarry, Fieldwork, Linux Fieldwork, and Scrapbook strengthen the body of evidence even when they lose the one-page space competition.

## LinkedIn

LinkedIn does not need to mimic conventional employment history. A later rewrite can use a small number of project entries or a consolidated independent/open-source engineering section with concrete mechanisms and evidence links.

Useful project candidates are Preflight, Stensibly, SmolRunner, and role-dependent Elatura/Cultist. Renderprove/Proofwake/Scrapbook fit well as supporting links or portfolio context unless the target audience specifically values them.

## Interviews

Keep the non-merge stories. BuildKit and runc are especially good because they show the ability to change conclusion after maintainer/project-history evidence. Playwright is useful as an accepted diagnosis where upstream chose a smaller repair boundary. FEX is useful for systems depth if described as research rather than contribution. Zustand is useful for explaining substantive authorship when GitHub landing mechanics obscure it.

The cross-repository method is useful when an interviewer asks how AI changes the work itself. Keep the answer concrete: agents expand search and execution capacity; durable evidence, exact review boundaries, external maintainers, and selective human attention keep the work answerable to reality. Use Preflight, Stensibly, SmolRunner, Cultist, Fieldwork/Linux Fieldwork, Renderprove, and Proofwake as distinct examples rather than presenting them as one finished platform.

## Applications

Tailor by actual work:

- **Valve / runtime / performance:** Preflight, Cloud Hypervisor, FEX research, SmolRunner, selected graphics/browser breadth;
- **Vercel / devtools / AI runtime:** AI SDK, Vite, Cloudflare, Preflight, Stensibly, Cultist;
- **coding-agent evaluation / environments:** Preflight, AI SDK, SmolRunner, Renderprove, Proofwake, Stensibly, Cultist, cross-repository OSS repair record;
- **systems / platform:** Cloud Hypervisor, BuildKit story, Preflight runtime work, SmolRunner, FEX research;
- **agent coordination / durable execution:** Stensibly, SmolRunner, Proofwake, Renderprove, Cultist, AI SDK;
- **browser / adaptive-client systems:** Elatura, Renderprove, Scrapbook, selected Vite/Playwright work.

## Refresh rule

Before exporting any claim to a resume, LinkedIn, application, or public portfolio:

1. reread the current upstream/product state;
2. distinguish merged, approved, adopted, replaced, submitted, and research-only status;
3. use the smallest mechanism/result that demonstrates the work;
4. preserve project-specific review reversals instead of laundering them into merge claims;
5. prefer current controlled measurements over prettier chronological endpoints;
6. keep transient queue state in `current-state.md` and durable product/evidence boundaries here.