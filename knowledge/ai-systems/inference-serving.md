---
title: Inference serving
kind: concept
trunk: ai-systems
summary: Model serving trades latency, throughput, memory, batching, and hardware utilization while preserving the requested model behavior.
created: 2026-08-25
updated: 2026-08-25
---
# Inference serving

Serving a large model turns matrix-heavy computation into a scheduling and memory problem. Requests arrive with different prompt lengths and generation lengths; the system has to place work on limited accelerators while controlling queueing and tail latency.

## Model

Prefill processes the prompt and is often compute-heavy. Decode produces tokens incrementally and repeatedly reads model state plus the growing key/value cache. Batching improves hardware utilization but couples requests with different lifetimes. The KV cache consumes device memory per active sequence, so concurrency competes directly with context length.

## Failure modes

Large batches can raise time-to-first-token. Long contexts can exhaust memory and evict useful capacity. Uneven generation lengths create stragglers. Cross-device parallelism adds communication whose cost can dominate if partitioning is poorly matched to the model and hardware.

## Connections

[Latency and tails](../performance/latency-throughput-tail.md) describe the user-visible tradeoff. [Memory hierarchy](../performance/memory-hierarchy.md) extends naturally into GPU memory bandwidth and transfer. [Measurement](../engineering-judgment/measurement.md) distinguishes tokens/second, time-to-first-token, inter-token latency, and fleet utilization instead of collapsing them into one benchmark. [Agent loops](agent-loops.md) add application-level latency and tool waiting around the model.

## Pressure questions

- What limits concurrency first: compute, memory capacity, or memory bandwidth?
- Why can batching improve throughput while hurting an individual request?
- How does context length affect KV-cache pressure?
- Which metric would you optimize for an interactive coding agent versus an offline batch job?