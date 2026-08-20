# All-cause interview success set

Updated: 2026-08-11

This is a coverage model, not a prediction that every company uses every interview type. The goal is to reduce avoidable single-point failures across the union of common SWE hiring mechanisms while preserving Leo's actual engineering strengths.

## Principle

Do not optimize for one company's remembered loop. Optimize for the largest practical set of interview causes:

1. application/recruiter screen;
2. resume/project deep dive;
3. coding fundamentals / algorithms;
4. practical code production;
5. debugging and code reading;
6. testing and correctness reasoning;
7. system design;
8. state/distributed-systems reliability;
9. performance and observability;
10. language/runtime depth;
11. low-level systems fundamentals where relevant;
12. product/user judgment;
13. behavioral/collaboration;
14. take-home/work-sample execution;
15. interview mechanics under time pressure;
16. company/role calibration and logistics.

A candidate does not need equal depth in every bucket. The target is no obvious catastrophic hole and several areas of undeniable strength.

## Current strongest axes

Leo already has unusually strong evidence for:

- unfamiliar-codebase entry and source archaeology;
- debugging state/lifecycle/correctness boundaries;
- profiling and performance investigation;
- designing discriminating controls rather than trusting first explanations;
- cache identity/invalidation and replay semantics;
- fail-open/fail-closed reasoning;
- exact-source compatibility boundaries;
- async/retry/idempotency/lease/authority reasoning;
- open-source review and repair-boundary adjustment;
- sustained independent technical pursuit;
- AI-assisted engineering with strong human verification and selection.

The preparation problem is therefore increasingly **compression, recall, and bounded execution**, not finding more technical material.

## Coverage matrix

### 1. Application and recruiter screen

**Failure mode:** chronology or title history causes the profile to be classified as 0-YOE/new-grad before the work is understood.

**Target standard:**

- clean answer: roughly three years of substantive software-engineering experience;
- immediately distinguish conventional employment (~16 months IBM) from independent/open-source/product engineering (~2 years);
- explain the unusual chronology in under 30 seconds without sounding defensive;
- role-specific application thesis in one paragraph;
- no inflated claim of three years conventional post-grad full-time employment.

**Practice:** rapid recruiter prompts: YOE, why this role, why now, what have you been doing since graduation, compensation/location/relocation, strongest recent work.

### 2. Resume/project deep dive

**Failure mode:** impressive bullets collapse under probing, or explanations expand into ten-minute research histories before answering the question.

**Target standard:** every resume bullet supports:

- 15-second headline;
- 2-minute coherent story;
- 10-20 minute technical drill-down;
- exact claim/evidence boundary;
- one thing that went wrong or changed the design;
- one trade-off consciously rejected.

**Source backlog:** Preflight, Cloud Hypervisor, Vercel AI SDK, Cloudflare Workers SDK, Stensibly, SmolRunner, IBM.

### 3. Coding fundamentals / algorithms

**Failure mode:** strong real-world engineer loses a conventional loop on bounded graph/array/string/DP work.

**Target standard:** comfortable medium-level implementation without external help, including:

- arrays/strings/hash maps/sets;
- stacks/queues;
- linked structures;
- trees/BSTs;
- graphs, BFS/DFS/topological ordering;
- heaps/priority queues;
- binary search and monotonic conditions;
- intervals/sweep basics;
- recursion/backtracking;
- common dynamic-programming shapes;
- complexity analysis and edge cases.

**Practice:** timed, syntactically correct code with explicit tests. Favor repeated pattern retrieval over puzzle collecting.

### 4. Practical code production

**Failure mode:** candidate can reason but is slow writing ordinary production-shaped code without an LLM/IDE safety net.

**Target standard:** quickly implement bounded real-world components in one primary interview language, probably TypeScript by default, with Python/Java/Rust/C++ available by role.

Drill shapes:

- async iterator cleanup;
- stream transforms and cancellation;
- cache with invalidation;
- retry/backoff policy;
- bounded concurrency;
- idempotent command handling;
- parser/normalizer;
- filesystem/resource lookup;
- small state machine;
- rate limiter;
- producer/consumer queue;
- simple HTTP client/server boundary;
- data transformation with tests.

Use real patterns from prior work instead of synthetic API trivia.

### 5. Debugging and unfamiliar-code reading

**Failure mode:** this is actually a strength, but interview time causes over-exploration.

**Target standard:** within minutes:

1. state the observable failure;
2. name 2-4 plausible classes of cause;
3. choose the cheapest discriminator;
4. inspect only the owning path;
5. update the hypothesis visibly;
6. propose the smallest defensible repair;
7. identify the regression test.

