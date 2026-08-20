# Portfolio inventory

This is the retrieval index for career-facing engineering evidence.

It exists so a future resume, LinkedIn rewrite, portfolio page, interview packet, or application does not have to reconstruct the body of work from GitHub memory. It is deliberately broader than `resume-candidates.md` and much shorter than the source repositories.

The source repositories, upstream issues/pull requests, benchmark packets, review threads, and CI receipts remain authoritative. This file records **what each body of work currently proves, what state the evidence is in, and where it belongs in a career narrative**.

## Evidence classes used here

Keep these distinctions explicit:

- **landed / published** — the change actually merged or shipped upstream;
- **maintainer-approved / accepted** — substantive upstream acceptance exists even if merge is separate;
- **finding adopted through another landing path** — the diagnosis or repair mechanism was taken upstream, but the final PR/commit belongs to another author or automation path;
- **finding accepted, repair boundary changed** — maintainers agreed there was a real problem but chose a different project-native repair;
- **submitted / awaiting disposition** — public issue or PR exists, but external acceptance is not yet established;
- **owned product / system** — evidence comes from a repository Leo controls rather than third-party review;
- **research investigation** — mechanism and experiments are substantial, but it must not be represented as an upstream contribution.

Merge count is useful evidence, not the ontology.

---

## Current headline pool

### Preflight

Repository: https://github.com/teamleaderleo/preflight

Detailed Scrapbook record: [`records/preflight.md`](records/preflight.md)

State: **owned performance system; strongest current independent-engineering artifact**.

Current controlled timing evidence is the 2026-08-15 same-profile campaign merged through Preflight PR 440: 89.00s baseline median versus 15.53s accelerated median on one 83-mod profile, five accepted runs per condition, interleaved in one session, no exclusions.

What it proves:

- Java runtime and bytecode instrumentation in a codebase/ecosystem Leo does not own;
- performance investigation using JFR, seam timing, replay harnesses, controlled A/B campaigns, and evidence archives;
- exact compatibility identities and fail-open fallback rather than assuming cached/prepared work remains valid;
- willingness to discard or reframe attractive optimization theories when better measurement disproves them;
- packaging, diagnostics, rollback/update work, and productization beyond a benchmark script.

Career use: **resume lock**. Largest owned-project allocation in a general, Valve/runtime, performance, or evaluation-oriented cut.

### Vercel AI SDK

Detailed Scrapbook record: [`records/open-source.md`](records/open-source.md)

State: **one direct merged/published fix plus two repairs adopted through AI SDK Factory with explicit co-author credit in merged upstream commits**.

The clean public cluster covers stateful regular-expression evaluation and Web Streams cleanup/error-precedence behavior. One Factory-adopted repair was also propagated into maintained v5 and v6 release branches.

What it proves:

- subtle TypeScript/runtime state and lifecycle correctness;
- focused regression design around repeated calls, cleanup, failure precedence, and caller-owned state;
- ability to produce work that survives a fast-moving AI-tooling repository's own maintenance workflow.

Career use: **resume lock**, especially for Vercel, AI tooling, developer tools, coding-agent infrastructure, and evaluation work.

### Cloud Hypervisor

Detailed Scrapbook record: [`records/open-source.md`](records/open-source.md)

State: **two merged upstream Rust/VMM contributions; deeper QCOW metadata-ownership repair under substantive maintainer review**.

The merged work replaces SSH disappearance as a shutdown-completion proxy with the VMM's exact shutdown event, and replaces ACPI construction panic paths with typed boot errors. The QCOW follow-on reaches persistent metadata ownership/refcount ordering and failure/reopen safety.

What it proves:

- low-level systems work in a real VMM rather than only application/library code;
- lifecycle synchronization, error propagation, architecture/feature validation, and persistent-state reasoning;
- productive review iteration, including accepting and incorporating a deeper maintainer objection.

Career use: **resume lock** for systems/infra and strong breadth proof elsewhere.

### Vite and Cloudflare Workers SDK

Detailed Scrapbook record: [`records/open-source.md`](records/open-source.md)

State:

- Vite: one merged optimizer resource-lifecycle fix, a second lifecycle repair approved by two maintainers, and a config-idempotence follow-on in review;
- Cloudflare Workers SDK: two merged repairs covering Miniflare teardown ordering and Cloudflare Access credential freshness/cache semantics.

What they prove:

- repeated ability to enter large mature TypeScript monorepos and locate lifecycle/state boundaries;
- resource cleanup, repeated-resolution idempotence, credential freshness, and teardown error semantics;
- responsiveness to maintainer feedback without widening the patch unnecessarily.

