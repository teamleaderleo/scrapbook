---
title: Replication and consistency
kind: concept
trunk: distributed-systems
summary: Replication creates multiple copies of state; consistency rules define which observations and write orders clients may rely on.
created: 2026-08-25
updated: 2026-08-25
---
# Replication and consistency

Replication keeps state on more than one machine for availability, durability, locality, or throughput. The difficult part is deciding when those copies count as one coherent system.

## Invariant

The system needs an explicit rule connecting writes, acknowledgements, and later reads. A leader-based design can serialize writes through one authority. Quorum designs reason about overlap between read and write sets. Asynchronous followers trade freshness for lower write latency and geographical reach.

## Failure modes

A failover can promote a replica that has not received the latest acknowledged write. A client can write to one location and immediately read stale state from another. Concurrent writes can require conflict detection or resolution. “Eventually consistent” says convergence is expected; it does not by itself specify which intermediate behaviors are acceptable.

## Connections

[Transactions](../storage/transactions.md) ask whether a commit must survive replica loss. [MVCC](../storage/mvcc.md) asks which version set a replica can present to a reader. [Retries and timeouts](retries-timeouts.md) become tricky when a retry lands on a different replica. [Authority](../security/authority.md) appears again in leader election and lease ownership.

## Pressure questions

- What does an acknowledged write promise if the leader dies immediately afterward?
- Can a client read its own writes across replicas?
- Which consistency guarantee does the product actually need?
- How are concurrent writes detected and resolved?