# Current state — 2026-08-24

This is the short live-status overlay for the work record.

Read this before `portfolio-inventory.md` or `resume-candidates.md` when **status recency** matters. Those files still own the deeper retrieval and editorial story; this file carries the freshest cross-repository position while active engineering continues to move ahead of the longer records.

Source repositories and upstream threads remain authoritative. Prefer durable product boundaries here over moving branch SHAs, short-lived queue states, or one rehearsal that may finish before this file is read again.

## Preflight — operational candidate execution

Repository: https://github.com/teamleaderleo/preflight

Live release board: https://github.com/teamleaderleo/preflight/issues/652

State: **source and rendered-UI convergence are complete; first-beta work is operational candidate execution**.

The private signing and package rehearsals have completed successfully across Linux, macOS, and Windows. The remaining beta gate is tied to one maintainer-authorized immutable tagged candidate generation: choose the release source, exercise the frozen package on native Windows and x86-64 Linux with licensed installations, collect package-bound startup/lifecycle/update/report evidence, and complete the hands-on report-intake canary. Final candidate creation and public release remain separate maintainer decisions.

Release-facing maintenance continued after the rehearsals. Compact is now the normal prepared texture layout; startup entry points and benchmark shutdown were tightened; desktop navigation and common Home controls were made immediate; dependency and support behavior were simplified; package jobs were kept at the verified Rust floor; and repository CI was narrowed so desktop-only work stops paying unrelated package/Maven cost.

**Performance note:** the current repository evidence includes a **13.69s best observed startup** and **14.04s five-run median** for the reviewed G1/deferred-heap-commit candidate condition on the 83-mod M5 MacBook Air profile. Later current-engine observations retained the fourteen-second regime, including 14.49s, 14.84s, and a fresh Balanced→Compact 14.79s run, while other same-machine observations landed around 15.5s. Treat 13.69s as a best observation rather than a new release-candidate campaign. The 2026-08-15 **89.00s ordinary → 15.53s Preflight** controlled same-session comparison remains the clean public before/after campaign, and packaged-candidate evidence is still pending.

Career interpretation: Preflight remains the strongest owned engineering artifact. Its current phase is **release execution / candidate evidence**, with product work converged enough that the remaining claims increasingly belong to frozen package bytes and native acceptance.

## External open-source validation

### Vercel AI SDK

Current record: [`records/open-source.md`](records/open-source.md)

State: **still the strongest external application/tooling cluster**.

The existing record remains directionally current: one direct merged/published fix plus two repairs adopted through AI SDK Factory with retained co-author credit, including the size-limit repair propagated across maintained release branches.

Direct merged/published repair: https://redirect.github.com/vercel/ai/pull/18570

No status correction from this refresh displaces that cluster.

### Vite

State: **two merged upstream fixes, with a third correctness follow-on still open**.

- https://redirect.github.com/vitejs/vite/pull/23207 — merged optimizer resource-lifecycle repair: closes temporary custom-extension analysis bundles on success and error.
- https://redirect.github.com/vitejs/vite/pull/23165 — merged on 2026-08-21: preserves the Rollup/Rolldown lifecycle contract by passing a `buildEnd` failure into `closeBundle(error)` before rethrowing it.
- https://redirect.github.com/vitejs/vite/pull/23208 — open: keeps repeated `resolveConfig()` calls idempotent so resolver-generated environment state does not duplicate optimizer plugins and invalidate a warm optimizer cache.

GitHub currently reports #23208 as non-mergeable. Keep the durable claim at **open correctness follow-on** and let the upstream PR own transient mergeability state.

Career interpretation: Vite is a real **two-merge lifecycle/correctness cluster** with an additional unresolved config-idempotence thread.

### Cloud Hypervisor

State: **three merged upstream Rust/VMM fixes, with the deeper QCOW ownership repair still open**.

Merged work:

