# Current state — 2026-08-22

This is the short live-status overlay for the work record.

Read this before `portfolio-inventory.md` or `resume-candidates.md` when **status recency** matters. Those files still own the deeper retrieval and editorial story, but several of their status sentences lagged the repositories during the August Preflight sprint.

Source repositories and upstream threads remain authoritative. This file records the current cross-repository position without turning every active project into a resume candidate.

## Preflight — release execution

Repository: https://github.com/teamleaderleo/preflight

Live release board: https://github.com/teamleaderleo/preflight/issues/652

State: **the broad product/refinement sprint is landed; first-beta release execution is active**.

Current accepted `main` at this refresh is `ff479a685def730b7119bd06316617b6388fd237`, which merged Preflight PR #1056 after the first private signed Distribution rehearsal exposed portable Linux and Windows test-fixture defects. The canonical six-image public screenshot set had already landed through PR #1055.

The release board now says there is no active general product-hardening wave. The ordinary open-PR queue is back to explicitly parked research/hardening carriers, which stay parked unless a candidate failure or maintainer decision promotes them.

The first private signed Distribution rehearsal reached the real release machinery and exposed the now-repaired fixture defects before package assembly. A second private signed rehearsal is running against the repaired accepted `main` at the time of this refresh. These rehearsals prove release machinery; final package claims still belong to the retained tagged candidate generation and its native/package evidence.

**Performance note refreshed 2026-08-24:** the current headline is **13.69s best observed startup** on the 83-mod M5 MacBook Air profile. For live perspective, use the freshest best observed run; current repeat behavior is tightly clustered enough that run-to-run differences are on the order of tens of milliseconds, with no meaningful lucky-cache regime. The 2026-08-15 **89.00s → 15.53s** same-profile campaign remains useful historical evidence, not the current performance headline.

Career interpretation: Preflight remains the strongest owned engineering artifact, but its current phase should now be described as **release execution / candidate evidence**, not broad product convergence.

## External open-source validation

### Vercel AI SDK

Current record: [`records/open-source.md`](records/open-source.md)

State: **still the strongest external application/tooling cluster**.

The existing record remains directionally current: one direct merged/published fix plus two repairs adopted through AI SDK Factory with retained co-author credit, including the size-limit repair propagated across maintained release branches.

Direct merged/published repair: https://redirect.github.com/vercel/ai/pull/18570

No status correction from this refresh displaces that cluster.

### Vite

State: **two merged upstream fixes, with a third correctness follow-on still open**.

The older work record is stale here.

- https://redirect.github.com/vitejs/vite/pull/23207 — merged optimizer resource-lifecycle repair: closes temporary custom-extension analysis bundles on success and error.
- https://redirect.github.com/vitejs/vite/pull/23165 — **merged on 2026-08-21**: preserves the Rollup/Rolldown lifecycle contract by passing a `buildEnd` failure into `closeBundle(error)` before rethrowing it.
- https://redirect.github.com/vitejs/vite/pull/23208 — open and mergeable: keeps repeated `resolveConfig()` calls idempotent so resolver-generated environment state does not duplicate optimizer plugins and invalidate a warm optimizer cache.

Career interpretation: Vite is now a real **two-merge lifecycle/correctness cluster** rather than one merge plus one approved pending patch.

### Cloud Hypervisor

State: **three merged upstream Rust/VMM fixes, with the deeper QCOW ownership repair still open**.

The older work record is stale here too.

Merged work now includes:

1. https://redirect.github.com/cloud-hypervisor/cloud-hypervisor/pull/8699 — exact VMM shutdown events replace SSH disappearance as the lifecycle gate before VM/disk reuse.
2. https://redirect.github.com/cloud-hypervisor/cloud-hypervisor/pull/8709 — ACPI construction failures propagate through typed VM boot errors instead of panicking.
3. https://redirect.github.com/cloud-hypervisor/cloud-hypervisor/pull/8734 — **merged on 2026-08-20**: VFIO DMA ranges that fit a logical BAR but cross a gap between separately mmap'd sparse areas are rejected unless one mapping covers the complete requested range.

The QCOW follow-on remains open and mergeable:

- https://redirect.github.com/cloud-hypervisor/cloud-hypervisor/pull/8721 — gives replacement L2 tables ownership before L1 publication and makes the relocation handoff local instead of deferring the old-table release beyond the switch.

Career interpretation: Cloud Hypervisor now demonstrates repeat acceptance across **VM lifecycle, boot/error propagation, PCI/VFIO mapping semantics**, plus a deeper persistent-metadata review story.

### Cloudflare Workers SDK

State: **two merged fixes** in the current work record: Miniflare teardown ordering and Cloudflare Access credential/cache freshness.

No status correction from this refresh changes its role as a strong selected OSS specimen.

## Cultist — sustained repository-evidence research

Repository: https://github.com/teamleaderleo/cultist

State: **active research prototype in sustained dogfood**.

The older portfolio wording that treated Cultist as an early prototype is materially stale.

Current `cargo-cultist` work includes deterministic local/read-only analyzers for repository conventions and change-time evidence, concurrent-change preflight, historical companion analysis, CI selector analysis, bounded evidence packets, claim/provenance handling, and decision-memory research.

The central product test has also become empirical: whether selected repository evidence changes the next justified action, prevents a wrong turn, or saves a later worker from repeating investigation. The repository now retains behavioral episodes for both action-changing and quiet cases instead of leaving that question as a future evaluation idea.

