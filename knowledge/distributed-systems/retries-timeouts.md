---
title: Retries and timeouts
kind: concept
trunk: distributed-systems
summary: A timeout limits how long a caller waits; a retry creates another attempt under uncertainty about the previous one.
created: 2026-08-25
updated: 2026-08-25
---
# Retries and timeouts

A timeout is a local decision: the caller is unwilling to wait longer. It does not tell you whether the remote operation failed, succeeded, or is still running.

A retry therefore runs under uncertainty. It may be the first attempt that reaches the server, or it may race an earlier attempt that already committed.

## Invariant

Retry policy should preserve the logical operation's correctness while avoiding unbounded load amplification. That normally requires an operation identity, a retry budget, and backoff that spreads repeated work instead of synchronizing it.

## Failure modes

Aggressive retries can turn a slow dependency into a retry storm. Layered retries multiply attempts across services. A timeout shorter than the system's ordinary tail can manufacture failures. A timeout longer than the useful request lifetime can leave resources occupied after the caller has moved on.

## Connections

[Idempotency](idempotency.md) protects effects from duplicate attempts. [Cancellation](../computation/cancellation.md) asks whether timed-out work should keep its authority to finish. [Tail latency](../performance/latency-throughput-tail.md) determines whether a timeout is exceptional or simply cutting through the normal p99. [Replication and consistency](replication-consistency.md) influences whether retrying against another replica can observe the earlier result.

## Pressure questions

- Which failures are safe to retry automatically?
- Where is the retry budget enforced when several layers can retry?
- Why does exponential backoff usually need jitter?
- What does the caller know after a timeout, and what remains unknown?