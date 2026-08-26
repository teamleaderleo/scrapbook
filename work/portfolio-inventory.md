# Portfolio inventory

**Last broad refresh:** 2026-08-25

This is a retrieval index, not a second current-state file and not a draft resume.

Read [`current-state.md`](current-state.md) for moving status. Read [`resume-candidates.md`](resume-candidates.md) when choosing scarce one-page space. Use the records linked below for the evidence and editorial history behind a claim.

The source repository or upstream thread wins when any summary here drifts.

## Evidence states

Keep these words literal:

- **landed / published** — the change merged or shipped upstream;
- **adopted through another landing path** — the diagnosis or repair was taken upstream while another author/tool owns the final merge artifact;
- **accepted / approved** — substantive external review exists, while merge may remain separate;
- **positively reviewed** — a submitted review is favorable but does not itself amount to formal approval;
- **submitted / open** — a public carrier exists and disposition is still live;
- **owned product / system** — evidence comes from a repository Leo controls;
- **research** — the mechanism and experiments are real; upstream contribution language waits for an actual upstream boundary crossing.

## Headline pool

### Preflight

Repository: https://github.com/teamleaderleo/preflight  
Current performance record: [`records/preflight-live-performance.md`](records/preflight-live-performance.md)  
Detailed historical record: [`records/preflight.md`](records/preflight.md)

**Use for:** runtime/performance, Java instrumentation, compatibility, measurement, release/product engineering.

Preflight is the strongest owned artifact. The current career-facing performance headline is the observed development arc **~101s → 13.69s** on the 83-mod M5 MacBook Air installation. The older 89.00s → 15.53s same-session result used only five runs per condition and belongs as historical benchmark context; that sample is too small to carry superior evidentiary weight. Let the live performance record own the changing frontier.

What it proves:

- intervention in code and assets the project does not own, with exact identity gates and original-path fallback;
- JFR, seam timing, replay, unattended campaigns, and experiments designed to let attractive explanations lose;
- prepared texture/data/audio/generated-code work, including storage/layout effects where physical pack order changes whole-launch time;
- a native desktop product around the performance work: profiles, settings, diagnostics, privacy-bounded support, updates/rollback, packaging, and candidate evidence.

Career use: **resume lock**.

### Vercel AI SDK

Detailed record: [`records/open-source.md`](records/open-source.md)

**Use for:** TypeScript/runtime correctness, AI tooling, Web Streams, upstream collaboration.

Current cluster: one direct merged/published repair plus two contributor repairs adopted through AI SDK Factory into merged commits with retained co-author credit; one repair also propagated across maintained v5/v6 branches.

Career use: **resume lock**, especially for devtools/AI-runtime roles.

### Cloud Hypervisor

Detailed record: [`records/open-source.md`](records/open-source.md)

**Use for:** Rust/VMM systems work, lifecycle, error propagation, PCI/VFIO semantics, persistent metadata review.

Current cluster: four merged fixes across exact shutdown/reuse, typed ACPI boot failures, sparse VFIO BAR mapping, and QCOW L2 metadata ownership/refcount ordering before publication.

Career use: **resume lock** for systems/platform work.

### React

Detailed current record: [`records/react-fragment-ref.md`](records/react-fragment-ref.md)

**Use for:** React/frontend runtime semantics, DOM event identity, ownership before mutation, core-library regression design.

Current state: React PR #37251 is **open with one positive submitted review**. The reviewer wrote “Solid PR. Tests cover the important paths.” GitHub records the review as `COMMENTED`, so do not promote that to approved or accepted.

The repair checks that a Fragment owns a listener before traversing children to remove it. Unknown Fragment removals therefore become no-ops instead of deleting a child-owned listener or dropping the wrong retained Fragment registry entry through a `-1` lookup. The same patch normalizes omitted listener options to the same capture-false identity as `false` and `{capture: false}`.