1. https://redirect.github.com/cloud-hypervisor/cloud-hypervisor/pull/8699 — exact VMM shutdown events replace SSH disappearance as the lifecycle gate before VM/disk reuse.
2. https://redirect.github.com/cloud-hypervisor/cloud-hypervisor/pull/8709 — ACPI construction failures propagate through typed VM boot errors instead of panicking.
3. https://redirect.github.com/cloud-hypervisor/cloud-hypervisor/pull/8734 — merged on 2026-08-20: VFIO DMA ranges that fit a logical BAR but cross a gap between separately mmap'd sparse areas are rejected unless one mapping covers the complete requested range.

The QCOW follow-on remains open:

- https://redirect.github.com/cloud-hypervisor/cloud-hypervisor/pull/8721 — gives replacement L2 tables ownership before L1 publication and makes the relocation handoff local instead of deferring the old-table release beyond the switch.

GitHub currently reports #8721 as non-mergeable. Preserve the durable technical/review story and defer mergeability to the live PR.

Career interpretation: Cloud Hypervisor demonstrates repeat acceptance across **VM lifecycle, boot/error propagation, and PCI/VFIO mapping semantics**, plus a deeper persistent-metadata ownership review thread.

### Cloudflare Workers SDK

State: **two merged fixes** in the current work record: Miniflare teardown ordering and Cloudflare Access credential/cache freshness.

No status correction from this refresh changes its role as a strong selected OSS specimen.

## Cultist — sustained repository-evidence research

Repository: https://github.com/teamleaderleo/cultist

State: **active research prototype in sustained dogfood**.

Current `cargo-cultist` work includes deterministic local/read-only analyzers for repository conventions and change-time evidence, concurrent-change preflight, historical companion analysis, CI selector analysis, bounded evidence packets, claim/provenance handling, and decision-memory research.

The central product test is empirical: whether selected repository evidence changes the next justified action, prevents a wrong turn, or saves a later worker from repeating investigation. The repository retains behavioral episodes for both action-changing and quiet cases.

Recent work has moved deeper into provider-snapshot correctness: explicit provider-current identity, active-work CI bound to the observed provider snapshot, pagination and bounded-coverage uncertainty kept visible, and one-response file coverage proven only when the provider evidence actually supports it. That sits beside the ongoing selected-evidence budget, behavioral-trial, promotion-receipt, concurrent-lineage, and counterexample work.

This is a substantive research/program thread in the owned-work map. The older small speculative repository-memory description has expired.

## Stensibly — live coordination and continuation system

Repository: https://github.com/teamleaderleo/stensibly

State: **live hosted system in ongoing dogfood**.

The hosted Convex + Cloudflare Worker path, REST v1, remote MCP, browser sessions, bearer clients, project/workspace scoping, durable claims/runs/reservations, idempotent writes, handoffs, and guarded GitHub publication remain active.

Real work now crosses disposable worker sessions through durable handoffs and provider-backed continuation. Recent production work also composes repository attention into mail: material GitHub states can become deterministic mail checkpoints, project-owned continuation handles survive the handoff, webhook observations feed the publisher, and the Quarry dogfood mapping has automatic Gmail delivery active in the Worker. A bounded read-only public GitHub Events fallback can supply observations for that explicit dogfood mapping when the richer provider path is unavailable.

The larger direction remains compiled worker briefs, provider-outage continuity and reconciliation, human Control Room projections, cross-model recovery drills, exact-CI evidence reuse, unattended intake/continuation/settlement, and ambiguity recovery while consequential effects stay behind explicit server-owned authority.

## SmolRunner — trust-tiered hot Linux execution

Repository: https://github.com/teamleaderleo/smolrunner

State: **pre-alpha in live Apple-silicon systems acceptance, with both strict disposable execution and trusted persistent execution under active development**.

The strict disposable path includes prepared Lima/VZ generations, the official GitHub Runner Scale Set bridge, Keychain credential acquisition, durable assignment/no-replay handling, clone/JIT/teardown composition, LaunchAgent supervision, controller-death evidence, exact worker ownership, and repeated physical Quarry pilots.

