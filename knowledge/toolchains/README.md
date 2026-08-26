---
title: Languages, runtimes, and toolchains
kind: trunk
trunk: toolchains
summary: The machinery that turns source and configuration into running programs, repeatable builds, and owned lifetimes.
created: 2026-08-25
updated: 2026-08-25
---
# Languages, runtimes, and toolchains

This trunk covers what surrounds application logic: builds, compilers, modules, caches, runtimes, loaders, package resolution, resource lifetime, and execution environments.

Start with [Build systems](build-systems.md) and [Runtime lifetimes](runtime-lifetimes.md).

It connects strongly to [concurrency](../computation/concurrency.md), [cancellation](../computation/cancellation.md), [critical-path profiling](../performance/profiling-critical-path.md), and [trust boundaries](../security/trust-boundaries.md).