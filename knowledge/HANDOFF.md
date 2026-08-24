---
title: Current handoff
updated: 2026-08-25
---
# Current handoff

If you opened Knowledge cold, start here. The point of this file is to remove the cost of deciding what to do next.

## Default next walk

Follow [Cancellation](computation/cancellation.md) → [Retries and timeouts](distributed-systems/retries-timeouts.md) → [Idempotency](distributed-systems/idempotency.md).

Before reading, answer this out loud from memory:

> A request times out. What, exactly, do you know happened on the other side?

Then read the three nodes quickly. Reading is the fast intake path; do not turn the first pass into a quiz.

Afterward, answer these without looking:

- Why can a timeout create duplicate effects even when the caller only issued one logical operation?
- What does an idempotency key have to remember, and for how long?
- Where does cancellation help, and where can it only stop the caller from waiting?
- What changes if two copies of the same logical operation run concurrently instead of sequentially?

If an answer feels vague, follow the nearest link and repair the model. If the answer is crisp, move on.

## Pick by available attention

**Five minutes:** read one node, close it, explain the invariant in your own words, then check the node again.

**Twenty minutes:** do the default three-node walk and let one answer turn into a short voice conversation with follow-up pressure.

**Forty-five minutes:** add one neighboring branch. Good choices are [Transactions](storage/transactions.md) → [MVCC](storage/mvcc.md) → [Replication and consistency](distributed-systems/replication-consistency.md), or [Agent loops](ai-systems/agent-loops.md) → [Authority](security/authority.md) → [Trust boundaries](security/trust-boundaries.md).

## Other live frontiers

The current forest is thin around memory ordering, leases, backpressure, consensus, WAL/LSM storage, GPU execution, distributed inference, browser scheduling, sandboxing, and observability.

Do not expand one of those merely because it is on this list. Prefer the frontier that a conversation, interview question, bug, paper, or piece of real work makes interesting.

## End-of-session handoff

When a session materially changes understanding:

1. strengthen the concept nodes that actually changed;
2. add the useful sideways links;
3. update today's file in [`log/`](log/2026-08-25.md);
4. rewrite this handoff so the next cold start has an obvious first move.

The handoff is disposable current context. Git history keeps the previous versions.