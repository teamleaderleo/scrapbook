---
title: Storage and data
kind: trunk
trunk: storage
summary: Persistence, transactions, versions, indexes, logs, and the rules governing what readers and writers observe.
created: 2026-08-25
updated: 2026-08-25
---
# Storage and data

Storage systems turn mutable intent into durable state while many readers and writers disagree about timing.

Begin with [Transactions](transactions.md), then use [MVCC](mvcc.md) to see one important way databases preserve useful read semantics without forcing every reader through the same lock.

This trunk naturally connects to [replication and consistency](../distributed-systems/replication-consistency.md), [idempotency](../distributed-systems/idempotency.md), and [measurement](../engineering-judgment/measurement.md).