**Backlog drills:** runc MaxCPU boundary, Bat wrong-path harness, Preflight 27s queue wait, Cloudflare stale credentials, Vercel regex state, Zustand hydration generation.

### 6. Testing and correctness

**Failure mode:** implementation works on happy path but interviewer is evaluating adversarial reasoning.

**Target standard:** for any change, naturally ask about:

- ownership of mutable state;
- retries/replay;
- cancellation;
- failure during cleanup;
- stale work completing late;
- partial failure;
- concurrency/order;
- invalid input;
- resource leaks;
- compatibility/fallback;
- exact negative controls.

The work record already contains many ideal examples. Turn them into short test-design prompts.

### 7. System design

**Failure mode:** knows distributed systems concepts but presents them as an unbounded design monologue.

**Target standard:** disciplined interview sequence:

1. clarify users/requirements;
2. state scale and key SLOs;
3. define API/data model;
4. draw the minimal happy path;
5. identify state owners;
6. add failure/retry/idempotency semantics;
7. discuss consistency and partitioning;
8. observability/security/operations;
9. explicit trade-offs and what is deferred.

**Drill sources:** Stensibly, SmolRunner, Preflight diagnostics intake, GitHub publication, job/lease coordination.

### 8. Distributed-state / reliability design

This deserves separate depth because many modern tooling/agent roles care about it even when the interview is not labeled "system design."

Be fluent in:

- at-least-once vs at-most-once effects;
- idempotency keys;
- compare-and-swap/version fencing;
- leases and expirations;
- leader/owner authority;
- durable checkpoints;
- replay receipts;
- ambiguous completion;
- retries after partial external effects;
- queues and backpressure;
- eventual vs strong consistency;
- time/clock assumptions;
- recovery after crash between observation and mutation.

Stensibly and SmolRunner provide concrete examples for almost every item.

### 9. Performance / observability

**Failure mode:** talks numbers but cannot explain measurement validity.

**Target standard:** be able to reason through:

- baseline definition;
- warm/cold caches;
- interleaving/randomization;
- variance/noise;
- critical path vs aggregate CPU;
- profiler attribution errors;
- counters vs time;
- microbenchmark vs end-to-end effects;
- instrumentation overhead;
- rollback/negative controls;
- when an optimization is not worth shipping.

Preflight is the main drill corpus.

### 10. Language/runtime depth

Use a broad base plus role-specific specialization.

**TypeScript/JavaScript:** event loop, promises/microtasks, streams, iterators, object identity/mutation, RegExp state, Node/browser runtime differences, module/package basics, TypeScript type modeling.

**Rust:** ownership/borrowing, Result/error design, traits/generics, Send/Sync intuition, concurrency, lifetimes at practical level, unsafe boundaries conceptually, cargo/testing/build targets.

**Java/JVM:** class loading, bytecode/instrumentation, concurrency basics, memory/GC intuition, streams/collections, exceptions, JAR/classpath behavior, JIT/runtime basics.

**C++ when Valve/systems-targeted:** RAII, object lifetime, move semantics, references/pointers, smart pointers, containers, iterators, virtual dispatch, templates basics, concurrency primitives, memory layout/cache locality, undefined behavior basics, build/debug workflow.

**Go/Python:** enough production fluency for role-specific loops, not resume-list trivia.

### 11. Low-level systems fundamentals

For systems/Valve/infra loops, keep warm:

- processes vs threads;
- virtual memory/pages;
- files/file descriptors;
- sockets and basic TCP/HTTP;
- signals;
- locks/atomics/races/deadlocks;
- scheduling/affinity basics;
- filesystem/path semantics;
- syscalls and user/kernel boundaries;
- containers/namespaces/cgroups at conceptual level;
- serialization/endian/alignment basics;
- CPU cache/locality intuition.

Cloud Hypervisor, Linux Fieldwork, runc, Bubblewrap, util-linux and Preflight supply real examples.

### 12. Product/user judgment

**Failure mode:** independent technical work reads as internally interesting but disconnected from users/business.

**Target standard:** answer:

- who is this for?
- what pain changed?
- what was the smallest useful version?
- what did you deliberately not build?
- what evidence says the feature mattered?
- what would real user feedback change next?

Shipping Preflight materially strengthens this axis.

### 13. Behavioral / collaboration

Prepare reusable stories, not scripts, for:

