---
title: Measurement
kind: concept
trunk: engineering-judgment
summary: Measurement turns a technical claim into an observation with a defined metric, workload, comparison, and uncertainty.
created: 2026-08-25
updated: 2026-08-25
---
# Measurement

A number becomes evidence only after the question around it is clear. What changed? Under which workload? Compared with what? How much variation is ordinary? Does the measured component own the product outcome?

## Invariant

The experiment should preserve the conditions needed to compare the candidate explanations. Change one meaningful variable when possible, keep the workload representative, and record enough context that the result can be reproduced or challenged.

## Failure modes

Benchmarks drift away from production. Warm caches accidentally compare against cold baselines. Averages hide bimodal or long-tail behavior. Instrumentation perturbs the system. A component becomes faster while end-to-end performance does not move.

## Connections

[Critical-path profiling](../performance/profiling-critical-path.md) asks whether the measured component owns elapsed time. [Latency and tails](../performance/latency-throughput-tail.md) supply distribution-aware metrics. [Debugging discriminators](debugging-discriminators.md) frame experiments around competing explanations. [Inference serving](../ai-systems/inference-serving.md) is a good example of why one throughput number cannot stand in for interactive latency, memory pressure, and fleet efficiency.

## Pressure questions

- Which claim would this measurement falsify?
- Is the workload representative of the decision being made?
- What variation should count as noise?
- Did the component improve while the end-to-end outcome stayed the same?