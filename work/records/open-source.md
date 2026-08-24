# Open-source engineering

This file keeps the strongest external engineering outcomes and the review stories where the final landing path differed. It is not a commit-count leaderboard and it is not a mirror of every active Fieldwork branch.

For moving status, the upstream pull request wins. Fieldwork owns ongoing investigation detail; this record keeps the mechanisms that have earned durable career/interview value.

## Vercel AI SDK — one direct merge plus two adopted repairs

The current AI SDK cluster has three accepted repairs.

### Deterministic URL-regex evaluation

Upstream PR: https://redirect.github.com/vercel/ai/pull/18570  
State: **merged and published**.

`isUrlSupported()` evaluated caller-supplied patterns with `RegExp.test()`. Global and sticky regexes retain `lastIndex`, so identical support checks could depend on earlier calls and mutate caller-owned state.

The repair evaluates global/sticky patterns from zero, restores the original `lastIndex` in `finally`, and keeps ordinary regexes on the cheap direct path. Regression coverage includes repeated calls, nonzero caller state, mismatches, throwing custom execution, and frozen ordinary regexes.

Career value: direct merged/published TypeScript runtime correctness with a small exact ownership boundary.

### Async stream reader cleanup after source errors

Contributor PR: https://redirect.github.com/vercel/ai/pull/18371  
Factory landing: https://redirect.github.com/vercel/ai/pull/18400  
State: **contributor repair approved; Factory implementation merged with explicit co-author credit**.

A rejected `reader.read()` could bypass cleanup in async-iterable stream helpers. The caller received the source error while the stream stayed locked and later iterator behavior no longer followed the intended cleanup path.

The contributor repair preserved the exact source rejection, released the reader without cancelling an already-errored stream, and covered exact/undefined errors, partial consumption, concurrent access, reacquisition, and later iteration in Node and Edge environments.

The owning repository's Factory path landed the implementation and preserved `teamleaderleo` in the merged commit's co-author metadata.

### Preserve size-limit errors when cancellation fails

Contributor PR: https://redirect.github.com/vercel/ai/pull/18572  
Factory landing: https://redirect.github.com/vercel/ai/pull/18695  
Maintained-release landings: https://redirect.github.com/vercel/ai/pull/18700 and https://redirect.github.com/vercel/ai/pull/18702  
State: **adopted and merged on main plus maintained v5/v6 release branches, with co-author credit**.

`readResponseWithSizeLimit()` could select the useful `DownloadError`, then lose it when terminal `reader.cancel()` cleanup rejected. The repair contains cancellation failure and keeps the size-limit error as the caller-visible result while still attempting cleanup.

Career use: the cluster is stronger than “contributed to AI SDK”: one direct merge plus two independently developed repairs adopted by the repository's own maintenance system with retained credit.

## Cloud Hypervisor — three merged Rust/VMM fixes

### Exact shutdown lifecycle before VM/disk reuse

Upstream PR: https://redirect.github.com/cloud-hypervisor/cloud-hypervisor/pull/8699  
State: **merged**.

API lifecycle tests used SSH disappearance as a shutdown-completion proxy. `sshd` can disappear while guest/VMM cleanup continues, yet the tests immediately reused the VM/disk.

The repair starts the VMM with `--no-shutdown` plus event monitoring, powers off the guest normally, and waits for the VMM's exact `shutdown` event before reuse.

Career value: lifecycle synchronization against the event that actually owns the state transition.

### Typed ACPI construction failures

Upstream PR: https://redirect.github.com/cloud-hypervisor/cloud-hypervisor/pull/8709  
State: **merged**.

Several ACPI construction paths could panic on address overflow, missing `fw_cfg`, guest-memory writes, or delivery failures. The repair introduced a typed ACPI error path and propagated failures through VM boot instead of panicking.

