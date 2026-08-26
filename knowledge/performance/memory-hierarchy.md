---
title: Memory hierarchy
kind: concept
trunk: performance
summary: Computation sees a hierarchy of registers, caches, memory, and storage whose latency and bandwidth differ by orders of magnitude.
created: 2026-08-25
updated: 2026-08-25
---
# Memory hierarchy

Modern machines spend a lot of engineering effort pretending memory is simpler than it is. A load instruction names an address; its physical cost depends on where the requested data currently lives and how well the access pattern cooperates with caches, prefetching, translation, and coherence.

## Model

Registers are tiny and immediate. CPU caches trade capacity for speed across several levels. Main memory is much larger and slower. Storage is slower again. Caches move data in lines, so locality decides whether nearby work gets pulled in cheaply or each access waits on another miss.

## Failure modes

Pointer-heavy structures can destroy spatial locality. Working sets larger than a cache level cause churn. False sharing makes independent data contend because it occupies the same cache line. Random access can become bandwidth- or latency-bound even when instruction count is low.

## Connections

[Latency and throughput](latency-throughput-tail.md) expose these costs at higher levels. [Profiling the critical path](profiling-critical-path.md) prevents low-level tuning before the machine cost is known to own the outcome. GPU and inference work will extend this node into device memory, bandwidth, and transfer costs.

## Pressure questions

- Is the workload compute-bound, latency-bound, or bandwidth-bound?
- What is the working set, and which cache level can hold it?
- Does the data layout create useful locality?
- Could false sharing explain contention between otherwise independent workers?