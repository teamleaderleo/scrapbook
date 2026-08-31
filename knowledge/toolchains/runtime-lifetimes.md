---
title: Runtime lifetimes
kind: concept
trunk: toolchains
summary: Resource correctness depends on which scope owns creation, use, transfer, and cleanup.
created: 2026-08-25
updated: 2026-08-31
---
# Runtime lifetimes

Many runtime bugs are ownership bugs wearing API-specific clothing. A stream, socket, worker, lock, listener, file, task, or assigned device is created or acquired somewhere; correctness depends on knowing who may use it, when ownership moves, and who releases it.

## Invariant

Every consequential resource should have a legible lifetime. Cleanup should happen once, after the last valid use, and it should preserve the result that caused cleanup to begin.

## Failure modes

Double disposal, use-after-close, leaked listeners, cleanup that races in-flight work, and shared singletons torn down by one consumer all come from unclear ownership. Re-entrancy can make a method observe its own partially updated lifetime state. Device assignment adds physical versions of the same failure: a BAR address becomes reusable while old side effects survive, a DMA mapping outlives the grant, or reset begins while another owner still depends on the device.

## Connections

[Cancellation](../computation/cancellation.md) forces lifetime transitions early. [Concurrency](../computation/concurrency.md) makes simultaneous ownership claims possible. [Authority](../security/authority.md) is the security analogue: possession of a resource or capability is meaningful only while the ownership grant is current. [Virtual machines as authority over real resources](../computation/virtual-machine-authority.md) shows how lifecycle edges concentrate when a VMM hands physical devices directly to a guest. [Code review](../engineering-judgment/code-review.md) should ask about lifetime edges whenever an API creates, assigns, moves, resets, or disposes resources.

## Pressure questions

- Who owns this resource after the function returns?
- Can two callers both believe they are responsible for cleanup?
- What happens when cleanup begins while work is in flight?
- Does a shared runtime survive one consumer disconnecting?
- What evidence proves an assigned device or address is safe to hand to the next owner?