Career use: strong selected OSS specimens. Do not turn the resume into a logo wall when AI SDK + Cloud Hypervisor already establish the larger point.

---

## Accepted findings where the final landing path differed

These are important because they demonstrate technical diagnosis and project-boundary judgment even when the final GitHub badge is not `merged` on Leo's PR.

### Zustand — stale async hydration after `clearStorage()`

Public report: https://redirect.github.com/pmndrs/zustand/discussions/3554

Upstream landing: https://redirect.github.com/pmndrs/zustand/pull/3555

State: **reported with a concrete repair; upstream subsequently merged the same core production mechanism through its own PR**.

The report identified that `clearStorage()` could remove persisted state while an older async hydration remained authorized to publish afterward. Zustand already had a `hydrationVersion` generation for stale hydration; the proposed core repair was to advance that generation when clearing storage. Upstream PR 3555 merged that mechanism and broader regression coverage.

Career interpretation: stronger than "filed a bug" and weaker/different than "my PR merged." Safe wording is that Leo **identified the race and supplied the generation-invalidation repair subsequently implemented upstream**.

Resume value: technically clean but usually bench material because stronger landed specimens already prove async/state correctness.

### BuildKit — rootless/rootful mount-point reproducibility

Leo's PR: https://redirect.github.com/moby/buildkit/pull/7033

Maintainer replacement: https://redirect.github.com/moby/buildkit/pull/7039

State: **real divergence identified and submitted; maintainer replaced the repair with a different compatibility policy**.

The underlying problem was rootless/rootful output divergence caused by mount points removed during rootless spec conversion. Leo's candidate cleaned the finalized runtime-created mount stubs after rootless conversion. The maintainer replacement kept the diagnosis but chose to restore the missing rootless mount points instead, preserving existing rootful output and avoiding a compatibility-version change.

Career interpretation: this is a strong systems review story because the important disagreement is **which side of the compatibility boundary should move**, not whether the bug existed.

Resume value: strong alternate for systems/container roles; usually interview/portfolio material in a general cut.

### runc — `MaxCPU` boundary semantics

Issue: https://redirect.github.com/opencontainers/runc/issues/5388

Leo's PR: https://redirect.github.com/opencontainers/runc/pull/5389

Maintainer replacement: https://redirect.github.com/opencontainers/runc/pull/5392

State: **real off-by-one relationship identified; maintainer preferred repairing the historical semantic boundary on the other side; Leo agreed and closed the competing patch**.

Leo's patch made the reset-mask allocation match the then-documented inclusive `MaxCPU` meaning. Maintainer review showed repository history supported making `MaxCPU` exclusive instead, which made the existing allocation expression correct and restored one meaning across the codebase.

Career interpretation: excellent evidence of review judgment. The win is recognizing the symptom, understanding the historical boundary after review, and preferring the cleaner project-native repair over personal merge count.

Resume value: interview story, not headline bullet.

### Playwright — MCP HTTP shutdown authority

Issue: https://redirect.github.com/microsoft/playwright/issues/42129

Maintainer landing: https://redirect.github.com/microsoft/playwright/pull/42133

State: **finding accepted; maintainer-owned fix merged; report closed as completed**.

The report showed that the production MCP HTTP server exposed a fixed-header `/killkillkill` route that allowed an ordinary reachable HTTP client to trigger the server's graceful `SIGINT` shutdown path. It traced the route to a Windows lifecycle test, distinguished CSRF mitigation from caller/process ownership, and included a prepared parent-stdin alternative.

Upstream agreed with the authority problem but chose a smaller project-native boundary: PR 42133 gates `/killkillkill` on `isUnderTest()` so production MCP HTTP servers do not expose the test-only shutdown hook. That merged and closed the report.

Career interpretation: accepted diagnosis with a different final repair. The strong part is locating the lifecycle-authority leak and providing a reproducible report; do not claim the prepared stdin design as the upstream implementation.

Resume value: solid accepted-finding/interview material, but usually below the merged Vite/Cloudflare/Cloud Hypervisor specimens on a one-page cut.

---

## FEX research — third-party systems work, not an upstream contribution

Primary Linux Fieldwork investigation: https://github.com/teamleaderleo/linux-fieldwork/pull/669

Continuation: https://github.com/teamleaderleo/linux-fieldwork/issues/672

State: **deep research investigation with owned-fork implementations and real runtime evidence; upstream FEX remains read-only/no-contact under its AI-generated-code policy**.

The investigation began from Apple M5 → ARM Linux VM → FEX → x86 Vulkan/Wine execution and separated into two findings:

