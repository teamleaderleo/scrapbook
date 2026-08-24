---
title: Latency, throughput, and tails
kind: concept
trunk: performance
summary: Latency measures completion time, throughput measures completed work per interval, and tail latency exposes the slow experiences averages hide.
created: 2026-08-25
updated: 2026-08-25
---
# Latency, throughput, and tails

Latency asks how long one operation takes. Throughput asks how much work the system completes over time. They interact, but improving one can damage the other: batching often raises throughput while making individual requests wait longer.

## Tail latency

A mean can look healthy while a meaningful fraction of users wait far longer. p95 and p99 describe the slow end of the distribution, and fan-out makes tails more visible: a request that waits for many downstream calls tends to inherit the slowest one it depends on.

## Failure modes

Queueing makes latency nonlinear as utilization approaches capacity. Retries add load exactly when a service is already slow. Background work, garbage collection, lock contention, cache misses, and uneven request sizes can create long tails even when median work is cheap.

## Connections

[Retries and timeouts](../distributed-systems/retries-timeouts.md) should be calibrated against the latency distribution instead of a pleasant median. [Profiling the critical path](profiling-critical-path.md) asks which part of the request owns the elapsed time. [Measurement](../engineering-judgment/measurement.md) keeps benchmark improvements tied to representative workloads.

## Pressure questions

- Which percentile reflects the product promise?
- What happens to latency as utilization approaches saturation?
- Does batching help throughput by making somebody wait?
- How does fan-out change the probability of seeing a slow dependency?