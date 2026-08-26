---
title: Agent loops
kind: concept
trunk: ai-systems
summary: An agent repeatedly observes context, chooses an action, executes through tools, and incorporates the result into later decisions.
created: 2026-08-25
updated: 2026-08-25
---
# Agent loops

An agent system is more than a model call. It has a loop: assemble context, ask the model for a decision, validate that decision, execute an allowed action, observe the result, and decide what happens next.

## Invariant

Generated intent should not silently become authority. The harness owns tool schemas, permissions, budgets, retries, persistence, and the rule for when a result is accepted as evidence.

## Failure modes

The model can call the wrong tool correctly. Context can contain stale or adversarial instructions. A tool can succeed while the agent loses the observation and repeats the effect. Long conversations can preserve obsolete assumptions. Parallel agents can duplicate work or commit conflicting changes without a shared ownership rule.

## Connections

[Authority](../security/authority.md) decides which effects tools may cause. [Trust boundaries](../security/trust-boundaries.md) treat model output and retrieved context as foreign input. [Idempotency](../distributed-systems/idempotency.md) protects repeated tool calls. [Measurement](../engineering-judgment/measurement.md) is the beginning of evaluation: define what evidence would show the loop is actually helping.

## Pressure questions

- Which decisions belong to the model and which remain in deterministic harness code?
- What prevents a repeated tool call from duplicating an effect?
- Which context is trusted, and how does stale context expire?
- How do you know the agent finished the right task instead of merely producing plausible output?