Validation spanned x86_64/AArch64 KVM/MSHV, fw_cfg, TDX, Clippy, formatting, and the repository's RISC-V build; the PR also disclosed the missing VM boot smoke test instead of laundering build coverage into runtime coverage.

### Sparse VFIO BAR mapping semantics

Upstream PR: https://redirect.github.com/cloud-hypervisor/cloud-hypervisor/pull/8734  
State: **merged 2026-08-20**.

A DMA range could fit inside the logical BAR while crossing a gap between separately mmap'd sparse areas. The merged repair rejects that range unless one mapping covers the complete request.

Career value: a third independent accepted Cloud Hypervisor boundary, this time around PCI/VFIO mapping rather than lifecycle or boot errors.

### QCOW L2 ownership before L1 publication

Upstream PR: https://redirect.github.com/cloud-hypervisor/cloud-hypervisor/pull/8721  
State: **open**.

The deeper follow-on asks when a newly allocated or relocated L2 table becomes owned. The selected direction gives the replacement L2 `refcount=1` before L1 can publish it; relocation then performs the old/new ownership handoff locally instead of leaving old-table release in deferred cleanup.

Keep the live PR as the authority for current review disposition. Career/interview value already exists in the ownership problem and the review-driven move toward a local failure-safe handoff; merge language waits for merge.

## Cloudflare Workers SDK — two merged state/lifecycle fixes

### Miniflare disposal ordering

Upstream PR: https://redirect.github.com/cloudflare/workers-sdk/pull/15143  
State: **merged**.

`Miniflare.dispose()` could wait on independent browser/proxy cleanup before requesting runtime termination. Slow or failed auxiliary cleanup could therefore delay the `workerd` termination request.

The landed repair starts runtime disposal first, preserves existing cleanup order, remembers the first cleanup failure, waits for the already-started runtime exit, continues remaining teardown, then returns the preserved error.

Human review improved the first version: cleanup continues after the first failure instead of turning one auxiliary error into skipped teardown.

### Current Access credentials vs cached interactive authorization

Upstream PR: https://redirect.github.com/cloudflare/workers-sdk/pull/15080  
State: **merged**.

`getAccessHeaders()` cached service-token headers by domain. Removing or partially changing current credentials could leave stale complete headers reusable for that domain.

The repair reads service-token headers from the current environment while preserving legitimate interactive `CF_Authorization` cookie caching. Regression coverage exercises removed/incomplete service-token variables and valid interactive-cookie reuse.

## Vite — two merged lifecycle/correctness fixes

### Close temporary optimizer analysis builds

Upstream PR: https://redirect.github.com/vitejs/vite/pull/23207  
State: **merged**.

Vite could create a temporary Rolldown build to inspect an `optimizeDeps.extensions` dependency, parse the result, and return without closing the build.

The repair closes the temporary build through `try/finally` on success and failure. A focused plugin regression counts `buildStart`/`closeBundle` so every started analysis build has to close.

### Preserve `closeBundle(error)` after `buildEnd` failure

Upstream PR: https://redirect.github.com/vitejs/vite/pull/23165  
State: **merged 2026-08-21**.

The dev-server teardown path could stop after a `buildEnd` failure instead of carrying that failure into the later `closeBundle(error)` lifecycle step.

The merged repair preserves the Rollup/Rolldown lifecycle contract by supplying the `buildEnd` error to `closeBundle(error)` before rethrowing it.

Together the two merges form a clean Vite lifecycle/correctness cluster: temporary build ownership on one side, teardown error propagation on the other.

### Repeated config resolution idempotence

Upstream PR: https://redirect.github.com/vitejs/vite/pull/23208  
State: **open**.

Repeated `resolveConfig()` on the same inline config can duplicate resolver-generated environment state, including optimizer plugins, and invalidate an otherwise warm optimizer cache. The candidate keeps resolver-generated state local to one resolution.

Use the live PR for disposition. The mechanism is useful supporting evidence; the two merged repairs already carry the resume claim.

