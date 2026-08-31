---
title: Authority
kind: concept
trunk: security
summary: Authority is the ability to cause an effect; secure designs make grants explicit, narrow, current, and revocable when necessary.
created: 2026-08-25
updated: 2026-08-31
---
# Authority

Authentication answers who or what a principal is. Authorization decides what that principal may do. Authority is the more concrete question underneath both: which effect can this credential, capability, session, worker, process, or guest actually cause right now?

## Invariant

A component should possess the least authority needed for its current responsibility, and stale ownership should not silently preserve the ability to commit future effects.

## Failure modes

A long-lived bearer token can outlive the job that needed it. A worker can keep a credential after a lease or claim moved elsewhere. Confused-deputy bugs appear when a privileged component uses its own authority on behalf of an untrusted request without preserving the requester's limits. A passed-through device creates the same question in physical form: stale DMA, interrupt, or PCI ownership can preserve access to hardware after the intended grant moved.

## Connections

[Trust boundaries](trust-boundaries.md) identify where foreign input or identity enters. [API boundaries](../product/api-boundaries.md) expose authority through callable operations. [Agent loops](../ai-systems/agent-loops.md) make tool authority especially visible because generated decisions can reach real side effects. [Cancellation](../computation/cancellation.md) can require revoking authority from work that should no longer publish. [Virtual machines as authority over real resources](../computation/virtual-machine-authority.md) shows the same model applied to CPU, memory, PCI devices, DMA reachability, and device assignment.

## Pressure questions

- What exact effect does this credential or device grant permit?
- Who can delegate that authority, and how narrowly?
- How does the grant expire or get revoked?
- Could a stale worker or guest continue committing after responsibility moved?