---
title: Trust boundaries
kind: concept
trunk: security
summary: A trust boundary is where data, identity, code, or control crosses from one authority domain into another.
created: 2026-08-25
updated: 2026-08-25
---
# Trust boundaries

A value becomes security-relevant when accepting it gives somebody influence over a more trusted component. Network requests are obvious boundaries, but so are parsed files, database rows from another tenant, thrown JavaScript values, plugin hooks, model output, environment variables, and serialized job payloads.

## Invariant

Validate and normalize at the point where foreign input acquires meaning or authority. Do not let a representation cross the boundary with more trust than its origin earned.

## Failure modes

Validation can happen at the wrong layer and then be invalidated by later decoding or normalization. Introspection itself can execute behavior in dynamic languages. A system can validate syntax while missing the authority question: the input is well formed but should never have been allowed to name that resource.

## Connections

[Authority](authority.md) asks what the boundary grants after validation. [API boundaries](../product/api-boundaries.md) are a common place where trust changes. [Agent loops](../ai-systems/agent-loops.md) add generated text and tool arguments as foreign input. [Code review](../engineering-judgment/code-review.md) should identify newly crossed boundaries before focusing on local implementation style.

## Pressure questions

- Which side of this boundary is allowed to be malicious or merely malformed?
- Does validation happen before or after decoding and canonicalization?
- Can inspecting the value execute code or trigger a getter/trap?
- Which resource names or actions should this caller be unable to express at all?