# Interview prerequisite doctrine

Updated: 2026-08-11

This record captures a preparation principle that changes the interpretation of the broader all-cause interview-success set.

## Starting evidence

Leo has already passed a Google L3 software-engineering loop strongly. That matters because it is concrete evidence that conventional algorithmic/coding interviews are not an inherently inaccessible category when the expected preparation surface is known and practiced.

The preparation problem should therefore not be modeled as "become generally smarter" or "grind an unlimited number of interview questions."

The working model is:

> remove information asymmetry, identify the prerequisite graph, learn it deliberately, then verify recall and execution under the actual interview constraints.

Algorithms remain part of the coverage set because skills decay and companies vary. They are maintenance unless evidence shows a fresh weakness.

## The enemy: hidden prerequisites

Many interview failures are not caused by inability to learn the tested material. They are caused by discovering too late that a company silently expected a particular body of knowledge, vocabulary, language fluency, interview convention, or problem shape.

Examples:

- a systems role assumes practical C++ object-lifetime fluency even though the project discussion is language-agnostic;
- a distributed-systems interview expects standard vocabulary around leases, fencing, idempotency, consistency and backpressure;
- a product-infrastructure loop expects HTTP/cache/CDN fundamentals that were not emphasized in the recruiter conversation;
- an ordinary coding round assumes graph/heap/interval patterns have stayed warm;
- a debugging round rewards aggressive narrowing rather than the open-ended research style appropriate to Fieldwork;
- a behavioral round expects concise ownership/conflict/failure stories rather than a raw technical chronology;
- a company allows documentation/search but not LLM assistance, changing the implementation-speed requirement;
- a game/runtime role assumes C++ and graphics/runtime vocabulary even when the candidate's transferable reasoning is strong.

These are discoverable prerequisites. The preparation system should hunt them explicitly.

## Per-pipeline prerequisite map

Before serious preparation for an interview, construct one current map with four layers.

### 1. Explicit requirements

Read the current job description, recruiter material, official interview-prep pages and any instructions attached to the scheduled rounds.

Capture:

- languages and frameworks named;
- systems/domain concepts named;
- seniority and ownership expectations;
- interview round labels;
- allowed tools;
- expected artifact/work-sample format;
- role-specific operational experience;
- product/team surface.

### 2. Strongly implied prerequisites

Infer only what the role/interview structure reasonably implies.

Examples:

- CDN/content infrastructure -> HTTP caching, cache keys, invalidation, origin/edge behavior, observability;
- game/runtime -> C++, memory/lifetime, profiling, frame/runtime thinking;
- workflows/agent infrastructure -> queues, retries, durable state, idempotency, cancellation, leases/fencing;
- SDK/devtools -> API compatibility, streams/async behavior, package/runtime boundaries, testing;
- low-level systems -> processes, files, signals, memory, concurrency, OS/kernel interfaces.

Do not confuse a plausible prerequisite with a requirement. Tag inference separately from explicit evidence.

### 3. Interview-format prerequisites

Research the current mechanics where reliable information exists:

- timed algorithmic coding;
- practical implementation;
- debugging/code reading;
- system design;
- project deep dive;
- behavioral;
- take-home/work sample;
- language-specific or domain-specific round.

The format itself changes what "knowing" means. A concept that can be explained with notes is not necessarily available under a 35-minute coding round.

### 4. Personal delta

For every prerequisite, mark one of:

- **proven/warm** — recently demonstrated under similar constraints;
- **known/cold** — understood but retrieval/implementation speed needs refresh;
- **transferable** — adjacent evidence exists; learn the local vocabulary/idioms;
- **new but bounded** — real prerequisite with a finite syllabus;
- **evidence gap** — cannot be fixed by studying alone (for example years operating a production fleet);
- **unknown** — requires more reconnaissance before allocating study time.

The point is to turn vague anxiety into a finite dependency graph.

## Study order

Once the map exists:

1. eliminate unknowns that could materially change the syllabus;
2. learn genuinely new bounded prerequisites;
3. warm known-but-cold foundations;
4. translate existing deep knowledge into the target domain's vocabulary;
5. practice the exact interview operation: code, debug, design, explain, review, or write;
6. run timed/simulated verification;
7. update the map from failures rather than repeating already-mastered material.

Study breadth should follow expected failure probability, not generic prestige.

## Definition of mastery

For an interview prerequisite, "I have read about it" is not enough.

A useful ladder is:

- **recognize** — identify the concept and why it matters;
- **explain** — give a clear two-minute account without notes;
- **apply** — solve a representative bounded problem;
- **implement** — produce correct code/design from a blank surface;
- **debug** — recognize the concept when disguised inside a failure;
- **transfer** — apply the same principle in another language/system;
- **defend** — answer adversarial follow-ups and trade-offs;
- **timed** — do the relevant operation within interview constraints.

Not every prerequisite needs the final rung. The interview format determines the required rung.

## Information parity as an operating goal

The motivating principle is not that Leo is guaranteed to outperform every candidate once preparation is equal. That cannot be known in advance.

The actionable claim is stronger than ordinary confidence and narrower than omnipotence:

> When the expected knowledge surface is made explicit, Leo has unusually high motivation and learning throughput, and prior evidence shows he can convert a known syllabus into strong interview performance. Therefore remove avoidable information asymmetry as aggressively as possible.

This turns preparation into an engineering problem.

For every pipeline, ask:

- What can they test?
- What prerequisites does each test depend on?
- Which are explicit, implied, or merely rumored?
- Which have already been proven in real work?
- Which are cold versus genuinely absent?
- What is the smallest exercise that verifies each prerequisite at the required depth?
- What new information would cause us to change the study plan?

## Role of agents

Agents should do most of the reconnaissance and curriculum assembly in parallel.

Useful lanes include:

- current job-description extraction;
- current interview-process research with source quality/date tracking;
- prerequisite decomposition by round;
- mapping prerequisites to Leo's existing work evidence;
- generating drills from real backlog incidents;
- identifying missing vocabulary or language idioms;
- producing concise reading lists and implementation exercises;
- simulating interview follow-ups;
- retaining outcomes so later pipelines reuse the work.

Leo's scarce attention should go primarily to learning, active recall, implementation, mock interviews, and deciding where the evidence is ambiguous.

## Consequence for the all-cause success set

The all-cause set remains useful, but its risk ranking should be dynamic.

Do not assume conventional algorithms are the highest risk merely because many candidates fail them. Leo has already passed a Google L3 loop. Keep them warm and measure current performance.

The highest-value lane is instead **prerequisite discovery and targeted closure**: locate whatever this particular pipeline can expose that is not currently callable under interview conditions.

The objective is a level knowledge playing field wherever preparation can create one.