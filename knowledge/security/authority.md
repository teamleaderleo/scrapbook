---
title: Authority
kind: concept
trunk: security
summary: Authority is the ability to cause an effect; secure designs make grants explicit, narrow, current, and revocable when necessary.
created: 2026-08-25
updated: 2026-08-25
---
# Authority

Authentication answers who or what a principal is. Authorization decides what that principal may do. Authority is the more concrete question underneath both: which effect can this credential, capability, session, worker, or process actually cause right now?

## Invariant

A component should possess the least authority needed for its current responsibility, and stale ownership should not silently preserve the ability to commit future effects.

## Failure modes

A long-lived bearer token can outlive the job that needed it. A worker can keep a credential after a lease or claim moved elsewhere. Confused-deputy bugs appear when a privileged component uses its own authority on behalf of an untrusted request without preserving the requester's limits.

## Connections

[Trust boundaries](trust-boundaries.md) identify where foreign input or identity enters. [API boundaries](../product/api-boundaries.md) expose authority through callable operations. [Agent loops](../ai-systems/agent-loops.md) make tool authority especially visible because generated decisions can reach real side effects. [Cancellation](../computation/cancellation.md) can require revoking authority from work that should no longer publish.

## Pressure questions

- What exact effect does this credential permit?
- Who can delegate that authority, and how narrowly?
- How does the grant expire or get revoked?
- Could a stale worker continue committing after responsibility moved?