1. a Vulkan dynamic proc-address routing hole that could bypass FEX's existing callback-safe custom path;
2. a deeper generated-thunk executable-lifetime problem where a native function pointer remains valid while its guest-side generated adapter belongs to an unloaded wrapper generation.

The lifetime work went beyond pinning as a workaround. It forced moved wrapper reloads, separated future-dispatch invalidation from already-selected executable code, reproduced the selected-before-unmap race, and compared ownership architectures. The strongest demonstrated long-term direction is a generated process-resident bridge containing only escaped executable glue while ordinary wrapper code/state remains unloadable. Real generated Vulkan and GL tests cover dynamic function pointers, host→guest callbacks, moved reloads, and a real amd64 `vulkaninfo --summary` under ARM64 FEX.

What it proves if/when the human-owned implementation is prepared for external use:

- dynamic-loader and executable-lifetime reasoning;
- cross-ISA thunk/ABI mediation;
- Vulkan/GL callback and function-pointer semantics;
- concurrency/reclamation boundaries;
- experimental design that lets plausible architectures lose.

Career use **today**: private/internal portfolio and interview context only. Do not represent research code as upstream FEX contribution. If a compliant human-derived submission eventually exists, reclassify it then.

For Valve/runtime/platform roles this is a particularly useful frame beside Preflight and Cloud Hypervisor because it makes the common thread unmistakably runtime/compatibility/systems work rather than one unusually deep game project.

---

# Cross-repository engineering method

Detailed Scrapbook record: [`records/working-style.md`](records/working-style.md)

State: **active working model; increasingly explicit across several owned systems and upstream research lanes**.

The portfolio-level point is narrower than "AI makes Leo faster." The stronger evidence is that a recurring method now spans several kinds of work:

