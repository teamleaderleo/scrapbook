---
title: Idempotency
kind: concept
trunk: distributed-systems
summary: Repeating the same intended operation does not create additional effect.
created: 2026-08-25
updated: 2026-08-25
---
# Idempotency

An idempotent operation can be applied more than once without multiplying the intended effect. In distributed systems this usually means repeated delivery is expected, so the operation carries enough identity for the receiver to recognize that it has already committed that logical request.

## Invariant

One logical operation has one durable effect, even when transport or retry behavior causes several execution attempts.

The identity has to name the operation, not merely the network request. A payment retry with a fresh idempotency key is a new logical operation and can still charge twice.

## Concrete trace

A client sends `charge(order-42, key=k)`. The server commits the charge but the response disappears. The client retries with the same key. The server finds the committed result for `k` and returns it instead of charging again.

The interesting state is the server-side record connecting `k` to the outcome. That record must be published with the effect strongly enough that a crash cannot leave “charged but key forgotten.”

## Connections

[Retries and timeouts](retries-timeouts.md) create the ambiguity that makes idempotency valuable. [Transactions](../storage/transactions.md) can couple the idempotency record to a database effect. [Cancellation](../computation/cancellation.md) shows why “the caller stopped waiting” does not prove the effect stopped. [Authority](../security/authority.md) asks who is allowed to claim or reuse an operation identity.

## Pressure questions

- What exactly is the identity of one logical operation?
- Where is the deduplication record stored, and when does it become durable?
- How long is an idempotency key remembered?
- What happens when two attempts with the same key arrive concurrently but disagree on payload?