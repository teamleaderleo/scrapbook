# cmux: build systems, developer feedback, and product reliability

**Current role:** Founding Engineer at cmux, October 12, 2026–present. Leo confirmed the title and start date on October 14. Contributions in September predate the role and aren't employment tenure.

The [October 14 source refresh](../impact/sources/cmux-career-2026-10-14.json) counts 4,479 PRs attributed by GitHub's author field to `teamleaderleo`: 3,735 merged, 177 open, and 567 closed without merging, as of 22:17:11 UTC. Merged PRs include `main`, `feat-cmux-next`, and other destination branches. They aren't a count of released features, sole implementation ownership, reviews, or business impact.

The follow-up base-filtered queries count 1,725 merged into `main` and 1,966 into `feat-cmux-next`. Subtracting those from 3,735 leaves a derived residual of 44 for other bases. The total was captured at 22:17:11 UTC; the base queries followed shortly afterward without exact per-call timestamps, so this isn't a simultaneous branch partition. None of these counts establishes stable-release inclusion.

The older retrieval snapshot remains intact: 437 merged PRs through September 23 at 11:36:53 UTC. A fresh full-day query returns 472 through September 23, including 35 later merges that day. The old snapshot isn't added to the new count.
Across the strongest records, the work repeatedly treats build state, runner capacity, test products, queues, and failure signals as one performance problem. The recurring move is to find an expensive boundary, determine which identity or ownership rule makes the work reusable, preserve the cases where reuse is unsafe, and then add enough evidence that later drift is visible.

## Accumulation over time

| UTC merge window | Merged in window | Cumulative merged | What the selected evidence establishes |
| --- | ---: | ---: | --- |
| Through September 23 | 472 | 472 | Build/cache identity, reusable products, queueing, capacity, and test signal. The original snapshot stopped partway through September 23 at 437. |
| September 24–26 | 443 | 915 | [UI E2E adoption](../impact/records/cmux-14776.md) observed test start at 659s → 250s in one pair on different pools. [Runner placement](../impact/records/cmux-14774.md) measured owned share at 56.2% → 88.9% in unmatched overnight windows. |
| September 27–30 | 520 | 1,435 | Additional merged account activity; this refresh doesn't attach a new measured outcome to every PR in the window. |
| October 1–7 | 744 | 2,179 | Agent-pane layout reuse on the next branch; exact-head merge-override evaluation on main. |
| October 8–11 | 811 | 2,990 | Browser command parity on the next branch; [duplicate Computer Use engine removal](../impact/records/cmux-19386.md) on main. |
| October 12–14, through capture time | 745 | 3,735 | Deep split responsiveness on main; [startup](../impact/records/cmux-19620.md), [older-chat paging](../impact/records/cmux-20536.md), and reading-position recovery on the next branch. |

The time windows are disjoint GitHub merge-date queries, using UTC. They describe contribution coverage; the October 12 UTC window doesn't establish which merges happened after the local employment start. The role starts on October 12 as supplied by Leo.
These results accumulate as a broader engineering record, not a single savings total. UI product adoption, cache reuse, and runner placement can touch the same execution. A per-job queue reduction doesn't establish recovered engineer-hours; a replacement-cost model doesn't establish avoided invoices.

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

A GitHub Actions 90-day usage export downloaded on 2026-09-23 records **1,966,401 self-hosted macOS runner-minutes**, averaging **21,848.9 minutes/day**. Pricing every minute at only WarpBuild's cheapest documented macOS rate, $0.08/min, yields a replacement-cost floor of **$157,312 over 90 days**, **$52,437 per 30-day equivalent month**, or **$637,988/year** at the 90-day average. No 12-vCPU premium is included.

The earlier one-day accounting of 18,704 macOS runner-minutes/day remains a useful corroborating snapshot, but the 90-day export is now the stronger economic baseline. This is workload replacement value, not an attributed saving or an assertion that every self-hosted minute was billed to Warp. The individual records separately identify which work moved off paid capacity, which demand disappeared, and which feedback loops got shorter. The economics model keeps engineer-time and additional-staffing scenarios explicitly hypothetical until there is evidence for event frequency or avoided hiring.

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

## Extend the work into the product

