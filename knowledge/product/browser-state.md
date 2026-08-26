---
title: Browser state
kind: concept
trunk: product
summary: Browser applications coordinate server state, URL state, local interaction state, caches, and asynchronous work with different lifetimes.
created: 2026-08-25
updated: 2026-08-25
---
# Browser state

A browser application rarely has one state store. The URL owns navigable state. The server owns durable shared facts. Client caches own local copies of server state. Components own transient interaction. Browser storage can preserve device-local memory. Async work introduces in-flight state whose result may arrive after the user moved on.

## Invariant

Put a fact under the owner whose lifetime and sharing semantics match the product promise. Derive duplicate state when possible instead of synchronizing two writable copies by hand.

## Failure modes

A component can copy props into local state and drift. A stale request can overwrite a newer result. Back/forward navigation can restore URL state while local state forgets it. Optimistic updates can survive a failed mutation unless rollback is explicit.

## Connections

[Concurrency](../computation/concurrency.md) appears through overlapping async work. [Cancellation](../computation/cancellation.md) helps prevent stale work from committing. [API boundaries](api-boundaries.md) define which state can be shared or mutated remotely. [Idempotency](../distributed-systems/idempotency.md) matters when browser retries reach side effects.

## Pressure questions

- Which state belongs in the URL because it should survive navigation or sharing?
- What prevents an older response from overwriting newer state?
- Which cache is authoritative, and how does it become stale?
- What should survive a refresh, another tab, or another device?