## Accepted findings where upstream chose another landing path

### Zustand — stale async hydration after `clearStorage()`

Public report: https://redirect.github.com/pmndrs/zustand/discussions/3554  
Upstream landing: https://redirect.github.com/pmndrs/zustand/pull/3555

The persist middleware had a generation for stale concurrent hydration, while `clearStorage()` failed to advance it. A delayed read/migration could therefore publish after storage was cleared.

The submitted repair advanced the generation before removal. Upstream later merged the same core invalidation mechanism through its own PR with broader coverage.

Safe wording: **identified the race and supplied the generation-invalidation repair subsequently implemented upstream.**

### Playwright — MCP HTTP shutdown authority

Report: https://redirect.github.com/microsoft/playwright/issues/42129  
Maintainer landing: https://redirect.github.com/microsoft/playwright/pull/42133  
State: **finding accepted; maintainer-owned fix merged**.

A reachable production MCP HTTP server exposed a fixed-header `/killkillkill` route that entered the graceful `SIGINT` shutdown path. The route existed for a lifecycle test; the fixed header reduced CSRF exposure without establishing process ownership.

The report proposed parent-owned stdin authority. Upstream agreed with the authority problem and chose a smaller native repair: expose `/killkillkill` only under `isUnderTest()`.

The diagnosis landed; the prepared stdin design did not become upstream behavior.

### BuildKit — rootless/rootful mount-point reproducibility

Contributor PR: https://redirect.github.com/moby/buildkit/pull/7033  
Maintainer replacement: https://redirect.github.com/moby/buildkit/pull/7039

The investigation reproduced output divergence caused by runtime-created mountpoint stubs. The contributor candidate cleaned the rootful side after rootless conversion; the maintainer kept the diagnosis and chose the opposite compatibility policy, restoring missing rootless mountpoints to preserve existing rootful output.

Career value: the disagreement is **which side of compatibility should move**, not whether a real divergence existed.

### runc — `MaxCPU` boundary semantics

Issue: https://redirect.github.com/opencontainers/runc/issues/5388  
Contributor PR: https://redirect.github.com/opencontainers/runc/pull/5389  
Maintainer replacement: https://redirect.github.com/opencontainers/runc/pull/5392

A real off-by-one existed between inclusive `MaxCPU` meaning and the allocation boundary. The submitted patch repaired allocation. Maintainer history showed the cleaner fix was to restore an exclusive `MaxCPU` meaning instead; the competing patch was closed.

Career value: excellent evidence of changing conclusion when project history supports a better repair.

## Research that stays research

### FEX

Owned fork: https://github.com/teamleaderleo/FEX  
Primary Linux Fieldwork investigation: https://github.com/teamleaderleo/linux-fieldwork/pull/669

The owned-fork work covers Vulkan dynamic proc-address routing, GIPA/GDPA availability, generated thunk lifetime, moved wrapper reloads, callbacks, and cross-ISA runtime behavior. It has real hosted/runtime evidence.

Upstream FEX contribution policy sets the external boundary. Describe this as owned-fork runtime/ABI/Vulkan research unless a later compliant upstream path exists.

### Other Fieldwork candidates

SWC, current AI SDK harness research, and the broader Fieldwork/Linux Fieldwork bench remain useful sources of mechanisms and interview material. Their live repositories/issues own current disposition.

Promote one here when external acceptance or role-specific value makes it stronger than the existing selected set. Avoid keeping an old pending-status paragraph in Scrapbook merely because the investigation once looked promising.

## Career use

A one-page resume usually needs fewer names than this file contains. Current default external hierarchy is roughly:

1. Vercel AI SDK;
2. Cloud Hypervisor;
3. the better role-specific Vite or Cloudflare cluster;
4. accepted-finding/research stories as interview material.

The point of the record is repeatability across unrelated codebases: recover the actual owner, build a discriminator, make the narrow repair, and change conclusion when review or evidence earns it.