- [Preflight](https://github.com/teamleaderleo/preflight) uses agents inside one deep product while tying performance and compatibility claims to runtime evidence, controlled measurement, exact identities, and fallback behavior;
- [Fieldwork](https://github.com/teamleaderleo/fieldwork) and [Linux Fieldwork](https://github.com/teamleaderleo/linux-fieldwork) move the same code-first investigation method across unfamiliar repositories, preserve negative results, and expose selected work to independent maintainer review;
- [Stensibly](https://github.com/teamleaderleo/stensibly) externalizes responsibility, authority, leases, handoffs, and continuation so work can survive worker replacement and stale sessions;
- [Cultist](https://github.com/teamleaderleo/cultist) explores repository memory and just-enough evidence so a fresh worker can recover useful precedent, counterexamples, current work, and reviewed rationale before repeating manual archaeology.

What it currently supports:

- human attention is increasingly allocated to problem selection, contract choice, evidence quality, review boundaries, and consequential decisions while agents supply search, implementation, experimentation, and retrieval capacity;
- the workflow treats worker/session loss as normal and tries to preserve enough durable state for another actor to continue from evidence rather than chat memory;
- domain transfer is visible across Java/JVM performance, TypeScript SDKs/tooling, Rust virtualization, Linux/container work, browser systems, and agent coordination;
- several outputs have encountered independent external review, while Cultist is explicitly adding held-out behavioral tests for whether surfaced repository evidence changes what a fresh worker does next.

This is also the modern version of an older personal habit: capture generously, synthesize quickly, keep useful residue, and revisit it when a real problem creates demand. Speech-to-text and agents make the residue cheaper to create and much cheaper to recover; Stensibly and Cultist attempt to make continuation and retrieval explicit engineering concerns rather than personal-memory tricks.

Career use: **synthesis narrative rather than a standalone logo/bullet**. It is especially useful for coding-agent environments, developer tools, evaluation, durable execution, and research-engineering roles because it explains why the owned systems and cross-repository work belong in one portfolio. Keep individual technical claims tied to their source repositories.

Do not overstate: Stensibly still describes a guarded pilot boundary, Cultist is an early prototype, and the broader method has several strong cases rather than a general proof that agent-heavy engineering works everywhere.

---

# Owned systems inventory

## Stensibly

Repository: https://github.com/teamleaderleo/stensibly

State: **live hosted coordination foundation; active product/system development**.

Core thesis: the board shows work; the ledger governs who may do it. Stensibly separates responsibility from authority and keeps shared coordination state outside any particular model/runtime.

Current implemented surface includes Convex-backed state, Cloudflare Worker API, browser sessions, bearer clients, REST v1, remote MCP, claims/renewable leases, events/artifacts/handoffs, idempotent commands, project/workspace scoping, and guarded exact-CAS GitHub publication. Recent work has pushed further into durable worker enrolment/selection, race-safe responsibility acceptance, continuation, mail/provider reconciliation, and explicit authority/effect boundaries.

A recent merged example, PR 1532, takes a read-only work-selection recommendation and requires one exact owner-bound worker to atomically accept responsibility against the current item version, claim generation, work fingerprint, WIP budget, and independence rules. Competing workers racing on the same recommendation produce one winner and one refresh-required loser rather than duplicate ownership.

What it proves:

- system invention rather than isolated repair;
- distributed coordination and race/lease semantics;
- authn/authz, provenance, replay/idempotency, exact preconditions, and external-effect fencing;
- ability to keep model behavior separate from server-owned authority.

Career use: **strong owned-system specimen**. One dense line on a general resume; much larger allocation for agent infrastructure, durable execution, coordination, or reliability roles.

Do not overstate: the README still explicitly says guarded single-project pilot, not unattended multi-project autonomy or irreversible effects.

## SmolRunner

Repository: https://github.com/teamleaderleo/smolrunner

State: **pre-alpha; substantial durable controller foundations; no complete unattended disposable JIT-runner loop yet**.

The product aims to turn an operator-owned Mac into bounded disposable GitHub Actions capacity using fresh Lima/VZ Linux workers while GitHub remains scheduler/status/log owner.

The repository already contains durable attempts/catalogs, resource admission, exact worker/template/source identities, shell-free bounded process execution, ownership proofs, crash recovery, staged/atomic persistence, and fail-closed mutation rules. Current M3 work now consumes retained GitHub Runner Scale Set lifecycle evidence using exact request/job/runner identities rather than event ordering or mutable names.

PRs 448–452 are a useful current slice: typed retained Scale Set events, exact job/request lookup, durable runner-request binding, fail-closed lifecycle reconciliation, and finally a paired durable catalog/delivery transaction that can atomically advance catalog revisions while binding crash recovery to exact prior/target bytes.

What it proves:

- Rust systems/control-plane design;
- crash-consistent local state and recovery;
- identity/ownership before destructive mutation;
- CI runner/sandbox threat modeling;
- careful separation of observation, authorization, planning, persistence, and execution.

Career use: **strong for infra/systems/security/coding-agent execution roles**. Keep the pre-alpha boundary visible.

## Elatura

Repository: https://github.com/teamleaderleo/elatura

State: **M0 evidence/observation on main; conceptually broad, live transformation still intentionally disabled**.

Elatura is a local-first adaptive browser sidecar for oversized interactive applications. ChatGPT conversations large enough to freeze/crash a normal browser are the first workload, but the architecture is deliberately adapter-driven rather than ChatGPT-specific.

Main already contains observe-only Firefox transport, content-free benchmark reports, generic adapter contracts/conformance, graph-shape inspection, synthetic oversized/malformed fixtures, active-path planning, fail-open orchestration, structural fingerprints, synthetic-only cache/materialization, representation/provenance contracts, and transform emergency controls.

An open Firefox slimming stack explores bounded DOM discovery, latest-window planning, fail-open drift handling, content-free fixtures, preflight-before-mutation execution, and a browser host that records whether destructive mutation actually started so partial failure can force the existing Stock recovery path. These branches are experiments, not landed main behavior.

What it proves:

- a generalized product idea around **adaptive representation of oversized authenticated web applications**;
- browser interception, privacy-preserving measurement, schema drift, fail-open transforms, cache/provenance contracts, and conservative authority gating;
- a willingness to keep destructive behavior disabled until evidence and recovery semantics are strong enough.

Career use: **high-concept owned-project bench**. Potentially strong for browser/runtime/product-infrastructure roles once a real live workload crosses the current safety gate. Do not present open slimming stacks as shipped behavior.

## Renderprove

Repository: https://github.com/teamleaderleo/renderprove

State: **early-stage but working evidence tool**.

Renderprove starts a trusted local app or inspects an existing deployment in Chromium and emits versioned browser evidence: screenshots and hashes, navigation/page facts, diagnostics, and policy disposition. It also has bounded local MCP, repeatability probes in fresh containers, bounded interaction plans, deterministic visual comparison, and optional advisory AI artifacts that remain explicitly non-authoritative.

What it proves:

- browser evidence contracts and deterministic/reproducible visual review;
- security boundaries around agent-driven browser interaction;
- separation of deterministic browser evidence from optional model advice;
- a coherent place in the larger SmolRunner → Renderprove → Proofwake → Stensibly toolchain.

Career use: supporting project, particularly for coding-agent evaluation, developer tooling, visual QA, and agent infrastructure. Usually below Preflight/Stensibly/SmolRunner on a one-page resume.

## Proofwake

Repository: https://github.com/teamleaderleo/proofwake

State: **working local evidence index with durable ledger, collectors, reports/dashboard, diagnostics, Git/GitHub observation, and read-only MCP**.

Proofwake stores content-minimised observations by repository/revision so humans and agents can ask what changed, which revisions have convincing evidence, what is failing/stale/silent, and what recovered. It explicitly does not schedule work, approve mutations, operate runners, deploy, or rank developers from raw activity.

Recent merged work adds strict appendable evaluation observations, deterministic evaluation-evidence projections, and a read-only MCP view over those projections. An opt-in evaluation-write MCP transport remains separately gated/in review.

What it proves:

- append-oriented durable evidence modeling;
- strict privacy/content-minimisation boundaries;
- deterministic projections that preserve sparse/partial evidence instead of manufacturing a score;
- useful systems composition with Renderprove/SmolRunner/Stensibly without collapsing their authority boundaries.

Career use: supporting agent/evaluation/reliability project. More interesting as part of the broader toolchain than as a generic standalone resume bullet today.

## Scrapbook / teamleaderleo.com

Repository: https://github.com/teamleaderleo/scrapbook

State: **live personal site, knowledge workspace, and agent-facing publication/evidence lab**.

The current repository includes the private Supabase-backed Space workspace, public tools/experiments, Workbench publishing, repository-backed agent check-ins, an Agent Journal evidence ledger, machine-readable access/contribution contracts, GitHub activity integration, browser/native-history work, and explicit retirement of obsolete surfaces.

What it proves:

- long-lived product stewardship and willingness to delete/deprecate obsolete architecture;
- a fairly unusual agent/human collaboration surface with explicit provenance and repository-backed publication;
- frontend/product breadth alongside the lower-level systems work.

Career use: useful supporting proof and a public container for the rest of the portfolio. It should not displace stronger technical specimens on a one-page systems/devtools resume.

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
5. one or two owned systems selected for the target: Stensibly, SmolRunner, Elatura, Glossless;
6. compact IBM corroboration and education.

Do not list Zustand, BuildKit, runc, Playwright, FEX, Renderprove, Proofwake, and Scrapbook all at once. Their existence strengthens the body of evidence even when they lose the one-page space competition.

## LinkedIn

LinkedIn does not need to mimic conventional employment history. A later rewrite can use a small number of project entries or a consolidated independent/open-source engineering section with concrete mechanisms and evidence links.

Useful project candidates for LinkedIn are Preflight, Stensibly, SmolRunner, and potentially Elatura once its product boundary advances. Renderprove/Proofwake/Scrapbook fit better as supporting links or portfolio context unless a target audience specifically values them.

## Interviews

Keep the non-merge stories. BuildKit and runc are especially good because they show the ability to change conclusion after maintainer/project-history evidence. Playwright is useful as an accepted diagnosis where upstream chose a smaller repair boundary. FEX is useful for systems depth if described as research rather than contribution. Zustand is useful for explaining substantive authorship when GitHub landing mechanics obscure it.

The cross-repository method is useful when an interviewer asks how AI changes the work itself. Keep the answer concrete: agents expand search and execution capacity; durable evidence, exact review boundaries, external maintainers, and selective human attention keep the work answerable to reality. Use Preflight, Stensibly, Fieldwork/Linux Fieldwork, and Cultist as distinct examples rather than presenting them as one finished platform.

## Applications

Tailor by actual work:

- **Valve / runtime / performance:** Preflight, Cloud Hypervisor, FEX research, SmolRunner, selected graphics/browser breadth;
- **Vercel / devtools / AI runtime:** AI SDK, Vite, Cloudflare, Preflight, Stensibly;
- **coding-agent evaluation / environments:** Preflight, AI SDK, SmolRunner, Renderprove, Proofwake, Stensibly, cross-repository OSS repair record;
- **systems / infrastructure:** Cloud Hypervisor, BuildKit story, Preflight runtime work, SmolRunner, FEX research;
- **agent coordination / durable execution:** Stensibly, SmolRunner, Proofwake, Renderprove, AI SDK.

## Refresh rule

Before exporting any claim to a resume, LinkedIn, application, or public portfolio:

1. reread the current upstream/product state;
2. distinguish merged, approved, adopted, replaced, submitted, and research-only status;
3. use the smallest mechanism/result that demonstrates the work;
4. preserve project-specific review reversals instead of laundering them into merge claims;
5. prefer current controlled measurements over prettier chronological endpoints.