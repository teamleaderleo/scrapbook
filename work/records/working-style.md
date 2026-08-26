# Working style and retrieval model

Updated: 2026-08-26

This record describes a working model, not a ritual every task has to perform.

## Capture generously, reconcile when a decision needs it

Leo tends to synthesize quickly and move on. The useful default is therefore **capture first, reconcile on demand**.

Record observations, decisions, measurements, reversals, and useful interpretations while they're alive. Preserve enough provenance that a later reader can tell primary evidence from interpretation. Let later retrieval do the expensive sorting when a real question creates demand.

This habit predates the current agent-heavy period. Handwritten and digital notes could be effectively append-only for years: capture the thought, use it when needed, and spend very little life tending an immaculate archive.

Speech-to-text changed the economics because it became cheap to leave searchable language behind without stopping the thought to format it. Agents changed the economics again: a large archive can be searched, compared, challenged, and compressed when the decision arrives.

The point is recoverability, not personal clerical perfection.

## What deserves memory

Different knowledge has different jobs.

Some things benefit from embodied recall: language syntax, core algorithms, common systems patterns, the ability to reason through code under time pressure. Some facts should live as durable searchable evidence. Some task detail only has to survive until the task is complete.

Treating all three as equally deserving rehearsal wastes attention.

A good system lets low-value detail fade while keeping consequential facts recoverable.

## The current toolchain has separate jobs

The owned repositories increasingly turn that personal habit into software without collapsing everything into one mega-agent.

