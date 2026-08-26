# Resume candidates

This file is intentionally churny. It answers one question: **if Leo had to ship a one-page resume today, which evidence earns the space?**

Read [`current-state.md`](current-state.md) first for moving project status. For Preflight performance, [`records/preflight-live-performance.md`](records/preflight-live-performance.md) owns the current career-facing numbers. Source repositories and upstream review remain authoritative for the underlying work.

## Current market framing

The page should read like an engineer with a strange amount of current evidence, not like somebody trying to turn every repository into employment history.

A quiet descriptor still fits:

> Software Engineer — Runtimes, Developer Tools & Performance

No summary paragraph by default. Name, contact, GitHub, site, LinkedIn; let the work do the arguing.

## General one-page cut

### Selected open-source engineering

**Vercel AI SDK — lock.** One direct merged/published repair plus two independently developed Web Streams repairs adopted through AI SDK Factory with retained co-author credit. One of those repairs propagated across maintained v5/v6 release branches.

Candidate line:

> Fixed stateful URL matching in `@ai-sdk/provider-utils` and developed two Web Streams cleanup/error-precedence repairs later adopted by Vercel's AI SDK Factory into merged commits with co-author credit; one repair propagated across maintained v5/v6 branches.

**Cloud Hypervisor — lock for systems breadth.** Three merged Rust/VMM fixes now cover exact shutdown lifecycle, typed ACPI boot-error propagation, and sparse VFIO BAR mapping semantics. The open QCOW follow-on reaches persistent L2 metadata ownership/refcount ordering.

Candidate line:

> Landed three Cloud Hypervisor fixes across VM shutdown/reuse, typed ACPI boot failures, and sparse VFIO BAR mapping; a deeper reviewed follow-on addresses QCOW L2 ownership before metadata publication.

**Cloudflare Workers SDK — strong alternate.** Two merged fixes: Miniflare teardown ordering and Cloudflare Access credential/cache freshness.

**Vite — strong alternate.** Two merged lifecycle/correctness fixes: temporary optimizer-analysis bundle cleanup and `closeBundle(error)` propagation after `buildEnd` failure. A repeated-`resolveConfig()` idempotence repair remains open.

**React — strong open alternate.** PR #37251 fixes Fragment-ref event-listener registry identity. `FragmentInstance.removeEventListener()` currently mutates child listener state before proving the Fragment registered that listener; an unknown removal can therefore remove child-owned state or corrupt retained Fragment listener bookkeeping. The same repair makes omitted options share the DOM `capture: false` identity of explicit `false`/`{capture: false}`.

The PR is open and has one positive submitted review: “Solid PR. Tests cover the important paths.” GitHub records that review as `COMMENTED`, not `APPROVED`, so use **positively reviewed** rather than approved/accepted/merged. Detailed record: [`records/react-fragment-ref.md`](records/react-fragment-ref.md).

Candidate line if a React/frontend-runtime target benefits from an open reviewed specimen:

> Repaired React Fragment-ref listener ownership/identity so unknown removals become no-ops before child mutation and omitted capture options match DOM listener identity; the open PR received a positive review covering the focused regressions.

The general resume still does not need every cluster. React rises when the role values React/runtime semantics; merged/adopted clusters retain stronger default disposition evidence today.

### Independent engineering

#### Preflight — absolute lock, largest allocation

The current headline is the development frontier the system actually reached:

> **~101s worst observed startup → 13.69s best observed startup on the 83-mod M5 MacBook Air development installation.**

That is the preferred career-facing result. The older 5+5 same-session sample (89.00s ordinary median, 15.53s Preflight median) is a small historical benchmark sample with too little replication to carry superior evidentiary weight. Do not use it to qualify, police, or replace the ~101s → 13.69s headline.

The resume can lead with the observed frontier and say what the system is:

> Built a cross-platform Java-agent performance and compatibility layer for an 83-mod legacy game stack, cutting observed startup from roughly 101s to 13.69s while preserving exact source/classloader/bytecode gates and original-path fallback for changed inputs.

A second line should explain the engineering rather than pile on another number:

> Precompute and replay texture, data, audio, resource-index, and generated-bytecode work; learned Compact packs retain roughly 1.1 GB on the measured profile, and physical pack order itself produced a whole-launch difference from 33.53s alphabetic to 14.174s learned order.

A third line can carry the investigation method:

> Built JFR, seam-level timing, replay, and unattended benchmark tooling that exposed hidden critical-path owners—including a ~27s prefetch wait and million-scale resource-path work—and repeatedly let attractive optimization theories lose before implementation.

For release/product roles, swap the third line toward native macOS/Windows/Linux packaging, signed update/rollback, support/privacy boundaries, profiles/settings, and candidate evidence.