The later record reaches beyond CI. [PR 16425](https://redirect.github.com/manaflow-ai/cmux/pull/16425), merged into `feat-cmux-next` on October 1, memoizes transcript geometry so scrolling doesn't relayout every row. Its roughly 4 ms per frame figure describes the earlier 5,000-row baseline; the PR body leaves a native re-benchmark pending.

October 11 merges on the same branch restore browser [wait and screenshot commands](https://redirect.github.com/manaflow-ai/cmux/pull/16428) and [cookie and storage operations](https://redirect.github.com/manaflow-ai/cmux/pull/16441). Cookie clearing requires a site scope and refuses an unscoped clear that could sign the user out of every site. [PR 19993](https://redirect.github.com/manaflow-ai/cmux/pull/19993) later adds inline Cloud file-request choices to the moved chat, binding a response to the displayed request and a user gesture. This is the app-side permission flow, not sole ownership of the Cloud stack.

[PR 19620](../impact/records/cmux-19620.md) removes unnecessary startup WebKit work and prefetches the first daemon snapshot. Its DEV Debug live-sidebar median moves from 557 to 478 ms against the immediate regression, compared with 487 ms before that regression. Most of the improvement is recovery; no release-build launch distribution is established.

[PR 20536](../impact/records/cmux-20536.md) makes older agent-chat history reachable and changes page folding from a full-history rebuild, 105 ms at 45,000 loaded events, to 1–6 ms per older page in its Chromium development harness. First paint stays unchanged. The separate daemon repair [PR 20535](https://redirect.github.com/manaflow-ai/cmux/pull/20535) owns the log-read optimization; its backend timing isn't an end-to-end open-time claim.

The follow-on [PR 20699](https://redirect.github.com/manaflow-ai/cmux/pull/20699) preserves a useful reversal. Paging initially broke reopening at a saved position outside the newest page. The repair pages back before revealing the transcript and avoids overwriting the saved position during restore. Its Chromium test passes on the merged next-branch head; a native quit and relaunch remains unverified in the retained evidence.

## Reliability and packaging keep their own boundaries

[PR 19606](https://redirect.github.com/manaflow-ai/cmux/pull/19606), merged into main, repairs deep split chains that freeze the main thread. The focus walk diagnosis came from @Apptah; Leo's PR carries the Bonsplit fix into cmux and records the failed AppDelegate experiment. A native 16-deep-chain check goes from 2/5 to 5/5, with operations answering within 0.08 seconds on the tested fix build. The final head removes the ineffective AppDelegate change and wasn't separately re-run through that native test. This is a responsiveness repair, not an app-wide performance benchmark.

[PR 17217](https://redirect.github.com/manaflow-ai/cmux/pull/17217), merged into main, evaluates merge overrides from trusted base code using GitHub metadata. Overrides name failing checks, carry evidence, and expire when the head changes. Its merged state doesn't by itself establish a repository-wide rollout or every later merge's compliance.

[PR 19386](../impact/records/cmux-19386.md), also merged into main, removes the duplicate Computer Use executable, reported as 11.5 MiB in the before-removal arm64 inventory. A native after-build or installed-size reduction remains unverified. The helper keeps its signing and permission identity. The [thin stable-release pipeline](https://redirect.github.com/manaflow-ai/cmux/pull/19255) is another main-branch merge; its universal-versus-nightly size comparison isn't a measured stable-release before/after result, and the retained PR body leaves the signed dry run and update acceptance for later verification.

Next-branch merges in this record establish integrated development work. A stable shipment or native acceptance result needs its own release or runtime evidence.

## Career-facing interpretation

The record now spans build systems and developer productivity alongside native desktop reliability, browser automation, and agent-chat product work.

It includes Swift and Xcode compilation behavior, cache identity and lifecycle, reusable build products, artifact transport, runner scheduling, CI observability, test reliability, and release workflow economics. The repeated skill is less about any one CI provider than about finding the actual ownership and reuse boundary in a large changing system, measuring the cost around it, and preserving safe fallback behavior when the optimization cannot prove a hit.

The quantitative ledger under [work/impact](../impact/README.md) owns the moving numbers. This record owns the cross-PR interpretation.
