# CMUX economics model

This record keeps the economic interpretation separate from the underlying engineering claims.

The impact ledger owns measurements. This page combines those measurements with explicit pricing and labor-value assumptions so portfolio or interview language can state exactly what is measured, what is derived, and what is hypothetical.

## Hard workload baseline

The strongest compute baseline is now the GitHub Actions **90-day usage export downloaded on 2026-09-23**, summarized in [the checked-in source record](../impact/sources/cmux-actions-90d-2026-09-23.json).

The export contains:

- **1,966,401 self-hosted macOS runner-minutes over 90 days**;
- **21,848.9 macOS runner-minutes/day** on average;
- **655,467 minutes per 30-day equivalent month**;
- **1,345,657 minutes in ci.yml alone**, about 68.4% of all self-hosted macOS usage.

WarpBuild's pricing page, checked 2026-09-23, lists its cheapest macOS class, 6 vCPU, at **$0.08/minute**. Pricing **every** exported self-hosted macOS minute at that cheapest rate gives a floor:

| Input | Value |
| --- | ---: |
| self-hosted macOS usage | **1,966,401 min / 90 days** |
| 90-day value at $0.08/min | **$157,312.08** |
| 30-day equivalent | **$52,437.36/month** |
| annualized at the 90-day average | **$637,987.88/year** |

This is intentionally more conservative than trying to reconstruct the historical 6-vCPU/12-vCPU mix. Any minutes actually billed at Warp's 12-vCPU rate would increase the equivalent value.

The earlier issue-level accounting of **18,704 actual macOS runner-minutes/day** remains useful as an independent point-in-time measurement and for lane composition. It is lower than the 90-day average and is no longer the primary dollar baseline.

This is the cleanest meaning of the "$50k/month" number: **the exported 90-day workload averages more than $52k per 30 days even when every macOS minute is valued at Warp's cheapest macOS rate**.

It is not the same claim as "Leo saved $52k/month." The workload includes capacity later served by sponsored Blacksmith and other self-hosted runners, while multiple engineering changes can affect the same future minute.

## What the engineering campaign changes

The campaign attacks that workload in several economically different ways:

- **move spend:** paid Warp work onto sponsored Blacksmith or free GitHub-hosted capacity;
- **remove demand:** debounce superseded work, throttle publication cadence, skip lanes that cannot change the verdict;
- **reuse work:** compiler caches, shared DerivedData, reusable compiled products, node-local products;
- **shorten work:** artifact transport, checkout/setup, module-boundary changes;
- **improve the human loop:** reduce queue tails and critical paths even when total cheap runner-minutes rise;
- **improve signal:** prevent false failures, hidden failures, repeated doomed work, and opaque capacity regressions.

These categories should not be summed blindly. They can affect the same minute from different directions.

## Engineer-time sensitivity

The 90-day compute baseline annualizes to about **$638k/year** at the cheapest Warp macOS rate. Human feedback time is a separate scenario.

For three engineers, 250 workdays/year:

| Economic value of engineering time | Feedback time recovered per engineer/day | Team value/year | Compute baseline + team time |
| ---: | ---: | ---: | ---: |
| $100/hour | 2 hours | $150,000 | $787,988 |
| $150/hour | 2 hours | $225,000 | $862,988 |
| $150/hour | 3.5 hours | $393,750 | **$1,031,738** |
| $150/hour | 4 hours | $450,000 | **$1,087,988** |
| $200/hour | 3 hours | $450,000 | **$1,087,988** |
| $200/hour | 4 hours | $600,000 | **$1,237,988** |

Another way to state the threshold: after the ~$638k compute baseline, reaching $1M/year of total economic value requires approximately:

- **4.83 hours/day per engineer** at $100/hour;
- **3.22 hours/day per engineer** at $150/hour;
- **2.41 hours/day per engineer** at $200/hour;

for a three-engineer team over 250 workdays.

Those are sensitivity thresholds, not measured time savings. The individual CMUX records contain real latency reductions—some measured in minutes per event and some in queue-tail hours—but an aggregate human-time claim needs event-frequency and waiting-behavior evidence before promotion.

## Additional-engineer counterfactual

A separate hypothetical is staffing capacity: if the unrepaired build/CI system would require one additional engineer to absorb the debugging, CI maintenance, waiting, or throughput loss, a 2,000-hour work year is worth:

| Hourly economic value | One engineer-year | Compute baseline + one engineer-year |
| ---: | ---: | ---: |
| $100/hour | $200,000 | $837,988 |
| $150/hour | $300,000 | $937,988 |
| $200/hour | $400,000 | **$1,037,988** |

This is deliberately labelled a **counterfactual**, not an attributed saving. Scrapbook should only promote "avoided a hire" if there is direct organizational evidence for that claim.

## Historical usage question

The 90-day Actions export removes the main uncertainty about **workload volume**: the self-hosted macOS workload itself sustained a floor-equivalent average of **$52,437 per 30 days** at Warp's cheapest macOS rate.

What remains unknown from this export is provider attribution. "Self-hosted macOS" includes Warp, sponsored Blacksmith, and other self-hosted capacity used during the window. Actual Warp invoices or a provider-labelled 90-day export would be needed to state historical **cash spend** rather than replacement-cost exposure.

For context, the June long-pole test job explicitly ran on warp-macos-15-arm64-6x, while September records document the later migration toward sponsored capacity. That supports the historical story without turning self-hosted minutes into a fabricated invoice.