Recent August work has pushed further into selected-evidence survival under byte budgets, behavioral-trial comparability, promotion-receipt reuse, concurrent-base movement, divergent lineage, and preserving counterexamples when evidence has to be compressed.

This is now a substantive research/program thread in the owned-work map. It should no longer be summarized as merely a small speculative repository-memory prototype.

## Stensibly — live coordination system

Repository: https://github.com/teamleaderleo/stensibly

State: **live hosted system in ongoing dogfood**.

The hosted Convex + Cloudflare Worker path, REST v1, remote MCP, browser sessions, bearer clients, project/workspace scoping, durable claims/runs/reservations, idempotent writes, handoffs, and guarded GitHub publication remain active.

The current product boundary has moved beyond the original question of whether work can survive a disposable worker session. Real work now crosses worker replacement through durable handoffs and provider-backed continuation. Current engineering is increasingly about compiled worker briefs, provider-outage continuity and reconciliation, human Control Room projections, cross-model recovery drills, exact-CI evidence reuse, unattended settlement, and ambiguity recovery while keeping consequential effects behind explicit server-owned authority.

## SmolRunner — disposable worker path in physical acceptance

Repository: https://github.com/teamleaderleo/smolrunner

State: **pre-alpha, with the disposable GitHub Actions path already in repeated physical Apple-silicon acceptance**.

The repository has exercised prepared Lima/VZ workers, the official GitHub Runner Scale Set bridge, durable assignment/clone/JIT/teardown composition, LaunchAgent supervision, controller-death recovery, and repeated pilot runs. Recent work also hardened same-UID JIT/listener secret exposure and Git checkout-state handling.

The current engineering boundary is post-composition reliability: finish the dependable installed-service one-job lifecycle, close restart/replay ambiguity, extend physical recovery through cancellation/sleep/reboot/outage/teardown cases, and then enforce the hostile-CI network boundary before arbitrary repository code is treated as a production workload.

## Quarry — engineering context, not a public portfolio headline

Quarry has real ongoing engineering work behind it and is useful as an internal/alpha workload and dogfood context.

The public SmolRunner record already mentions repeated Quarry pilot runs because those runs have produced concrete controller/recovery evidence. That is enough for the current career record.

Do **not** promote Quarry into a standalone public-facing portfolio specimen from this file. Keep it as engineering context unless its own shareable evidence later earns a separate public record.

## FEX — validated owned-fork runtime research

Owned fork: https://github.com/teamleaderleo/FEX

Upstream: https://redirect.github.com/FEX-Emu/FEX

State: **validated owned-fork research candidates; no upstream contribution claim**.

The primary Vulkan candidate in the owned fork fixes two demonstrated boundaries:

- callback-sensitive Vulkan functions omitted from dynamic proc-address custom routing;
- GIPA/GDPA availability semantics that could otherwise manufacture a custom guest pointer before native Vulkan approved the command for the supplied scope.

Hosted ARM64 controls and an x86/FEX matrix validate the candidate, including native-null behavior and real-device GDPA semantics. A separate stacked candidate checks that `custom_host_impl` metadata and the manual custom-routing inventory stay identical.

The remaining recorded hardware confirmation is the Apple M5 + Venus path.

Upstream FEX still states `No AI/ML/LLM/etc code contributions.` in `CONTRIBUTING.md`. Keep the distinction explicit: the current work is strong runtime/ABI/Vulkan research in an owned fork. Any future upstream path has to respect upstream's contribution policy.

## Fieldwork and Linux Fieldwork — investigation engines

Repositories:

- https://github.com/teamleaderleo/fieldwork
- https://github.com/teamleaderleo/linux-fieldwork

State: **active research/investigation machinery rather than primary public portfolio centerpieces**.

Fieldwork has recently fed native game/platform scouting, FEX/Vulkan investigation, and browser/session experiments. Linux Fieldwork has carried Cloud Hypervisor work and preserved review lessons, exact live-PR handling, regression-fixture lessons, and other reusable investigation residue.

Their current portfolio value is mostly visible through the external work they help produce and through the repeatable code-first investigation method they preserve.

## Elatura — active prototype and dogfood

Repository: https://github.com/teamleaderleo/elatura

State: **active prototype/dogfood beyond the original observation-only M0**.

The current repository includes observe-only Firefox measurement, a guarded fail-open slim mode, bounded live DOM discovery/windowing and restoration work, a preflighted DOM executor/browser host, Android completion-notification experiments, generic adapter/conformance contracts, deterministic oversized fixtures, bounded local representations, and broader offload experiments.

The open product question remains which intervention layer earns its complexity in real use: suppress/window live page state, use a cheaper local representation, or move execution elsewhere while preserving the native service experience.

## Portfolio-level correction from the previous snapshot

The August sprint did **not** leave the rest of the body of work frozen around Preflight.

The most important status corrections are:

- Preflight has crossed from broad convergence into first-beta release execution, with #1056 already merged and signed rehearsal work active.
- Vite is now a two-merge upstream cluster.
- Cloud Hypervisor is now a three-merge upstream cluster, with QCOW still supplying the deeper review story.
- Cultist has matured into sustained dogfood with a real CLI, multiple deterministic evidence surfaces, and retained behavioral research.
- Stensibly and SmolRunner both continued substantive August engineering.
- Elatura is further beyond observation-only M0 than the older inventory says.
- FEX remains strong validated runtime research, with upstream-policy boundaries kept explicit.
- Quarry belongs in the internal engineering context and dogfood map, not the public headline pool today.

Until the larger durable records are individually rewritten, treat this file as the current status overlay when an older status sentence conflicts with the live repositories.