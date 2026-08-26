---
title: Code review
kind: concept
trunk: engineering-judgment
summary: Review checks whether a change preserves the right invariants at the right ownership boundary, then uses tests and evidence to challenge the claim.
created: 2026-08-25
updated: 2026-08-25
---
# Code review

A useful review starts before style. First understand what behavior is changing, which invariant is supposed to hold, and which component actually owns that invariant.

## Questions before lines

- Is the repair happening at the owner of the behavior or patching a downstream symptom?
- Which old behavior is part of compatibility and which was accidental?
- What new failure or lifetime edge appears?
- Which test distinguishes the intended rule from a nearby but wrong rule?

## Failure modes

A locally elegant patch can encode the wrong semantic boundary. Tests can assert the implementation rather than the contract. Review can reward added defensive code that disagrees with the wider system's policy. Large generated diffs can hide that the premise itself was never validated.

## Connections

[Runtime lifetimes](../toolchains/runtime-lifetimes.md) provide common review edges around cleanup and ownership. [Trust boundaries](../security/trust-boundaries.md) expose cases where a new input path changes the security model. [Debugging discriminators](debugging-discriminators.md) help design tests that can falsify the patch. [Measurement](measurement.md) keeps performance claims from becoming prose-only assertions.

## Pressure questions

- What invariant does this patch claim to restore?
- Which component historically owns that rule?
- What test would fail if the patch moved the boundary one layer too far?
- Which compatibility behavior could a refactor accidentally erase?