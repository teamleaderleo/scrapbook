---
title: Computation and concurrency
kind: trunk
trunk: computation
summary: Execution, interleaving, ownership, scheduling, and what it means for work to stop.
created: 2026-08-25
updated: 2026-08-31
---
# Computation and concurrency

This trunk starts where more than one thing can make progress, where ordering stops being obvious, and where resource lifetime becomes part of correctness.

Start with [Concurrency](concurrency.md) for the model and [Cancellation](cancellation.md) for the moment a running computation has to give ownership back. [Virtual machines as authority over real resources](virtual-machine-authority.md) follows the same ownership question down into CPU, memory, IOMMU, and physical-device assignment: what remains virtual when the guest is using real hardware directly?

This region connects quickly to [retries and timeouts](../distributed-systems/retries-timeouts.md), [idempotency](../distributed-systems/idempotency.md), [runtime lifetimes](../toolchains/runtime-lifetimes.md), and [authority](../security/authority.md).