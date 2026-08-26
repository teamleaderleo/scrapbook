---
title: Transactions
kind: concept
trunk: storage
summary: A transaction defines which group of state changes should be reasoned about as one logical operation.
created: 2026-08-25
updated: 2026-08-25
---
# Transactions

A transaction gives a logical operation a boundary. Inside that boundary, the program can make several reads and writes while the storage system enforces a chosen set of guarantees about atomicity, visibility, and concurrent interference.

## Invariant

The transaction contract has to say what partial state can become visible and which concurrent histories are legal. “ACID” names useful goals, but the actual isolation level and durability mechanism decide what callers may assume.

## Concrete trace

Imagine moving money between two balances. The business operation is one transfer even though storage needs at least two writes. Atomicity protects against exposing only the debit or only the credit. Isolation decides what concurrent readers and writers can observe while the transfer is in flight. Durability decides what an acknowledged commit means after a crash.

## Failure modes

A transaction boundary can be too small for the real invariant. External effects such as email, queues, or remote APIs may sit outside the database commit. Retrying after an ambiguous commit can duplicate those effects unless the operation carries an idempotency identity.

## Connections

[MVCC](mvcc.md) is one family of techniques for implementing useful isolation. [Idempotency](../distributed-systems/idempotency.md) handles repeated logical operations around ambiguous failures. [Replication and consistency](../distributed-systems/replication-consistency.md) asks what “committed” means when durable state exists on several machines.

## Pressure questions

- What is the business invariant, and does the transaction boundary actually contain it?
- Which isolation anomaly would break this operation?
- What happens if the database commits and the process dies before acknowledging the caller?
- Which side effects sit outside the transaction?