# Working style and retrieval model

Updated: 2026-08-11

This record captures how Leo currently works and why `work/` exists. It is descriptive, not a claim that every future task should use the same process.

## Current working model

Leo tends to synthesize in real time and move on.

A useful default is therefore **append first, reconcile later**:

- record concrete observations, decisions, measurements, reversals, and useful interpretations while they are fresh;
- do not require every session to reorganize the complete corpus before new work can continue;
- preserve provenance so later readers can distinguish primary evidence from interpretation;
- let later agents retrieve, compare, deduplicate, challenge, and compress the accumulated record when a concrete question requires it.

The human loop is intentionally asymmetric. Leo supplies direction, judgment, curiosity, and rapid synthesis; agents are expected to help retain the long tail, bring old evidence back into working memory, and prevent useful conclusions from being lost merely because attention moved elsewhere.

`work/` is one retrieval surface for that arrangement. It should make it possible to ask later:

- what have I actually done?
- which results survived scrutiny?
- which theories were killed and why?
- what is strongest for this resume or company?
- what technical axes have I already demonstrated?
- what gaps are real versus artifacts of forgetting the existing evidence?

without reconstructing the answer from chat history.

## Identity: slope over domain ownership

The current technical identity is not "expert in one domain" and should not be marketed as all-encompassing understanding.

A better description is:

> Domain-agnostic software engineer with a steep learning slope and unusually high codebase-entry velocity; strongest evidence is repeatedly getting useful in unfamiliar runtimes, tooling, infrastructure, and product systems, then following the problem until the actual ownership/performance/correctness boundary is clear.

The portfolio currently spans Java runtime instrumentation and game performance, TypeScript SDK/runtime correctness, Rust virtualization and compiler work, Linux/container lifecycle investigations, browser/build tooling, agent coordination, and product/application systems.

The important claim is not prior mastery of every one of those domains. It is that useful technical judgment has transferred across them.

This is why a modern tooling company can be a strong fit even when the nominal product area changes. The relevant overlap is often the engineering shape:

- TypeScript/JavaScript and modern runtime/tooling ecosystems;
- SDK and API semantics;
- caches, state, lifecycle, cancellation, retries, authority, and failure recovery;
- instrumentation and performance work;
- open-source collaboration;
- AI-assisted development where human attention is spent on problem selection, verification, repair boundaries, and integration quality.

## Modern-tooling fit

There is a real market category now that was much less legible a few years ago: engineering environments where AI agents, modern TypeScript tooling, SDKs, sandboxed execution, durable workflows, MCP-style tool interfaces, and fast open-source iteration are normal parts of the product surface.

That environment maps unusually well to Leo's current working style.

This should not turn into a claim that any particular company or role is automatically a fit. The useful observation is that the *slope* and workflow are now more market-legible than they would have been in an older software market that treated one narrow framework or multi-year domain tenure as the main proxy for ability.

## Agents as retrieval and reconciliation layer

Agents are not just implementation throughput in this workflow.

They also serve as an externalized retrieval layer:

1. read primary evidence and old records;
2. bring relevant prior conclusions back when a new decision touches them;
3. notice contradictions or stale claims;
4. preserve reversals rather than flattening history into success-only marketing;
5. independently rank the existing corpus for the immediate question;
6. leave the durable record better than they found it when new evidence materially changes the picture.

This is the motivation for keeping factual work records separate from churny resume/application rankings.

## Recall practice / "Monkeytype but code"

The same model motivates a code-recall practice surface in Scrapbook.

The problem is not merely typing speed. Heavy AI-assisted engineering can produce a wide and deep body of encountered code faster than unaided recall naturally consolidates it. Useful practice should therefore turn real encountered patterns back into fast human retrieval and implementation ability.

The desired loop is roughly:

> real engineering work -> durable examples/patterns -> short active-recall/code-production drills -> faster unaided access during interviews, debugging, review, and ordinary implementation

The source material should preferentially come from actual work rather than arbitrary syntax trivia: stream cleanup, state invalidation, Rust error propagation, cache keys, async races, data-structure choices, shell/process boundaries, common algorithms, C++/systems fundamentals when needed, and compact implementation patterns encountered repeatedly.

This complements rather than replaces open-ended engineering. The purpose is to make accumulated understanding callable under time pressure.

## Career consequence

The main career risk is currently less "insufficient technical material" than **compression and retrieval under hiring constraints**.

That means future preparation should increasingly ask:

- can Leo explain this in two minutes?
- can Leo reproduce the core implementation without an LLM when required?
- can Leo solve the bounded algorithm/system-design version under interview time?
- can the resume surface the right four specimens without hiding the larger body of evidence?
- can an agent retrieve the relevant old evidence when a role asks for something Leo has already done but no longer has in active memory?

This record should evolve as the working model changes. Preserve older snapshots when the change itself becomes informative.