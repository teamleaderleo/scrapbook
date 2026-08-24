---
title: Concurrency
kind: concept
trunk: computation
summary: Multiple computations can make progress during overlapping intervals, so correctness has to survive interleaving.
created: 2026-08-25
updated: 2026-08-25
---
# Concurrency

Concurrency begins when the order of operations can vary while the program still needs a stable meaning. Threads are one source of concurrency, but so are async tasks, processes, callbacks, distributed workers, signals, and re-entrant code.

## Invariant

A concurrent design needs to say which state transitions may overlap and which relationships must remain ordered. A lock is one way to enforce an ordering constraint; immutability, message passing, ownership transfer, atomics, and transactional updates are others.

The useful question is rarely “is this multithreaded?” It is “what can observe or modify this state before the current operation is finished?”

## Failure modes

Races happen when correctness depends on an ordering the program did not actually establish. Deadlocks happen when progress depends on a cycle of waiting. Starvation and priority inversion preserve logical correctness while ruining progress. Cancellation can expose a subtler class of bug: a task disappears while still owning state somebody else assumed would be released cleanly.

## Connections

[Cancellation](cancellation.md) is concurrency with an explicit interruption edge. [MVCC](../storage/mvcc.md) is a database technique for letting readers and writers overlap while preserving snapshot semantics. [Idempotency](../distributed-systems/idempotency.md) helps when concurrent or retried work may reach the same effect more than once. [Runtime lifetimes](../toolchains/runtime-lifetimes.md) ask which object or task actually owns cleanup.

## Pressure questions

- Which ordering does this design require, and where is it established?
- What can observe half-completed state?
- Who owns cleanup if execution stops between two writes?
- Could the same logical operation run twice at once?