The product direction has widened from a disposable-runner controller into trust-tiered Linux execution for coding agents and GitHub Actions. Trusted work can keep valuable state resident where policy permits; recent accepted work includes the first persistent runner lane, warm pause/resume and auto-idle behavior, hot-state path policy, immutable Git object-pool primitives and fixed generation markers, plus trusted OverlayFS plan/descriptor checks for reusable Linux state.

The production boundary still includes the dependable installed-service one-job disposable journey, restart-safe ownership for in-flight Lima mutations, wider sleep/reboot/outage/teardown recovery, and the hostile-worker network boundary. Hot execution progresses in parallel while those isolation and recovery guarantees remain explicit.

## Quarry — private engineering and dogfood context

Repository: private `teamleaderleo/quarry`.

State: **active private trading-research lab with broad execution/accounting machinery and live-order permission disabled**.

Quarry now carries materially more engineering than the older “alpha workload” shorthand suggests: immutable dataset/research identities, deterministic backtests and tournaments, causal execution policy, futures/options accounting, exact risk/restart state, verification receipts, read-only broker observation, offline statement evidence, continuation handoffs, and sustained provider/data-fidelity work. Financial evidence remains deliberately stricter than engineering readiness; the repository currently says execution readiness is ahead of scored prospective strategy evidence.

Keep Quarry as internal engineering context in the public career record today. Its strongest public relevance remains the concrete dogfood it provides to SmolRunner and Stensibly plus the engineering techniques it exercises. A separate public portfolio headline should wait for shareable evidence and an explicit publication decision.

## Proofwake — revision evidence index

Repository: https://github.com/teamleaderleo/proofwake

State: **working local evidence index with Proofwake now the primary product identity**.

The repository includes a durable local ledger, Git and GitHub collectors, reports, diagnostics, a local dashboard, read-only MCP, and the existing optional AI-usage estimate module inherited from the Shadowbill phase. Compatibility remains for Shadowbill command/environment/storage identities while clean installs use Proofwake naming.

The product boundary stays observational: collect content-minimised evidence by repository/revision, preserve source freshness/failure/recovery signals, and leave scheduling, runner operation, deployment, mutation approval, and developer ranking to other systems.

## Renderprove — browser evidence tool

Repository: https://github.com/teamleaderleo/renderprove

State: **early-stage working browser-evidence tool with multiple bounded evidence paths already implemented**.

Current capabilities include local or deployed Chromium review receipts, screenshots and hashes, diagnostics, a bounded local MCP surface, disposable rootless-Podman renderer/repeatability probes, bounded interaction plans, deterministic PNG comparison, and optional Cloudflare Gemma advisory artifacts that stay explicitly non-authoritative.

Renderprove fits the broader toolchain as the browser/rendered-output evidence producer: SmolRunner can own execution, Renderprove can see and verify the result, Proofwake can retain the evidence trail, and Stensibly can coordinate the next action.

## FEX — validated owned-fork runtime research

Owned fork: https://github.com/teamleaderleo/FEX

Upstream: https://redirect.github.com/FEX-Emu/FEX

State: **validated owned-fork research candidates; no upstream contribution claim**.

The primary Vulkan candidate in the owned fork fixes two demonstrated boundaries:

- callback-sensitive Vulkan functions omitted from dynamic proc-address custom routing;
- GIPA/GDPA availability semantics that could otherwise manufacture a custom guest pointer before native Vulkan approved the command for the supplied scope.

Hosted ARM64 controls and an x86/FEX matrix validate the candidate, including native-null behavior and real-device GDPA semantics. A separate stacked candidate checks that `custom_host_impl` metadata and the manual custom-routing inventory stay identical.

The remaining recorded hardware confirmation is the Apple M5 + Venus path.

Upstream FEX still states `No AI/ML/LLM/etc code contributions.` in `CONTRIBUTING.md`. Keep the distinction explicit: the current work is runtime/ABI/Vulkan research in an owned fork. Any future upstream path has to respect upstream's contribution policy.

