# CMUX: feedback latency, reusable work, and CI capacity

The current Scrapbook snapshot contains 437 merged CMUX pull requests authored by Leo between September 13 and September 23, 2026. Volume alone is a weak career claim. The useful pattern is what a smaller set of measured changes says about the system.

Across the strongest records, the work repeatedly treats build state, runner capacity, test products, queues, and failure signals as one performance problem. The recurring move is to find an expensive boundary, determine which identity or ownership rule makes the work reusable, preserve the cases where reuse is unsafe, and then add enough evidence that later drift is visible.

## Reuse work at the boundary that actually owns it

The compilation-cache thread is one long example instead of a collection of cache toggles.

- [PR 13160](https://redirect.github.com/manaflow-ai/cmux/pull/13160) found pull requests writing 1–3 GB entries scoped to their own merge refs. A measured cache inventory held 37.5 GB across 27 entries while the shared Debug seed had already been evicted and macOS builds were cold.
- [PR 13060](https://redirect.github.com/manaflow-ai/cmux/pull/13060) added a main-branch Debug compilation seed after measuring roughly 800 seconds of cold admission work.
- [PR 13754](https://redirect.github.com/manaflow-ai/cmux/pull/13754) later found the seed could never hit for pull requests because the fingerprint included a runner-dependent workspace path and producer and consumer ran on different pools.
- [PR 13797](https://redirect.github.com/manaflow-ai/cmux/pull/13797) found another failure after the seed became reachable: each scheduled seed restored the previous generation by prefix and accumulated old objects until it crossed the 5 GiB save bound and froze. One clean build reduced the seed to about 3.5 GiB, roughly 1.5 GiB less for every pull request to download.

The same idea appears outside CI. [PR 13131](https://redirect.github.com/manaflow-ai/cmux/pull/13131) stopped treating every development tag as a new Xcode build-cache identity. A same-commit tagged build went from 953 seconds with fresh DerivedData to 35.7 seconds with the warm shared tree. [PR 13132](https://redirect.github.com/manaflow-ai/cmux/pull/13132) reduced the invalidation domain itself by moving Computer Use code out of the roughly 3,700-file app module; the measured comment-only edit fell from 38.9 seconds to 13.3 seconds.

Other records attack the same problem one layer later: [PR 13749](https://redirect.github.com/manaflow-ai/cmux/pull/13749) makes the compiled app-host product cheaper to transport, and [PR 13908](https://redirect.github.com/manaflow-ai/cmux/pull/13908) lets a focused E2E rerun consume the product instead of paying another roughly 15.3-minute compile.

## Optimize the answer a person waits for

Several changes deliberately spend more total compute when it buys a much earlier answer.

[PR 13097](https://redirect.github.com/manaflow-ai/cmux/pull/13097) split independent Linux guards so macOS admission no longer waited on one serial job. The accepted follow-up measurement in [PR 13378](https://redirect.github.com/manaflow-ai/cmux/pull/13378) shows the guard critical path falling from 385.5 seconds to 124.3 seconds while Linux runner use rose from 6.43 to 7.49 minutes. Cheap parallel setup costs about one extra runner-minute and returns the gate roughly 4.35 minutes earlier.

[PR 13902](https://redirect.github.com/manaflow-ai/cmux/pull/13902) makes a similar trade in runner selection. Focused E2E queue p90 was 83.3 minutes on macOS 15 and 1.0 minute on macOS 26. macOS 26 executed about four minutes slower in the observed sample, yet total elapsed median still improved once queueing was counted. The PR keeps the execution comparison labelled as observed because the two runner groups did not run identical tests.

This reads as developer-productivity engineering more than generic CI cost cutting. The objective is the feedback loop, with runner-minutes treated as one resource inside it.

## Treat capacity and spend as scheduling problems

A second cluster works on demand before buying more capacity.

[PR 13658](https://redirect.github.com/manaflow-ai/cmux/pull/13658) measured pull-request traffic at roughly 5,900 paid macOS overflow minutes per day in the sampled window and moved that burst lane onto sponsored capacity. [PR 13644](https://redirect.github.com/manaflow-ai/cmux/pull/13644) replays a day of superseded pull requests and estimates about 590 macOS minutes/day avoided by waiting briefly before admitting expensive work. [PR 13645](https://redirect.github.com/manaflow-ai/cmux/pull/13645) fixes a control-plane trigger that produced roughly 6,864 router runs/day when one run per CI invocation, about 1,253/day, was enough.

[PR 13646](https://redirect.github.com/manaflow-ai/cmux/pull/13646) applies the same reasoning to Nightly publication. Seven days of data showed about 1,030 push-triggered macOS minutes/day and 70 of 101 publishes replaced within an hour. The two-hour policy is projected to avoid roughly 450–600 macOS minutes/day while accepting a bounded delivery delay.

[PR 13703](https://redirect.github.com/manaflow-ai/cmux/pull/13703) removes about 16–17 macOS minutes of setup from each normal iOS upload by making the common prebuilt path cheap and keeping history and Zig work as fallbacks.

These figures overlap in places, so the impact ledger keeps them separate. A runner minute shifted to sponsored capacity, a minute never scheduled, and a minute removed from a release job are different economic events.

## Put a dollar scale on the workload

The [CMUX economics model](cmux-economics.md) keeps pricing assumptions separate from the engineering claims.

A complete 24-hour accounting measured **18,704 macOS runner-minutes/day of actual runner occupancy**. Pricing only the explicitly 12-vCPU Nightly and Release work at WarpBuild's 12-vCPU rate and every other minute at the cheaper 6-vCPU rate yields a conservative replacement-cost run rate of approximately **$1,668/day**, **$50,051 per 30-day month**, or **$608,951/year** at Warp list prices checked 2026-09-23.

That is a workload baseline, not an attributed saving. The individual records separately identify which work moved off paid capacity, which demand disappeared, and which feedback loops got shorter. The economics model also keeps engineer-time and additional-staffing scenarios explicitly hypothetical until there is evidence for event frequency or avoided hiring.

## Make failures tell the truth

Some of the strongest work improves the signal instead of the raw runtime.

[PR 13962](https://redirect.github.com/manaflow-ai/cmux/pull/13962) found an incomplete xcresult path that suppressed 148 failures already present in the same full-suite run. The gate remained fail-closed; the repair made the red run say which tests actually failed.

[PR 13935](https://redirect.github.com/manaflow-ai/cmux/pull/13935) found Swift Testing parallelism making 1,060 tests both slower and less truthful. The parallel run exceeded twelve minutes and produced about 161 issues; serial execution finished in 65 seconds with 17 remaining failures. Roughly 144 apparent failures were contention artifacts.

[PR 13810](https://redirect.github.com/manaflow-ai/cmux/pull/13810) turns the manual investigations behind many of these repairs into a scheduled CI health report. Its first real run surfaced a 119.8-minute macOS 15 queue p90, 9,763 runs beyond the first on unchanged heads, and workflows whose run streams were overwhelmingly skipped. The report also found defects in its own first implementation when exercised against the real API, and those corrections stayed in the record.

## The refusals are part of the evidence

Several PRs are useful because they stop at the boundary the measurement supports.

[PR 13600](https://redirect.github.com/manaflow-ai/cmux/pull/13600) successfully built the iPhone and iPad test product once and proved both consumers executed from the same verified artifact. Downloads took roughly 191–195 seconds, so the PR explicitly declines to claim a wall-clock speedup.

[PR 13724](https://redirect.github.com/manaflow-ai/cmux/pull/13724) investigated reclaiming macOS work after CI had already become doomed. A larger class looked attractive: Linux-guard failures left 1,316 macOS runner-minutes behind already-decided verdicts. The class was dropped because every reclaimable minute sat in an in-flight compile that cross-run reuse could now make valuable to somebody else. The shipped rule stays much narrower.

[PR 13902](https://redirect.github.com/manaflow-ai/cmux/pull/13902) similarly labels the runner execution comparison observed rather than causal. [PR 13060](https://redirect.github.com/manaflow-ai/cmux/pull/13060) left the post-seed CI savings unquoted until a real seed could run.

The larger impact claims are easier to trust because the same record contains cases where the attractive number was declined.

## Career-facing interpretation

The strongest CMUX story is build systems and developer productivity with a systems-performance bent.

It includes Swift and Xcode compilation behavior, cache identity and lifecycle, reusable build products, artifact transport, runner scheduling, CI observability, test reliability, and release workflow economics. The repeated skill is less about any one CI provider than about finding the actual ownership and reuse boundary in a large changing system, measuring the cost around it, and preserving safe fallback behavior when the optimization cannot prove a hit.

The quantitative ledger under [work/impact](../impact/README.md) owns the moving numbers. This record owns the cross-PR interpretation.
