---
title: API boundaries
kind: concept
trunk: product
summary: An API is a contract for meaning, authority, failure, compatibility, and change—not merely a function signature over a network.
created: 2026-08-25
updated: 2026-08-25
---
# API boundaries

An API turns internal behavior into something another component is allowed to depend on. Good API design makes the stable meaning clearer than the implementation behind it.

## Contract

Callers need to know accepted inputs, returned outputs, error semantics, authority requirements, idempotency behavior, compatibility expectations, and which timing or ordering guarantees are intentional.

## Failure modes

An API can leak internal representation and make migrations expensive. Ambiguous error responses force callers to guess whether retry is safe. A convenient endpoint can accidentally combine too much authority. Optional fields can become de facto required once enough clients depend on an accidental behavior.

## Connections

[Trust boundaries](../security/trust-boundaries.md) describe how input becomes trusted enough to act on. [Authority](../security/authority.md) limits which effects the caller may request. [Retries and timeouts](../distributed-systems/retries-timeouts.md) force the API to communicate retry semantics. [Transactions](../storage/transactions.md) often sit behind an endpoint but may not contain every external effect the endpoint causes.

## Pressure questions

- Which behavior is a compatibility promise and which is implementation detail?
- How does a caller know whether an ambiguous failure is safe to retry?
- Does this endpoint expose more authority than one caller needs?
- How would the contract evolve without coordinating every client at once?