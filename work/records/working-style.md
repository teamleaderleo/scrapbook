# Working style and retrieval model

Updated: 2026-08-20

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

## Capture first, retrieve on demand

This working style predates the current agent-heavy period.

For years, Leo treated many notes as effectively append-only and close to write-only: capture the thought while it is alive, use or synthesize it when useful, and rarely spend time maintaining a perfectly organized archive. Strong baseline recall made that workable. Important ideas usually stayed available long enough to be applied; low-value material could fade without demanding another review pass.

The tradeoff was retrieval. Handwritten notes could be dense, abbreviated, or intentionally difficult for anyone else to parse, and sometimes difficult for Leo to parse later. Digital notes accumulated in similar ways. The system favored thinking now over making every fragment pleasant for a hypothetical future reader.

High-quality speech-to-text changed that tradeoff. Dictation makes it cheap to leave far more searchable language behind without interrupting the thought to type, format, classify, or file it. The raw material still arrives messily, but text gives later tools a much better substrate for search, comparison, summarization, and resurfacing.

Agents change the economics again. A large archive no longer requires Leo to remember where everything lives or personally review it on a schedule. When a concrete question arrives, an agent can search the residue, recover the useful parts, compare them with current evidence, and return the small subset that deserves attention.

The resulting ethos is deliberately selective:

- capture generously when capture is cheap;
- organize only when organization earns its cost;
- retrieve when a real decision creates demand;
- distill conclusions that survive repeated use or scrutiny;
- practice the skills that benefit from embodied recall;
- automate or forget the administrative remainder.

Different knowledge deserves different treatment. Some things belong in muscle memory or unaided recall. Some should live as durable searchable evidence. Some only need to exist long enough to complete one task. Treating all three categories as equally worthy of rehearsal wastes attention.

The goal is therefore less "be organized" than **keep important knowledge recoverable while spending as little life as possible tending low-value administration**.

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

## The mess became an operating model

The current repositories increasingly make the old personal habit explicit instead of trying to replace it with exhaustive personal organization.

- [Preflight](https://github.com/teamleaderleo/preflight) tests whether agent-heavy execution can sustain a deep product whose claims are tied to measurement, compatibility gates, fallback behavior, and real runtime evidence.
- [Fieldwork](https://github.com/teamleaderleo/fieldwork) and [Linux Fieldwork](https://github.com/teamleaderleo/linux-fieldwork) test whether the same investigation method transfers across unfamiliar codebases, with negative results and upstream review preserved as evidence instead of treated as wasted motion.
- [Stensibly](https://github.com/teamleaderleo/stensibly) externalizes responsibility and authority so work can survive worker restarts, stale sessions, retries, handoffs, and replacement.
- [Cultist](https://github.com/teamleaderleo/cultist) attacks rediscovery directly: recover bounded repository evidence before a worker edits, keep provenance/counterexamples/unknowns visible, and preserve earned rationale for the next worker. Its current behavioral pressure test asks whether selected evidence actually changes the next justified action or prevents a repeated wrong turn.
- Scrapbook remains the synthesis and retrieval layer across those systems: what happened, what survived scrutiny, what belongs in public narrative, and what deserves to be brought back into active memory later.

The common problem is human attention. Agent output can grow much faster than one person can read line by line, and a large archive can grow much faster than one person can periodically review. The response here is to move more of the burden into recoverability: exact evidence, bounded context, tests, handoffs, provenance, external checks, and selective retrieval at the moment a decision needs them.

That gives a more useful question than "does Leo understand every line?":

> Can a fresh competent worker recover the facts, rationale, uncertainty, and evidence needed for the next consequential decision at an acceptable cost?

The method is still being tested. Preflight provides one deep owned-system case; Fieldwork and Linux Fieldwork broaden the domain sample and expose work to outside maintainers; Cultist's held-out-task evaluation is explicitly aimed at measuring whether repository memory changes worker behavior. The portfolio should keep those evidence levels separate.

The underlying personal habit remains recognizable: **capture the useful residue, trust synthesis, let low-value detail fall away, and build retrieval around the moments where forgetting would become expensive**.

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