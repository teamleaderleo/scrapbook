# React — Fragment ref event listener registry identity

Upstream PR: https://redirect.github.com/react/react/pull/37251

**State:** open; one positive submitted review. GitHub records the review as `COMMENTED`, not `APPROVED`.

## What the change fixes

`FragmentInstance.removeEventListener()` currently traverses the Fragment's children and removes the requested listener before proving that the Fragment itself registered that listener.

That creates two related identity failures:

```text
unknown Fragment listener removal
        ↓
child traversal happens anyway
        ↓
a directly registered child listener can be removed
```

and:

```text
Fragment listener lookup → -1
        ↓
retained listener bookkeeping removes the wrong entry
        ↓
a later child can inherit the wrong listener state
```

The candidate checks Fragment ownership first. An unknown removal becomes a no-op before child listeners or retained Fragment bookkeeping are touched.

The same patch fixes listener-option identity. DOM listener removal keys on event type, callback, and capture. Omitted options, `false`, and `{capture: false}` therefore mean the same listener identity. React's Fragment registry previously normalized the omitted case differently; the candidate normalizes all three to capture-false identity.

## Evidence in the PR

The change adds focused regressions for:

- removing an unknown listener without forgetting a retained Fragment listener;
- preserving a listener registered directly on a child;
- treating omitted capture and explicit `false` as the same identity, including a child inserted after registration/removal.

The PR body records focused development and production test commands plus formatting/diff checks.

## Review state

A submitted review on 2026-08-22 says:

> Solid PR. Tests cover the important paths.

GitHub records that review as `COMMENTED`. Use **positively reviewed** or **received a positive review**. Do not call the PR approved, accepted, or merged unless the upstream state changes.

## Career use

This is a strong current React/runtime semantics specimen because the repair is about ownership and identity rather than surface API polish: prove who registered a listener before destructive mutation, keep child-owned state separate from Fragment-owned state, and match the DOM's listener identity contract.

Until formal approval or merge, keep it below the merged/adopted Vercel AI SDK, Cloud Hypervisor, Vite, and Cloudflare clusters in a general resume ranking. It can still be a useful React/frontend-runtime alternate because the mechanism is compact and the review is already positive.
