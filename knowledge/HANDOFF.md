---
title: Current handoff
updated: 2026-08-31
---
# Current handoff

If you opened Knowledge cold, start here. The point of this file is to remove the cost of deciding what to do next.

## Default next walk

Follow [Virtual machines as authority over real resources](computation/virtual-machine-authority.md) → [Authority](security/authority.md) → [Runtime lifetimes](toolchains/runtime-lifetimes.md).

Before reading, answer this out loud from memory:

> A Windows VM owns a physical GPU, loads the ordinary Windows driver, and drives a monitor connected directly to that GPU. What exactly remains virtual?

Then read the three nodes quickly. Reading is the fast intake path; do not turn the first pass into a quiz.

Afterward, answer these without looking:

- What changes across emulation, paravirtualization, and direct device assignment?
- Why can the steady-state datapath become almost entirely physical while the ownership boundary remains virtualized?
- Which transitions become more consequential after the VMM leaves routine device traffic?
- What evidence would you require before reassigning a PCI device, BAR address, DMA mapping, or interrupt route to another owner?

If an answer feels vague, follow the nearest link and repair the model. If the answer is crisp, continue into [Memory hierarchy](performance/memory-hierarchy.md) and ask how guest CPU translation differs from device DMA through an IOMMU.

## Pick by available attention

**Five minutes:** read the virtual-machine-authority node, close it, and explain “physical datapath, virtual authority” in your own words.

**Twenty minutes:** do the default three-node walk and trace one assigned GPU from host admission through guest use to teardown and reuse.

**Forty-five minutes:** add the memory path. Walk one guest CPU load through guest page tables and second-stage translation into physical DRAM, then compare that with an assigned device reaching guest memory through the IOMMU.

## Other live frontiers

The current forest is thin around memory ordering, leases, backpressure, consensus, WAL/LSM storage, GPU execution, distributed inference, browser scheduling, sandboxing, observability, interrupt delivery, second-stage address translation, IOMMUs, and device reset.

Do not expand one of those merely because it is on this list. Prefer the frontier that a conversation, interview question, bug, paper, or piece of real work makes interesting.

## End-of-session handoff

When a session materially changes understanding:

1. strengthen the concept nodes that actually changed;
2. add the useful sideways links;
3. update today's file in [`log/`](log/2026-08-31.md);
4. rewrite this handoff so the next cold start has an obvious first move.

The handoff is disposable current context. Git history keeps the previous versions.