- [Glaeda](https://github.com/teamleaderleo/smolrunner) owns trust-tiered Linux execution: disposable workers where isolation dominates, persistent trusted state where reuse earns the latency win.
- [Renderprove](https://github.com/teamleaderleo/renderprove) produces rendered/browser evidence: receipts, screenshots, diagnostics, deterministic comparison, bounded interaction, and screenshot advisory packets.
- [Proofwake](https://github.com/teamleaderleo/proofwake) remembers revision evidence and task-specific evaluation receipts without becoming the scheduler or approval authority.
- [Cultist](https://github.com/teamleaderleo/cultist) asks which repository evidence a worker should see now, keeps provenance/counterexamples/unknowns visible, and tests whether the selected evidence changes the next action.
- [Stensibly](https://github.com/teamleaderleo/stensibly) carries shared responsibility, authority, handoffs, continuation, provider reconciliation, and the next durable action across disposable workers and fresh chats.
- [Fieldwork](https://github.com/teamleaderleo/fieldwork) and [Linux Fieldwork](https://github.com/teamleaderleo/linux-fieldwork) are code-first investigation workbenches: source, discriminators, negative controls, exact evidence, review, and deliberate upstream boundaries.
- Scrapbook is the human synthesis/publication layer: what happened, what survived scrutiny, what deserves public space, and what should come back into active memory later.

Preflight is the deep owned product where many of these habits are tested against one demanding runtime over a long period.

The separation is useful. Execution evidence should not silently become approval. Repository context should not become authority. A mail continuation handle should not become permission to merge. A screenshot advisory should not change deterministic browser disposition.

## Agents are retrieval and reconciliation, too

Implementation throughput is only part of the value.

A useful agent can enter the old records, recover the primary evidence, notice that two summaries disagree, compare both with current source, and return a small current answer. It can preserve a reversal instead of flattening history into a victory montage. It can also leave the records easier for the next worker to use.

The loop looks more like:

```text
capture residue
→ retrieve when demanded
→ compare with current source
→ test / execute
→ preserve evidence and decision
→ compress the public story
```

Worker and conversation loss are ordinary events in that model. The important question is whether the next competent worker can recover the facts, rationale, uncertainty, and evidence needed for the next consequential decision at an acceptable cost.

## Source beats stale prose

Engineering moves quicker than the summaries around it. That means a README, issue body, portfolio note, claim registry, or old essay can become the stale object.

Current implementation and retained current evidence lead. Documentation is a projection of that reality.

When a summary disagrees with source, fix the summary. When a machine-readable claim index lags accepted evidence, bring the index forward. When one changing fact has been copied into five career files, pick one owner and make the others link to it.

The recent Preflight performance cleanup is a good example: the career-facing headline is **~101s → 13.69s**. The broader current run history can describe the surrounding regime and repeatability, but it does not replace that headline. A startup measurement taken under the same clock remains the same kind of observation regardless of which campaign or ad-hoc run produced it. Campaign design, permutation tests, and acceptance flags are useful only when asking a causal comparison question such as whether one intervention changed time.

## Writing should preserve the person and the evidence

The technical-writing rules in Fieldwork and Linux Fieldwork and the Workbench voice rules now point in the same direction.

Lead with the concrete question, mechanism, consequence, or decision. Explain the current model before drowning the reader in source paths. Use code, state traces, tables, and diagrams when they communicate the system quicker than prose.

Keep evidence classes exact: source behavior, executed result, interpretation, design choice, and remaining work can live next to each other without pretending to be the same kind of claim.

Then write like a person.

Contractions are welcome. Semicolons are welcome. Uneven lists are welcome. A blunt sentence is welcome. A longer sentence can wander a little when the clauses genuinely belong together. The reader does not need every result announced by “the key insight,” packaged into three reasons, and finished with a recap of the recap.

Protect passages that already work. Fix the vague noun, stale status, canned hinge, duplicated caveat, or padded ending instead of globally repainting everything into a house voice.

Technical accuracy comes from exact nouns, verbs, identities, evidence, and boundaries. Formal-sounding filler adds no authority.

## Identity: learning slope over narrow domain ownership

The strongest evidence is repeated codebase entry: get useful in an unfamiliar runtime/tool/repository, find the real owner of the behavior, build a test that can make the hypothesis lose, and follow the problem until the compatibility/performance/correctness boundary becomes clear.

The current body of work spans Java/JVM performance and bytecode, TypeScript SDK/runtime correctness, Rust virtualization and execution, Linux/container work, browsers/build tooling, agent coordination, evidence systems, and product/application engineering.

The claim is transfer of technical judgment, not prior mastery of every domain.

That makes a modern tooling/agent environment legible: TypeScript and systems code, SDK semantics, caches and state, lifecycle/cancellation/retries, sandboxed execution, authority, evidence, open-source review, and agent-heavy development can all belong to one engineering identity without pretending they're one product.

## Human attention is the scarce resource

Agent output can grow much quicker than one person can read it. Archives can grow much quicker than one person can periodically review them.

So the system tries to spend human attention on the decisions that actually deserve judgment: which problem is worth solving, which contract should hold, which evidence is strong enough, which competing explanation survived, which external effect is authorized, and what deserves publication.

The rest should be recoverable.

This is why negative results matter. A rejected optimization, a maintainer choosing the other compatibility boundary, an experiment that failed to distinguish two hypotheses, or an evidence packet that changed nobody's action can save future attention when it remains easy to find.

## Recall practice still has a place

Retrieval software does not replace human fluency.

The useful code-recall loop is still:

```text
real engineering work
→ durable examples and patterns
→ short active-recall / code-production drills
→ quicker unaided access during interviews, debugging, review, and implementation
```

Use actual encountered material: stream cleanup, invalidation, Rust error propagation, cache identity, async races, process boundaries, data structures, systems fundamentals, algorithms that keep recurring.

The target is callable understanding under time pressure, not memorizing the archive.

## Career consequence

The current problem is mostly compression.

There is enough technical material. The hard part is choosing the few examples that a hiring process can absorb without turning the page into a logo wall or a compressed autobiography.

The active career files therefore have different jobs:

- [`../current-state.md`](../current-state.md) — moving status;
- [`preflight-live-performance.md`](preflight-live-performance.md) — changing Preflight performance frontier;
- [`open-source.md`](open-source.md) — durable external outcomes and review reversals;
- [`../portfolio-inventory.md`](../portfolio-inventory.md) — retrieval index;
- [`../resume-candidates.md`](../resume-candidates.md) — scarce-space selection;
- `/work` — selected public projection.

When a role asks for something already demonstrated, retrieval should recover the evidence. When a project moves, the owner record should change before another polished sentence gets copied outward.