- disagreement/change of mind;
- ambiguous problem ownership;
- failure or wrong hypothesis;
- cross-team collaboration;
- initiative without assigned tickets;
- learning a new domain quickly;
- prioritization and killing work;
- receiving review feedback;
- handling a production/critical bug;
- balancing speed and correctness;
- communicating progress/blockers;
- why independent work rather than conventional employment during this period.

Best stories are often reversals: runc, Preflight killed theories, Cloud Hypervisor review, IBM RBAC/hotfix.

### 14. Take-home / work sample

**Failure mode:** overbuilds or produces a research project where a bounded deliverable was requested.

**Target standard:**

- read instructions first;
- identify acceptance criteria;
- produce a small coherent implementation;
- tests + README + trade-offs;
- no speculative architecture;
- state what would be next with more time;
- clean commit/diff hygiene.

AI/tool policy should be read literally for each exercise.

### 15. Interview mechanics

This is a first-class skill.

Practice:

- clarify before coding but do not stall;
- narrate the decision, not every thought;
- timebox exploration;
- accept hints cleanly;
- write code before polishing abstractions;
- test examples manually;
- state complexity;
- leave 5-10 minutes for edge cases;
- recover calmly from a wrong path;
- ask useful interviewer questions;
- switch from deep research mode to bounded delivery mode on command.

The target is not performative confidence. It is making real reasoning visible at interview speed.

### 16. Company/role calibration and logistics

Before each interview refresh:

- current job description;
- exact team/product surface;
- stated language/runtime expectations;
- current seniority/YOE requirements;
- interview format if the company provides it;
- location/relocation/work-authorization requirements;
- which work-record specimens best match the role.

Leo is TN-eligible for qualifying US employment, so US location itself is not a reason to exclude a role; exact occupation/employer paperwork still needs to satisfy the TN category in practice.

## Current risk ranking

### Highest deliberate-prep value

1. Timed coding / algorithms.
2. Fast unaided production coding.
3. System-design compression.
4. C++ depth if Valve becomes an active target.
5. Behavioral story retrieval/compression.
6. Product/user evidence via actually shipping Preflight.

### Already strong; maintain rather than obsess

- debugging unfamiliar systems;
- state/lifecycle correctness;
- performance investigation;
- test design;
- source archaeology;
- technical depth in resume projects;
- learning velocity.

## Drill generator from the existing corpus

A future Scrapbook practice surface should be able to generate multiple drill modes from work records.

### Recall

"Explain why `RegExp.lastIndex` mattered in AI SDK in 60 seconds."

### Reimplementation

"Implement a helper that evaluates a stateful regex from index zero and restores caller state even on throw."

### Debugging

"A cache is correct but end-to-end latency barely moves. What discriminators do you run next?"

### Test design

"`clearStorage()` races a pending async hydration. Write the smallest controls that establish desired semantics."

### System design

"Design a replay-safe GitHub file publication API with exact preconditions and ambiguous-result recovery."

### Systems

"Why is SSH loss not equivalent to completed VM shutdown? What event/state should own the transition?"

### Performance

"A log timeline attributes 13 seconds to texture loading. Design an instrument that can disprove that attribution."

### Behavioral

"Tell me about a technically correct observation that led you to the wrong repair boundary."

### Language transfer

"Rewrite one familiar TypeScript state-machine/caching exercise in Rust, Java, Go or C++ and discuss what semantic assumptions changed."

## External calibration notes

Current official examples support treating the union seriously rather than assuming every modern company has abandoned conventional loops.

- Vercel has publicly described an intern interview that mimicked on-the-job problem solving, encouraged clarifying questions and Google, and emphasized reasoning aloud rather than LeetCode-style traps. This is useful directional evidence, not a guarantee that every 2026 full-time loop is identical.
- Amazon's current SDE II preparation explicitly combines timed coding, system-design scenarios and behavioral/work-style evaluation; its loop includes multiple interviews and expects syntactically correct, robust, well-tested code.
- Current Google SWE postings around the two-year experience band still explicitly mention data structures/algorithms in some roles, so conventional algorithm fluency remains useful even for a candidate whose real-world engineering is stronger than their puzzle practice.
- Current Valve software-engineering descriptions still emphasize broad/deep engineering, shipping, self-direction, and—on game/hardware paths—C/C++.

Therefore the robust strategy is hybrid: prepare practical debugging/building **and** conventional coding/design fundamentals.

## Success criterion

The end state is not "Leo can pass every possible interview question."

It is:

> Given a plausible SWE interview format for a role Leo should reasonably target, there is no predictable category where the candidate is obviously underprepared relative to the strength of the underlying engineering evidence.

That is the all-cause interview success set.
