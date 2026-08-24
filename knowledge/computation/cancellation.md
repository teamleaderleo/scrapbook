---
title: Cancellation
kind: concept
trunk: computation
summary: Stopping work is a state transition with ownership and result-precedence rules, not merely an exception to throw.
created: 2026-08-25
updated: 2026-08-25
---
# Cancellation

Cancellation asks a running operation to stop before its ordinary completion path. The hard part is everything the operation may already have changed.

## Invariant

A cancelled operation should leave each owned resource in a state another owner can reason about, and cancellation should not silently rewrite a result that was already completed.

That makes cancellation a protocol. Somebody requests it, the running work reaches cancellation points, cleanup releases or transfers ownership, and the caller receives a result whose precedence rules are explicit.

## Failure modes

A task can acknowledge cancellation too late, after publishing an effect. Cleanup can fall through into a success path. A timeout can return to the caller while the underlying operation continues and later performs the effect anyway. Retrying that timed-out operation can then create a duplicate.

## Connections

[Retries and timeouts](../distributed-systems/retries-timeouts.md) turn cancellation into distributed uncertainty: the caller may stop waiting without knowing whether the callee stopped working. [Idempotency](../distributed-systems/idempotency.md) makes that uncertainty safer. [Concurrency](concurrency.md) supplies the interleavings that make cleanup ordering dangerous. [Authority](../security/authority.md) becomes relevant when cancellation should revoke a worker's ability to commit further effects.

## Pressure questions

- Does timeout mean the operation stopped, or only that the caller stopped waiting?
- Can cleanup overwrite an earlier failure?
- Which effects are reversible, and which need idempotent publication?
- What prevents a cancelled worker from committing after ownership moved elsewhere?