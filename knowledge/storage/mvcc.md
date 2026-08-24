---
title: MVCC
kind: concept
trunk: storage
summary: Multi-version concurrency control lets readers observe a stable snapshot while writers create newer versions.
created: 2026-08-25
updated: 2026-08-25
---
# MVCC

Multi-version concurrency control keeps multiple logical versions of data so readers can continue from a stable snapshot while writers move the database forward.

## Invariant

A reader observes the version set allowed by its snapshot rules. A writer does not simply overwrite the only copy everybody else is reading.

That separation improves concurrency, but it creates version bookkeeping: old versions need visibility metadata and eventually need reclamation once no relevant snapshot can see them.

## Failure modes

Snapshot semantics are weaker than serial execution unless the database adds stronger checks. Two transactions can each make a locally valid decision from the same snapshot and together violate an invariant: write skew is the classic example.

Long-lived readers can also keep old versions alive and turn version cleanup into a storage or performance problem.

## Connections

[Transactions](transactions.md) supply the logical boundary whose read semantics MVCC helps implement. [Concurrency](../computation/concurrency.md) explains why separating readers and writers is valuable. [Replication and consistency](../distributed-systems/replication-consistency.md) adds another question: which replicated state is eligible to appear in the snapshot?

## Pressure questions

- Which versions are visible to a transaction that started before a concurrent commit?
- Why can snapshot isolation permit write skew?
- When is an old version safe to reclaim?
- How would a long-running transaction affect vacuum or compaction work?