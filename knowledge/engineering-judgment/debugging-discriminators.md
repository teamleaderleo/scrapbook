---
title: Debugging discriminators
kind: concept
trunk: engineering-judgment
summary: A strong debugging step is an observation or experiment that makes competing explanations predict different outcomes.
created: 2026-08-25
updated: 2026-08-25
---
# Debugging discriminators

Debugging improves quickly when the goal changes from “collect more information” to “separate the plausible models.”

## Model

Write down two or more explanations that could produce the symptom. Then ask what observation would differ if one explanation were true and another false. The best next step often has little implementation cost and high information value.

## Failure modes

Suspicious-looking code attracts attention even when no observed failure points at it. Logging can become a substitute for a hypothesis. A reproduction can accidentally exercise a different owner than production. Fixing the first visible symptom can preserve the deeper invariant violation.

## Connections

[Measurement](measurement.md) makes the evidence comparable and repeatable. [Code review](code-review.md) uses discriminators when a patch's claimed invariant needs proof. [Critical-path profiling](../performance/profiling-critical-path.md) is performance debugging with the same question: which owner predicts the observed elapsed time? [Trust boundaries](../security/trust-boundaries.md) often supply high-value hypotheses when failures appear only with foreign input.

## Pressure questions

- What are the two strongest competing explanations right now?
- Which cheap observation would make them disagree?
- Does the reproduction exercise the same owner as production?
- What result would make you abandon the current repair?