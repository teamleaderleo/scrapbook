---
title: Profiling the critical path
kind: concept
trunk: performance
summary: A local speedup matters only when the optimized work owns elapsed time on the path that gates the result.
created: 2026-08-25
updated: 2026-08-25
---
# Profiling the critical path

A profiler can tell you where computation happens. Performance engineering has to answer a harder question: which work actually delays the outcome the user cares about?

## Invariant

A speedup changes end-to-end latency only to the extent that the optimized work lies on the relevant critical path. Work can be expensive yet fully hidden behind another wait, or run in parallel with the real gate.

## Concrete trace

Suppose a cache eliminates twenty seconds of decoding, but decoding previously happened behind a twenty-five-second prefetch barrier. The component benchmark is excellent and the launch time barely moves. The optimization becomes valuable only after the intervention reaches the stage that actually gates startup.

## Failure modes

Microbenchmarks reward work that is easy to isolate. Aggregate CPU profiles can overemphasize parallel background work. Instrumentation can measure the wrong phase boundary. Benchmark inputs can stop representing production.

## Connections

[Measurement](../engineering-judgment/measurement.md) supplies the discipline for proving the effect. [Latency and tails](latency-throughput-tail.md) clarify the metric. [Memory hierarchy](memory-hierarchy.md) explains many local costs, but local cost is useful only after ownership of the critical path is established. [Debugging discriminators](../engineering-judgment/debugging-discriminators.md) use the same habit: ask what observation can distinguish competing owners.

## Pressure questions

- What exact user-visible outcome is this benchmark standing in for?
- Which event gates that outcome?
- Could the optimized work already be hidden behind another wait?
- What experiment would falsify the current ownership model?