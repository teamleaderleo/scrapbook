---
title: Runtime lifetimes
kind: concept
trunk: toolchains
summary: Resource correctness depends on which scope owns creation, use, transfer, and cleanup.
created: 2026-08-25
updated: 2026-08-25
---
# Runtime lifetimes

Many runtime bugs are ownership bugs wearing API-specific clothing. A stream, socket, worker, lock, listener, file, or task is created somewhere; correctness depends on knowing who may use it, when ownership moves, and who closes it.

## Invariant

Every consequential resource should have a legible lifetime. Cleanup should happen once, after the last valid use, and it should preserve the result that caused cleanup to begin.

## Failure modes

Double disposal, use-after-close, leaked listeners, cleanup that races in-flight work, and shared singletons torn down by one consumer all come from unclear ownership. Re-entrancy can make a method observe its own partially updated lifetime state.

## Connections

[Cancellation](../computation/cancellation.md) forces lifetime transitions early. [Concurrency](../computation/concurrency.md) makes simultaneous ownership claims possible. [Authority](../security/authority.md) is the security analogue: possession of a resource or capability is meaningful only while the ownership grant is current. [Code review](../engineering-judgment/code-review.md) should ask about lifetime edges whenever an API creates or disposes resources.

## Pressure questions

- Who owns this resource after the function returns?
- Can two callers both believe they are responsible for cleanup?
- What happens when cleanup begins while work is in flight?
- Does a shared runtime survive one consumer disconnecting?