## Fieldwork and Linux Fieldwork — investigation engines

Repositories:

- https://github.com/teamleaderleo/fieldwork
- https://github.com/teamleaderleo/linux-fieldwork

State: **active research/investigation machinery whose value is mostly visible through the external work it produces**.

Fieldwork remains the code-first public research workbench for programmes, target maps, experiments, integration trials, exact-head review, and deliberate upstream delivery. Linux Fieldwork carries the Linux/Debian variant with exact source imports, investigations, current-fieldwork status, and a growing set of review/process lessons from Cloud Hypervisor and related systems work.

Keep their portfolio value attached to the accepted upstream fixes, retained experiments, and repeatable investigation method rather than treating either repo as a generic portfolio centerpiece.

## Elatura — active prototype and dogfood

Repository: https://github.com/teamleaderleo/elatura

State: **active prototype/dogfood beyond the original observation-only M0**.

The repository includes observe-only Firefox measurement, a locked fail-open slim mode, bounded live DOM discovery/windowing/restoration, a preflighted DOM executor/browser host, local Android completion-notification experiments, generic adapter/conformance contracts, deterministic oversized fixtures, bounded local representations, cache/provenance controls, and broader resource/offload experiments.

The open product question is which intervention layer earns its complexity in real use: suppress/window live page state, use a cheaper local representation, or move execution elsewhere while preserving the native service experience.

## Scrapbook / teamleaderleo.com — live site and publication lab

Repository: https://github.com/teamleaderleo/scrapbook

State: **active personal site, private knowledge workspace, and repository-backed publication/evidence lab**.

Current main is on Next.js 16.3.2 / React 19.2.1. Routine hosted CI is intentionally compact: ESLint + Vitest in one lane and the production Next.js build in another, with persistent lint/build caches. Playwright remains an explicit author-side browser tool instead of an ordinary hosted PR gate.

The live product still spans the Operator console, Space notes/review workspace, Time, Gallery/agent guestbook, proxy dashboard, Workbench, Journal, machine-readable agent access/contribution contracts, GitHub activity integration, and isolated visual/interaction experiments.

## Portfolio-level correction from the previous snapshot

The August work is distributed across several active systems. The important status corrections at this refresh are:

- Preflight is in operational candidate execution: private signing rehearsals are complete, source/UI convergence is complete, and remaining beta claims belong to one frozen candidate generation plus native/package evidence.
- Preflight’s current performance record includes a 13.69s best observation and 14.04s five-run candidate-condition median, while 89.00s → 15.53s remains the clean controlled public comparison and packaged-candidate timing is pending.
- Vite is a two-merge upstream cluster; the third idempotence follow-on remains open, with live mergeability owned by the upstream PR.
- Cloud Hypervisor is a three-merge upstream cluster; the deeper QCOW ownership repair remains open, with live mergeability owned by the upstream PR.
- Cultist has matured into sustained dogfood with provider-snapshot correctness, deterministic evidence surfaces, and retained behavioral research.
- Stensibly now has production GitHub-attention → mail continuation in its Quarry dogfood path plus a bounded public GitHub observation fallback.
- SmolRunner is now best described as trust-tiered hot Linux execution: strict disposable work remains central while persistent trusted residency and M6 reusable-state primitives are landing.
- Quarry has substantial private trading-research, accounting, execution, broker-observation, and evidence machinery while live-order permission remains disabled and prospective financial promotion remains deliberately strict.
- Proofwake and Renderprove belong in the current owned-system map as the evidence-memory and rendered/browser-evidence components of the wider toolchain.
- Elatura is well beyond observation-only M0.
- Scrapbook’s routine CI no longer uses Playwright as the ordinary hosted PR gate; browser checks are explicit author-side tools.
- FEX remains validated owned-fork runtime research with upstream-policy boundaries kept explicit.

Treat this file as the recency overlay when a longer portfolio sentence conflicts with a live repository. Rewrite the longer record when a durable product boundary has changed; leave one-day queue state here only when it affects what can truthfully be claimed.