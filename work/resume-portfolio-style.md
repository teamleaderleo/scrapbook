# Resume and portfolio writing guide

This guide owns the writing standard for career-facing material in Scrapbook. `resume-current.md` owns the current default one-page selection and wording; `resume-candidates.md` is the larger reservoir of alternates and supporting material. Source repositories and upstream pull requests own the facts.

The goal is dense, legible substance. Sell the work hard enough that the consequence is obvious, while keeping enough mechanism that the claim feels earned.

## Start with why anyone should care

Lead with one of these when it exists:

- a failure that used to happen
- a result that changed by a meaningful amount
- a user or operator consequence
- a resource leak, crash, stale state, race, corruption path, or unnecessary rebuild that the work removed
- a product capability that became possible

Then add only enough mechanism to explain how the work achieved it.

A hiring reader should understand the point before they need to recognize an internal function, type, lifecycle hook, cache identity, or project-specific abstraction.

Bad direction:

> Made repeated config resolution idempotent by keeping resolver-generated environment state local to one call.

Better direction:

> Kept server restarts from rebuilding warm dependency caches after optimizer state was duplicated (#23208).

The implementation belongs in the PR if the consequence already carries the bullet.

## Sell substance, not repository process

A resume is not a GitHub status ledger. Words such as `merged`, `approved`, `adopted`, or `co-author` only belong in the sentence when the distinction changes what the claim means.

Put PR references directly beside the clause they support:

> ...left the stream locked (#18371/#18400), and ...replaced the useful size-limit failure (#18572/#18695).

For an open item, `(open)` beside the number is usually enough. Keep review history in the working record, not in the resume sentence.

For third-party repositories, use `https://redirect.github.com/...` links. Direct `github.com` links are fine for repositories under `teamleaderleo`.

## Write normal English

Use contractions. Write `don't`, `can't`, `didn't`, and `wasn't` when they fit.

Don't make the prose sound formal because it is a resume. A clear sentence is more professional than a stiff one.

Use punctuation for readability. Semicolons and em dashes are fine when they make a dense sentence easier to understand; commas and parentheses are often enough, but there is no blanket punctuation ban.

Treat modifiers as guilty until useful. If deleting an adjective or adverb leaves the engineering claim unchanged, delete it. `Runtime bytecode rewrites` stands on its own; `targeted runtime bytecode rewrites` usually does not gain anything from `targeted`. Keep modifiers that change the claim, such as `obfuscated`, `third-party`, `single-threaded`, or `read-only` when those distinctions matter.

Avoid adverbs that merely tell the reader the result was correct, reliable, proper, clean, or similar. State what happened instead.

Avoid invented labels for ordinary engineering choices. Phrases such as `local-first`, `source-first`, `trust-tiered`, and similar compounds usually make the reader decode a taxonomy before they understand the work.

Avoid filler terms such as `actual`, `real`, `bounded`, and `narrow` in career-facing prose.

Avoid vague safety adjectives such as `guarded` when the sentence can say what happens. Prefer `falls back when the code changes`, `checks an exact precondition`, or another concrete behavior.

Don't write implementation review language when a consequence is available. `Preserved caller-owned lastIndex` is useful in a PR. `Identical URL checks returned different answers across calls` is useful on a resume.

## Prefer concrete nouns and verbs

Prefer:

- `left workerd running`
- `reused an old credential`
- `rebuilt a warm cache`
- `panicked during VM boot`
- `reused a VM before shutdown finished`
- `crossed an unmapped hole`
- `left the stream locked`

over labels such as:

- lifecycle correctness
- credential freshness
- cache idempotence
- ownership semantics
- teardown ordering
- state consistency

The label can remain in technical records. The resume should say what happened.

## One repository can carry several receipts

A strong upstream repository can often carry several repairs in one bullet. That is a compression tactic, not a quota.

A clause is strongest when it states the consequence or failure, includes enough mechanism to distinguish the work from generic bug fixing, and keeps the supporting PR number beside the claim it proves. Use fewer or more of those elements when the sentence reads better and remains inspectable.

Don't front-load a batch of PR numbers and make the reader map them back to the sentence.

The clauses don't need equal length. The strongest repair can take more words.

For dense independent-project bullets, prefer one causal sentence when the clauses belong to one accomplishment. A stable workload count should be folded into the mechanism it explains, not broken out as `one run had N calls` in a second sentence. If the count is the workload the optimization absorbs, write the count inside that clause.

## Numbers should earn space

Use numbers when they make the accomplishment easier to understand or harder to dismiss.

Strong examples include:

- `112.17s → 13.69s`
- `200.77s → 16.21s`
- `4.76 GB → 1.1 GB`
- `18.014s → 2.364s`
- `3 hours → 15 minutes`
- `83 enabled mods`

Don't add a second measurement merely because it exists. Pair measurements when the combination is the accomplishment, such as reducing both preparation time and storage.

When one sentence carries multiple before/after measurements, keep each pair adjacent. Prefer `200.77s → 16.21s and 4.76 GB → about 1.1 GB` over `200.77s and 4.76 GB to 16.21s and 1.1 GB`. The reader should never have to map the first list onto the second.

For a headline result that genuinely deserves emphasis, repeating the magnitude in two useful forms can help. Preflight's **112.17s → 13.69s** is also **87.8% less time** and an **8.19× speedup**. Do not apply this decoration mechanically to ordinary numbers.

Don't make the reader care about the measurement protocol. Words such as `controlled`, `cohort`, `directional`, `gate`, and similar experiment bookkeeping usually belong in evidence records. On the resume, say `a sample launch`, `a launch`, or just state the result unless the protocol changes what the claim means.

A small range can be more distracting than informative. If `7.1–7.4s` is only expressing run variation and the resume point is the size of the win, use a readable representative such as `~7.4s` when the retained evidence supports it. Keep meaningful ranges such as `3–10× across multiple loaders` when the range itself communicates breadth.

Choose the verb for the accomplishment instead of defaulting to `cut`. `Reduced`, `removed`, `eliminated`, `shrunk`, `brought`, and `moved` each say something different. Repeating one punchy verb until it becomes a tic weakens the page.

## Keep one current opening per project

`resume-current.md` carries the current default opening for every project selected onto the one-page resume. `resume-candidates.md` may preserve alternate formulations and role-specific versions; that reservoir does not make each alternative current.

A heading and first bullet should cooperate, but the heading does not replace a thesis that carries the engineering scope. If the thesis says the project worked across third-party code, traced failures across the stack, and became a finished application, preserve that information unless a replacement clearly improves it.

A flagship thesis should finish the thought. Investigation counters can establish scale, but they should not be the final clause if the accomplishment is the system built from that investigation. Prefer `found the shared boundary, moved the work, built the reusable cache/rewrite layer` over ending at `observed N calls`.

Proposals and alternates belong in `resume-candidates.md` while they are being considered. Chat-only alternatives are discussion, not the current default.

## Let a strong heading carry context without stealing the lead

A project heading can carry category, domain, platform scope, or public status so the first bullet does not waste its opening words restating them. Domain context does not have to lead when the broader engineering problem is stronger.

For Preflight, the working heading is:

> **Preflight — Cross-platform performance launcher and mod analysis toolkit** *(public open source, Starsector ecosystem)*

The heading identifies the product and keeps the game as context. The first bullet owns the thesis: reverse-engineering a third-party JVM ecosystem spanning independently maintained code, measuring repeated work at scale, the **112.17s → 13.69s** result, and the product built from that investigation.

Parentheses are useful for compact context such as public status, platforms, domain, or an open PR. They should not become a second sentence of qualifications.

## Flagship projects need the whole problem

A flagship project can look smaller than it is when the bullet names only the local mechanism. Give enough context to show what the system had to survive and what became usable at the end.

For work against a third-party runtime, distinguish the external system being investigated or repaired, the machinery the project itself built, and the user-facing product when those distinctions help the reader understand the scope. Do not force all of them into every sentence.

For Preflight, the 83-mod setup is part of the engineering scope. The startup result came from reverse-engineering obfuscated JVM bytecode across the game and independently maintained mods, then tracing repeated work with JFR and live instrumentation. Large counters such as **1.6M resource probes** and **36,090 JSON loads** can be useful because they communicate the scale of the runtime being investigated.

Do not inflate one counter into another. The million-scale retained number is resource probes; the retained JSON count is tens of thousands. Use both when useful rather than inventing `millions of JSON loads`.

The cache architecture also matters. Several domain-specific JSON/CSV caches converged on shared tagged-tree/full-data infrastructure, with a general merged-read cache catching misses and later post-startup JSON reads reusing the same prepared artifact. That architectural consolidation is stronger career evidence than listing every cache class separately.

Don't flatten a project like that into `optimized a game` or `built a cache`. Those descriptions erase most of the engineering.

Startup and gameplay are different accomplishments. Do not force campaign-runtime work into a startup bullet or attach an FPS claim when the retained evidence only proves operation counts, allocation removal, lookup behavior, or sampled attribution. A high-frequency gameplay receipt can be strong on its own: millions of calls, hundreds of millions of repeated accesses, mutation-tracked indexing, or allocation removal can demonstrate runtime engineering without inventing a frame-rate delta.

Productization also earns evidence. Cross-platform packaging, a native host, bundled runtimes, recovery, measurement, updates, diagnostics, and ecosystem tools can belong in the candidate pool when they prove the work became a cohesive application instead of stopping at a benchmark or prototype.

Public status still has to be precise. A public repository supports `public open-source project`. It doesn't turn a release candidate into a shipped binary release. Keep source availability, release status, and package status separate.

## Flagship projects can use the development arc

For a flagship optimization project, the beginning-to-end development arc can be more meaningful than a smaller local comparison inside the project.

Use the strongest retained endpoint the current implementation has demonstrated when that endpoint is the accomplishment. Don't downgrade a development result to a median or replace it with a cleaner but less meaningful sub-experiment just because the latter looks more formal.

The same applies to subsystem history. For Preflight texture preparation, the career-facing arc is **200.77s → 16.21s** and **4.76 GB → about 1.1 GB**. The 33.53s alphabetical-pack launch versus 14.174s learned-order launch is useful evidence about disk order, but it should not replace the larger preparation story.

A development arc still needs traceable endpoints. Current code and retained artifacts come first, development/evidence records reconstruct the path, and README prose is a later projection of those facts.

## Preserve the win inventory before compressing it

Flagship projects often accumulate more strong receipts than the final resume can hold. Record the large wins before choosing the final cut. The number of bullets is an output of the page and the role, not a target to hit in advance.

The inventory is allowed to mix whole-launch milestones, component reductions, memory and storage wins, gameplay-runtime operation counts, and product capabilities. It exists so later editors can choose the best evidence instead of rediscovering the project from polished summaries.

Do not confuse analysis with the accomplishment. If a linter found expensive or broken assets across an ecosystem, lead with what it found. Calibration statistics such as clean-directory counts can support credibility in the working record without becoming the headline.

Likewise, when analysis led directly to a runtime repair, record the repair as engineering. Preflight's NPOT texture work is not merely `the linter found padding`: the runtime path removed **1.22 GiB of VRAM padding** in a validated full load.

## Independent projects need a different test

For owned work, repository existence has no career value by itself. A project earns space when the bullet can quickly answer at least one of these:

- What difficult thing does it now do?
- What result did it achieve?
- What unusual engineering problem did it solve?
- What breadth does it add that the rest of the page lacks?

Preflight gets more space because the performance result, investigation method, preparation/storage work, generated-code result, gameplay-runtime work, desktop product, and mod-ecosystem tooling each add different evidence.

Compress other projects aggressively. One bullet is often enough, but use the space the project actually earns rather than enforcing a fixed count. If a project needs a paragraph of terminology before the accomplishment makes sense, it probably belongs on the site or in an interview rather than on the default resume.

## Portfolio prose can breathe more

Portfolio material can explain the mechanism and the investigation path in more depth. A useful default is consequence → mechanism → evidence, with caveat or status only when it changes the claim. Change the order when another sequence makes the story clearer.

The portfolio can explain why a repair was difficult. It shouldn't become a second issue tracker or copy every review turn.

## Revision rule

Protect sentences that already work.

Don't rewrite a bullet because a new iterator has a different preferred vocabulary. Change it only when the new version clearly improves at least one of these without damaging the others:

- consequence
- density
- readability
- technical substance
- credibility

When comparing two versions, ask:

- Does the first clause tell me why I care?
- Did we replace a useful consequence with a function or abstraction name?
- Did we bury the strongest fact behind setup?
- Did we add jargon that requires project context?
- Did we make the work sound smaller than it was?
- Did we add status or attribution detail that belongs beside the PR instead?
- Can a reader understand the sentence on the first pass?

If the current version already wins those checks, leave it alone.

## Current quality bar

The current default wording lives in `resume-current.md`; begin there when editing the one-page resume. `resume-candidates.md` preserves alternates and richer variants, and older drafts/reviews remain useful for evidence about what readers noticed without becoming current wording authority.

Source and status changes can still make a current sentence stale. Preserve a strong sentence against gratuitous vocabulary churn, not against newer facts or a better target-specific choice.
