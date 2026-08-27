---
title: ML and AI systems
kind: trunk
trunk: ai-systems
summary: Models, inference, agents, tools, context, evaluation, and the systems that turn probabilistic outputs into useful work.
created: 2026-08-25
updated: 2026-08-27
---
# ML and AI systems

This trunk starts at the systems boundary around models: how inference is served, how context is assembled, how agents select and execute actions, and how the whole loop stays observable and answerable to reality.

Start with [Agent loops](agent-loops.md) and [Inference serving](inference-serving.md). Use [Frontier inference economics](frontier-inference-economics.md) when translating large token counters into fresh-prefill load, decode load, API-equivalent spend, and self-host capacity.

The region connects strongly to [authority](../security/authority.md), [trust boundaries](../security/trust-boundaries.md), [retries](../distributed-systems/retries-timeouts.md), [latency](../performance/latency-throughput-tail.md), and [measurement](../engineering-judgment/measurement.md).