#### Stensibly — one dense line in the general cut

> Built and operate a hosted human-agent responsibility/authority ledger across Cloudflare Workers, Convex, REST and MCP, with durable claims/leases, idempotent commands, exact-CAS GitHub effects, provider reconciliation, and repository-attention → mail continuation through disposable worker sessions.

This can take more space for agent coordination, durable execution, or reliability roles.

#### SmolRunner — strong systems/agent-execution alternate

The old “disposable runner controller” line is too narrow now.

> Building a Rust trust-tiered Linux execution layer on Apple-silicon Macs: disposable Lima/VZ workers for hostile CI plus persistent trusted lanes with crash-safe project leases, OverlayFS task views, immutable Git object pools, exact ownership, and recovery state.

For coding-agent environment roles, SmolRunner can outrank a fourth upstream logo.

#### Cultist — role-specific research/devtools alternate

> Building deterministic repository-evidence tooling for coding agents: change-time analysis, concurrent-work preflight, historical companions, bounded context packets, provider-snapshot correctness, and behavioral trials measuring whether surfaced evidence changes the next action.

This is especially useful for evaluation, review intelligence, coding-agent context, and research-engineering roles.

#### Glossless — frontend/product/graphics alternate

Keep for creator-tool, UI, browser, or graphics-oriented applications. It earns space when visual/product breadth adds more than another systems tool.

### Industry experience

IBM stays compact. It proves conventional team/employer experience; it no longer has to carry the technical identity of the page.

Candidate material:

- Java E2E/integration work across IBM Cloud AI/ML and data paths with Kafka/Spark/Snowflake and hybrid/on-prem environments; a critical RBAC issue required coordination across three teams.
- Onboarding/setup reduced from roughly 3h to 15m through a consolidated maintained workflow/documentation path.

### Education and skills

> University of Toronto — BSc, Mathematics, Statistics & Computer Science — 2024

Keep skills boring and target-specific.

> **Languages:** TypeScript/JavaScript, Rust, Java, Python, Go, SQL  
> **Technologies:** Linux, React, Node.js, Cloudflare Workers, Docker, AWS, PostgreSQL, Git

## Role cuts

### Runtime / game / performance

Preflight dominates. Follow with Cloud Hypervisor, the best FEX research story, SmolRunner, and one graphics/product specimen if useful. The pitch is runtime investigation and productization around a system whose source ecosystem you do not own.

### Developer tools / AI runtime

Lead with Vercel AI SDK, then Vite/Cloudflare, Preflight, Stensibly, and Cultist. React becomes a useful alternate when the role touches frontend runtime/state semantics. Cloud Hypervisor stays useful because it proves the reasoning travels outside TypeScript/AI codebases.

### React / frontend runtime

React #37251 is now the cleanest current React-core specimen: listener ownership before destructive mutation, retained Fragment registry identity, DOM capture normalization, and focused tests around new-child propagation and child-owned listener preservation.

Pair it with Vite, selected Cloudflare/AI SDK runtime work, and Glossless/Scrapbook only when product/frontend breadth helps. Keep the PR status explicit until upstream disposition changes.

### Coding-agent evaluation / environments

Preflight, SmolRunner, Cultist, Renderprove, Proofwake, Stensibly, and the upstream repair record finally read as one coherent body of work: execution, evidence production, evidence selection, durable memory, coordination, and real repository repair.

Do not put all six owned systems on one page. Pick the few whose mechanisms match the job.

### Systems / platform

Cloud Hypervisor first; Preflight runtime work and SmolRunner next. BuildKit/FEX research can replace application-layer OSS when the role benefits from deeper Linux/runtime context.

### Agent coordination / durable execution

Stensibly and SmolRunner lead the owned work. Proofwake/Renderprove/Cultist become supporting evidence for how execution, observation, memory, and context stay separate instead of collapsing into one giant agent platform.

## Things to keep out of the resume

Keep the distinctions clean:

- merged, adopted, approved, positively reviewed, open, and research-only are different states;
- component measurements do not add up to an end-to-end speedup;
- the ~101s → 13.69s Preflight headline is the preferred career-facing result; the 89.00s → 15.53s 5+5 sample is historical benchmark context only, with too little replication to carry superior evidentiary weight;
- React #37251 currently has a positive `COMMENTED` review, not formal approval or merge;
- FEX remains owned-fork/runtime research under the upstream project's contribution policy;
- recruiter outreach is targeting context, not an accomplishment;
- a repository existing is not a reason to spend a line on it.

Before exporting a bullet, reread current source and the exact evidence it relies on. If the engineering moved, update this file instead of preserving the prettier old sentence.
