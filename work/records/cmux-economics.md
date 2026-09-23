# CMUX economics model

This record keeps the economic interpretation separate from the underlying engineering claims.

The impact ledger owns measurements. This page combines those measurements with explicit pricing and labor-value assumptions so portfolio or interview language can state exactly what is measured, what is derived, and what is hypothetical.

## Hard workload baseline

The strongest compute baseline is the complete accounting in [CMUX issue 13652](https://redirect.github.com/manaflow-ai/cmux/issues/13652):

- **18,704 macOS runner-minutes/day** of actual occupied runner time;
- queued jobs cancelled before allocation excluded;
- 1,366 runner-minutes/day of 12-vCPU Release work;
- 691.6 runner-minutes/day of 12-vCPU Nightly app work;
- 92.9 runner-minutes/day of the 12-vCPU compilation-cache warmer;
- the remaining workload can conservatively be priced at the 6-vCPU rate.

WarpBuild's pricing page, checked 2026-09-23, lists:

- 6-vCPU macOS: **$0.08/minute**;
- 12-vCPU macOS: **$0.16/minute**.

Source: https://www.warpbuild.com/pricing

Using 12-vCPU pricing only where the CMUX accounting explicitly identifies a 12-vCPU lane:

| Input | Value |
| --- | ---: |
| 12-vCPU macOS | 2,150.5 min/day |
| remaining macOS at 6-vCPU price | 16,553.5 min/day |
| replacement cost | **$1,668.36/day** |
| 30-day run rate | **$50,050.80/month** |
| annualized run rate | **$608,951.40/year** |

This is the cleanest meaning of the "$50k/month" number: **replacement-cost exposure of the measured macOS workload at Warp list prices**.

It is not the same claim as "Leo saved $50k/month." Some minutes had already moved to sponsored Blacksmith capacity, and several changes overlap or reduce the same future workload. Historical actual Warp invoices can be added when a durable billing or 90-day usage receipt is available.

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

The compute baseline alone annualizes to about **$609k/year**. Human feedback time is a separate scenario.

For three engineers, 250 workdays/year:

| Economic value of engineering time | Feedback time recovered per engineer/day | Team value/year | Compute baseline + team time |
| ---: | ---: | ---: | ---: |
| $100/hour | 2 hours | $150,000 | $758,951 |
| $150/hour | 2 hours | $225,000 | $833,951 |
| $150/hour | 3.5 hours | $393,750 | **$1,002,701** |
| $150/hour | 4 hours | $450,000 | **$1,058,951** |
| $200/hour | 3 hours | $450,000 | **$1,058,951** |
| $200/hour | 4 hours | $600,000 | **$1,208,951** |

Another way to state the threshold: after the ~$609k compute baseline, reaching $1M/year of total economic value requires approximately:

- **5.21 hours/day per engineer** at $100/hour;
- **3.48 hours/day per engineer** at $150/hour;
- **2.61 hours/day per engineer** at $200/hour;

for a three-engineer team over 250 workdays.

Those are sensitivity thresholds, not measured time savings. The individual CMUX records contain real latency reductions—some measured in minutes per event and some in queue-tail hours—but an aggregate human-time claim needs event-frequency and waiting-behavior evidence before promotion.

## Additional-engineer counterfactual

A separate hypothetical is staffing capacity: if the unrepaired build/CI system would require one additional engineer to absorb the debugging, CI maintenance, waiting, or throughput loss, a 2,000-hour work year is worth:

| Hourly economic value | One engineer-year | Compute baseline + one engineer-year |
| ---: | ---: | ---: |
| $100/hour | $200,000 | $808,951 |
| $150/hour | $300,000 | $908,951 |
| $200/hour | $400,000 | **$1,008,951** |

This is deliberately labelled a **counterfactual**, not an attributed saving. Scrapbook should only promote "avoided a hire" if there is direct organizational evidence for that claim.

## Historical invoice question

The September 22 workload already supports a ~$50k/month replacement-cost run rate. Earlier June–August CI was more Warp-heavy and less optimized; for example, the June long-pole test job explicitly ran on warp-macos-15-arm64-6x.

That makes sustained $50k-plus historical Warp months plausible, but plausibility is not a billing claim. The missing evidence is a durable 30/60/90-day runner-minute export or invoice. If that becomes available, record the actual paid total separately from this replacement-cost model and use it to calibrate how much of the workload was truly billed versus sponsored or self-hosted.