Career use: **strong open alternate**, especially for React/frontend-runtime roles. It gains substantially if formal approval or merge follows.

### Vite and Cloudflare Workers SDK

Detailed record: [`records/open-source.md`](records/open-source.md)

**Use for:** mature TypeScript monorepos, lifecycle/state correctness, developer tooling.

- Vite: two merged lifecycle/correctness fixes plus an open repeated-config-resolution idempotence follow-on.
- Cloudflare Workers SDK: two merged repairs across Miniflare teardown and Access credential/cache freshness.

Career use: strong role-specific OSS specimens. Pick the mechanism that adds the most new signal.

## Owned systems

### Stensibly

Repository: https://github.com/teamleaderleo/stensibly

**Current identity:** live hosted responsibility/authority and continuation system.

What it proves:

- durable work/authority state independent of one model or process;
- leases, claims, idempotency, exact-CAS external effects, reconciliation, and project/workspace boundaries;
- continuation through disposable workers and provider ambiguity;
- production repository-attention → mail checkpoints with project-owned continuation handles and a bounded read-only public GitHub observation fallback.

Career use: strong agent coordination / durable execution specimen.

### Glaeda

Repository: https://github.com/teamleaderleo/smolrunner

**Current identity:** pre-alpha trust-tiered Linux execution on operator-owned Apple-silicon Macs.

What it proves:

- a substantial disposable Lima/VZ + official Runner Scale Set controller with exact ownership/recovery;
- trusted persistent execution as a first-class path rather than a future slogan;
- landed M6 primitives for hot-state measurement, path policy, project-disk leases, OverlayFS task views/mount plans, immutable Git object pools/markers, and copy-on-write Git index handling;
- a product metric centered on agent wall-clock time while residency depends on trust and validity.

Career use: strong systems/security/coding-agent execution specimen.

### Cultist

Repository: https://github.com/teamleaderleo/cultist

**Current identity:** active repository-evidence research prototype in sustained dogfood.

What it proves:

- deterministic local analyzers for change evidence, concurrent-work preflight, historical companions, and CI selectors;
- bounded context/evidence selection, provenance, counterexamples, decision memory, and compact representation research;
- behavioral evaluation of whether evidence changes a later worker's action;
- provider-snapshot identity and conservative `UNKNOWN` semantics when active-work evidence is partial or stale.

Career use: research/devtools specimen for coding-agent context, review intelligence, and evaluation.

### Elatura

Repository: https://github.com/teamleaderleo/elatura

**Current identity:** active browser/device prototype beyond observation-only M0.

What it proves:

- observe-only Firefox measurement plus a locked fail-open slim mode;
- bounded live DOM discovery/windowing/restoration and a preflighted DOM executor;
- local Android completion-notification experiments;
- generic adapter/conformance, schema-drift, cache/provenance, and oversized synthetic fixture work.

Career use: high-concept browser/runtime/product-systems bench.

### Renderprove

Repository: https://github.com/teamleaderleo/renderprove

**Current identity:** browser/rendered-output evidence producer.

What it proves:

- Chromium receipts, screenshots/hashes/diagnostics, bounded interaction, local MCP, and rootless-Podman repeatability probes;
- deterministic PNG comparison;
- source-oriented optional AI advice kept separate from deterministic browser disposition;
- landed screenshot `vision-check` packet/canonicalization/privacy contracts and provider-free `vision-advice-v1` normalization.

Career use: supporting coding-agent evaluation / browser QA specimen.

### Proofwake

Repository: https://github.com/teamleaderleo/proofwake

**Current identity:** local revision-evidence index; Proofwake is the primary product identity and Shadowbill remains compatibility/optional estimation functionality.

What it proves:

- content-minimised local Git and signed GitHub observation ingestion;
- durable append-oriented evidence and deterministic repository/revision/activity projections;
- task-specific evaluation observations and `proofwake evaluation` projections with current/history/coverage/uncertainty semantics;
- read-only MCP access without routing, approval, merge, or deployment authority.

