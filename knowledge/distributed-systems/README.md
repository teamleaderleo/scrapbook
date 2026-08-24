---
title: Distributed systems
kind: trunk
trunk: distributed-systems
summary: Systems where communication, partial failure, duplicate work, and stale knowledge become ordinary conditions.
created: 2026-08-25
updated: 2026-08-25
---
# Distributed systems

Once work crosses a machine or process boundary, failure stops being a single clean event. Messages can be delayed, duplicated, reordered, or lost; a caller can stop waiting while the callee continues; two replicas can each have a plausible but different view of reality.

Start with [Retries and timeouts](retries-timeouts.md), then [Idempotency](idempotency.md). [Replication and consistency](replication-consistency.md) widens the question from one request to several durable copies of state.

This trunk links constantly into [transactions](../storage/transactions.md), [cancellation](../computation/cancellation.md), [authority](../security/authority.md), and [tail latency](../performance/latency-throughput-tail.md).