# Work record agent instructions

These instructions apply to `work/`.

Read the root `AGENTS.md` first. The normal Scrapbook pull-request and authority rules still apply.

## Purpose

`work/` is a personal engineering record and career-synthesis lane. It is not a second source of truth for other repositories and it is not a vanity changelog.

When substantive work elsewhere produces something potentially useful, independently ask whether it changes Leo's work record or current resume candidate pool.

## Before writing

1. Read the primary evidence in the originating repository. Prefer the exact issue, pull request, benchmark report, README evidence section, review, CI receipt, or current handoff over memory.
2. Check whether an existing `work/` record already owns the story. Update or extend the existing record instead of creating duplicate descriptions.
3. Separate current fact from interpretation. If exact status is uncertain, say so and leave a verification note rather than upgrading the claim.
4. Look for the strongest technical meaning, not merely the most recognizable repository name.

## What to record

Record work when at least one of these is true:

- a patch merged, published, or received meaningful maintainer acceptance;
- a candidate is strongly validated and tells a technically distinctive story even before upstream submission;
- a performance campaign produced a substantial measured result;
- a product moved from internal code to something installable, usable, deployed, or externally observed;
- an investigation found the real owner of a failure after a misleading first theory;
- a negative result prevented an unsafe, incorrect, or low-value change;
- a review interaction materially refined the repair boundary;
- the work adds a new technical axis to the portfolio (compiler, VMM, runtime, browser tooling, distributed coordination, packaging, etc.);
- the result would plausibly be useful in a resume, interview, portfolio, outreach note, or career narrative.

Do not record typo fixes, mechanical churn, routine dependency updates, superficial activity totals, or speculative findings that never reached a useful evidence boundary.

## Preserve reversals

Do not sanitize the record into a sequence of uninterrupted wins.

Some of the strongest evidence is a good reversal:

- a tempting optimization measured too small and was dropped;
- a benchmark theory was disproven by a better instrument;
- a proposed repair belonged on the other side of an API or semantic boundary;
- a test harness bypassed the actual product path and had to be corrected;
- current upstream already fixed or superseded the candidate.

Record what changed the conclusion and why the updated decision was better.

## Resume candidate churn

`resume-candidates.md` is intentionally editorial and may change often.

Rank by marginal signal on a one-page resume, not by effort invested or emotional attachment. A fifth similar correctness fix can be excellent engineering and still add less resume value than a first strong compiler or systems example.

Useful questions:

- Does this prove something not already proven elsewhere on the page?
- Is there external validation or a concrete measurable consequence?
- Can a reader understand the technical point in one or two lines?
- Is the story stronger than the item it would displace?
- Is the claim defensible without a long status explanation?
- Does this fit the target role (general, Vercel/devtools, Valve/performance, systems, product)?

Never delete a durable record merely because it falls out of the current resume ranking.

## Preflight startup headline

The current career-facing Preflight startup headline is **~101s → 13.69s** on the 83-mod M5 MacBook Air development installation.

- **Do not replace 13.69s** with a rounded median, a different campaign median, the old 89.00s → 15.53s A/B pair, or a future package number unless Leo explicitly chooses a new headline.
- A broader current median around 13.8s is optional repeatability context for the same current regime. It is not a substitute headline.
- A startup run measured with the same game-log clock is the same kind of elapsed-time observation regardless of whether it came from an ad-hoc run or a named campaign.
- Campaign shuffling, p-values, acceptance flags, and same-session pairing are useful for **causal A/B questions about an intervention**. They do not give those elapsed times a higher status when reporting current product speed.
- Do not demote 13.69s merely because it is a low run. The resume and career records intentionally use that retained endpoint.

When historical review notes, old claims files, or benchmark prose conflict with this editorial rule, keep the historical material as evidence for the question it answered and preserve **101s → 13.69s** in career-facing copy.

## Evidence links

Follow the root repository's blanket GitHub-link rule here too; durable career records are not an exception.

- For `teamleaderleo` repositories, including forks under that namespace, use normal direct `https://github.com/...` links by default.
- For any third-party GitHub repository, use the equivalent `https://redirect.github.com/...` URL by default for repository, issue, pull-request, commit, and blob evidence links.
- A direct third-party `https://github.com/...` link requires explicit human intent to create the durable direct relationship or backlink. Do not infer that intent from the record being final, canonical, public, or career-facing.
- The redirect changes only navigation behavior; the originating repository and upstream thread remain the technical source of truth.

Where useful, link both the upstream surface and the richer owned evidence packet while preserving the host rule for each target.

## Voice

Write plainly and technically. This is allowed to sound proud when the evidence is strong. Avoid generic praise such as "high-impact" or "complex" unless the following sentence explains the actual impact or complexity.

Prefer:

> Replaced SSH loss as a VM-shutdown proxy with the VMM's exact shutdown event before disk/VM reuse.

over:

> Made a high-impact contribution to a complex virtualization platform.

## Pull requests

Keep substantive updates on ordinary Scrapbook branches and pull requests. It is fine for multiple agents to collaborate on the same open work-record PR when the branch is current and the changes are coherent. If another PR lands first, rebase or resolve the markdown conflicts rather than discarding either record.

The work record is low-risk documentation, but still inspect the complete diff before declaring it ready.
