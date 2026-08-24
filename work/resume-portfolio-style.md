# Resume and portfolio writing guide

This guide owns the writing standard for career-facing material in Scrapbook. `resume-candidates.md` owns the current selection. Source repositories and upstream pull requests own the facts.

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

Avoid em dashes and semicolons in bullets. Commas, parentheses, and an extra word or two usually read better.

Avoid adverbs that merely tell the reader the result was correct, reliable, proper, clean, or similar. State what happened instead.

Avoid invented labels for ordinary engineering choices. Phrases such as `local-first`, `source-first`, `trust-tiered`, and similar compounds usually make the reader decode a taxonomy before they understand the work.

Avoid filler terms such as `actual`, `real`, `bounded`, and `narrow` in career-facing prose.

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

A strong upstream repository usually gets one bullet, even when it contains several repairs.

Each clause should do three things:

1. state the consequence or failure
2. include enough mechanism to distinguish the work from generic bug fixing
3. place the PR number beside that clause

Don't front-load a batch of PR numbers and make the reader map them back to the sentence.

The clauses don't need equal length. The strongest repair can take more words.

## Numbers should earn space

Use numbers when they make the accomplishment easier to understand or harder to dismiss.

Strong examples include:

- `101s to 13.69s`
- `200.77s to 16.21s`
- `4.76 GB to 1.1 GB`
- `18.014s to 2.364s`
- `3 hours to 15 minutes`
- `83 enabled mods`

Don't add a second measurement merely because it exists. Pair measurements when the combination is the accomplishment, such as cutting both preparation time and storage.

For Preflight, the resume uses **101s to 13.69s**. Older campaign numbers belong in evidence records, not in the resume bullet.

## Flagship projects can use the development arc

For a flagship optimization project, the beginning-to-end development arc can be more meaningful than a smaller local comparison inside the project.

Use the strongest retained endpoint the current implementation has demonstrated when that endpoint is the accomplishment. Don't downgrade a development result to a median or replace it with a cleaner but less meaningful sub-experiment just because the latter looks more formal.

The same applies to subsystem history. For Preflight texture preparation, the career-facing arc is **200.77s / 4.76 GB to 16.21s / about 1.1 GB**. The 33.53s alphabetical-pack launch versus 14.174s learned-order launch is useful evidence about disk order, but it should not replace the larger preparation story.

A development arc still needs traceable endpoints. Current code and retained artifacts come first, development/evidence records reconstruct the path, and README prose is a later projection of those facts.

## Independent projects need a different test

For owned work, repository existence has no career value by itself. A project earns space when the bullet can quickly answer at least one of these:

- What difficult thing does it now do?
- What result did it achieve?
- What unusual engineering problem did it solve?
- What breadth does it add that the rest of the page lacks?

Preflight gets more space because the performance result, investigation method, preparation/storage work, generated-code result, and desktop product each add different evidence.

Other projects should usually compress to one bullet. If a project needs a paragraph of terminology before the accomplishment makes sense, it probably belongs on the site or in an interview rather than on the default resume.

## Portfolio prose can breathe more

Portfolio material can explain the mechanism and the investigation path in more depth, but it should keep the same ordering:

1. consequence
2. mechanism
3. evidence
4. caveat or status when it changes the claim

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

As of 2026-08-24, the Vercel AI SDK, Cloud Hypervisor, Vite, and Cloudflare bullets in `resume-candidates.md` are the checkpoint to preserve. Future editing should begin from those sentences rather than from older resume copies or from PR descriptions.

Older resume files remain useful for facts, emphasis, and evidence of what has worked before. They don't override newer engineering results or this writing guide.