Career use: supporting evidence-memory / evaluation / reliability specimen.

### Quarry

Repository: private `teamleaderleo/quarry`.

**Current identity:** private trading-research lab; live-order permission disabled.

What it proves internally:

- immutable research/data identities, deterministic experiments, causal execution policy, exact accounting/risk/restart state, broker observation, and continuation/evidence machinery;
- retained negative strategy results instead of promotion-by-backtest;
- current market-data work including exact-decimal public equity OHLCV and a research-only Coinbase L2 quote-attempt recorder with explicit no-order/no-promotion authority.

Career use today: private engineering/dogfood context unless a shareable boundary is selected later.

### Scrapbook / teamleaderleo.com

Repository: https://github.com/teamleaderleo/scrapbook

**Current identity:** live personal site, private knowledge workspace, and repository-backed publication/evidence lab.

What it proves:

- long-lived product stewardship and aggressive retirement of dead surfaces;
- Workbench, Agent Journal, Guest Check-in, and machine-readable contribution/access contracts;
- public `/work` synthesis over repository-owned evidence;
- a deliberately cheap CI/browser/deployment policy: routine lint/unit/build, browser checks when the browser adds signal, previews only when a deployed URL adds evidence.

Career use: public container and frontend/product breadth; rarely a scarce one-page headline.

### Fieldwork and Linux Fieldwork

Repositories:

- https://github.com/teamleaderleo/fieldwork
- https://github.com/teamleaderleo/linux-fieldwork

**Current identity:** code-first investigation workbenches.

What they prove:

- source-first research across unfamiliar repositories;
- exact evidence, discriminators, negative controls, retained negative results, and explicit external-contact boundaries;
- a reusable review method whose strongest value appears in the upstream work it produces;
- current writing guidance that favors the concrete question, mechanism, consequence, evidence limit, and decision over template ceremony.

Career use: method/synthesis evidence, plus individual upstream results where they have their own external disposition.

## Accepted findings where the landing path differed

Detailed record: [`records/open-source.md`](records/open-source.md)

Keep these for interviews and mechanism-rich portfolio discussion:

- **Zustand:** identified stale async hydration after `clearStorage()` and supplied the generation-invalidation repair later implemented upstream through another PR.
- **BuildKit:** identified rootless/rootful output divergence; upstream kept the diagnosis and chose the opposite compatibility boundary for the final repair.
- **runc:** identified the off-by-one relationship, then accepted repository-history evidence that the cleaner fix belonged in `MaxCPU` semantics instead of the submitted allocation patch.
- **Playwright:** identified a production MCP shutdown-authority leak; a maintainer merged a smaller project-native `isUnderTest()` gate.

These are strong judgment stories precisely because the final GitHub badge does not tell the whole story.

## FEX research

Owned fork: https://github.com/teamleaderleo/FEX  
Primary investigation: https://github.com/teamleaderleo/linux-fieldwork/pull/669

Use as systems/runtime research: dynamic proc-address routing, generated thunk lifetime, cross-ISA ABI mediation, Vulkan/GL callback semantics, moved reloads, and experimental architectures that were allowed to lose.

Keep the boundary explicit: owned-fork research and real runtime evidence; upstream contribution language waits for an upstream-compliant submission.

## How to use this index

For a one-page resume, start with [`resume-candidates.md`](resume-candidates.md). For a live status question, start with [`current-state.md`](current-state.md). For Preflight numbers, start with [`records/preflight-live-performance.md`](records/preflight-live-performance.md). For React, use [`records/react-fragment-ref.md`](records/react-fragment-ref.md) plus the live upstream carrier. For other upstream attribution/status, use [`records/open-source.md`](records/open-source.md) and the live upstream carrier.

A current source repository should only have to say a fact once. When engineering changes, update the owner and the small number of projections that people actually read; avoid growing another parallel summary merely because a new task needs context.
