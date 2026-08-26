---
title: Build systems
kind: concept
trunk: toolchains
summary: Build systems turn declared inputs and dependencies into reproducible outputs while trying to avoid repeating unaffected work.
created: 2026-08-25
updated: 2026-08-25
---
# Build systems

A build system maps inputs and dependency relationships to outputs. The interesting engineering begins when builds become large enough that correctness, caching, parallelism, and reproducibility matter as much as invoking a compiler.

## Invariant

An output is reusable only when the system can identify every input that affects it. Hidden environment state breaks cache correctness. Missing dependency edges create races. Over-declaring dependencies keeps correctness but destroys incrementalism.

## Useful ideas

Hermetic actions make inputs explicit. Content-addressed caches connect an output to the exact input identity that produced it. Remote execution moves eligible actions to a worker fleet. Dependency analysis decides which work is invalidated after a change.

## Connections

[Idempotency](../distributed-systems/idempotency.md) appears in remote execution and result publication. [Trust boundaries](../security/trust-boundaries.md) matter when untrusted source executes in shared workers. [Critical-path profiling](../performance/profiling-critical-path.md) helps distinguish the slowest action from the action chain that actually gates the build.

## Pressure questions

- Which undeclared input could make the same action key produce a different result?
- How do remote workers receive credentials without inheriting excessive authority?
- Is the build slow because one action is slow or because the dependency graph serializes the path?
- What can safely be cached across branches or users?