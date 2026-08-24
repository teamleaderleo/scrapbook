# Resume candidates

This is the working copy for the one-page resume. Source repositories and upstream pull requests own the facts. This file owns which facts deserve space and how the current resume says them.

Read [`resume-portfolio-style.md`](resume-portfolio-style.md) before revising this file. That guide owns the writing rules. The current upstream bullets below are the checkpoint to preserve unless a new version clearly improves consequence, density, readability, technical substance, or credibility.

## Selected open source engineering

### Vercel AI SDK

Current candidate:

> Fixed URL checks that could flip between supported and unsupported across identical calls (#18570), released Web Stream readers after source errors so failed reads didn't leave the stream locked (#18371/#18400), and kept download size-limit failures from being replaced by cancellation errors (#18572/#18695).

Why this version survives:

- #18570 leads with nondeterministic behavior rather than `lastIndex`.
- #18371 says what the stale lock does to the stream.
- #18572 leads with the useful error that callers were losing.

### Cloud Hypervisor

Current candidate:

> Fixed a VM lifecycle race where tests reused a VM and disk before shutdown cleanup finished (#8699), turned ACPI table construction failures into VM boot errors instead of VMM panics (#8709), rejected DMA requests that cross unmapped holes in VFIO device memory instead of panicking (#8734), and fixed QCOW ownership so metadata still referenced by the image can't be reused as free space (#8721, open).

The fourth clause stays in the pool because #8721 has substantial upstream review and reaches deeper persistent metadata semantics than the first three repairs. Keep its open status next to the number rather than turning the sentence into review history.

### Vite

Current candidate:

> Prevented build failures from skipping plugin cleanup (#23165), stopped dependency analysis from leaking temporary Rolldown builds (#23207), and kept server restarts from invalidating warm dependency caches by duplicating optimizer state (#23208, open).

The cache consequence should lead #23208. `resolveConfig()` and duplicated plugin arrays explain the bug in the PR, not on the resume.

### Cloudflare Workers SDK

Current candidate:

> Kept Miniflare shutdown from leaving `workerd` running when browser or proxy cleanup stalls or fails (#15143), and stopped removed or incomplete Cloudflare Access credentials from continuing to authenticate with an older cached service token (#15080).

Both clauses lead with the operational consequence. Teardown ordering and cache ownership can stay in the PRs.

### React

Keep in the pool, but don't force it onto the page yet.

> Fixed a React Fragment listener bug that could delete a child's listener and stop registered listeners from reaching new children (#37251, open).

The capture-option identity fix is useful regression coverage but makes the resume sentence worse. Leave it in the PR. React earns a row only if this clause adds more than the next strongest merged work or independent project.

## Independent engineering

### Preflight

Preflight gets the largest allocation. Three bullets currently earn the space.

> Built Preflight, a launcher and Java agent for Starsector with 83 enabled mods, reducing startup from **101s to 13.69s** on an M5 MacBook Air by preparing texture, data, audio, resource lookup, and generated code work before launch.

> Built JFR tracing and unattended benchmarks that found a roughly **27s prefetch delay**, more than **1.1 million resource path joins**, and expensive mod callbacks, then used those measurements to decide where to intervene.

> Cut the steady state texture cache to about **1.1 GB** and found that disk order alone changed startup from **33.53s to 14.174s** for the same prepared textures, then built the desktop product around it with macOS, Windows, and Linux packaging, signed updates, diagnostics, and rollback.

The first bullet sells the result. The second sells the investigation. The third sells the surprising storage result and the product work around the performance engine.

### Stensibly

Current candidate:

> Built and run Stensibly, a hosted coordination system for human and agent work with durable claims, handoffs across sessions, guarded GitHub changes, and repository activity that can continue into email after workers exit, using Cloudflare Workers, Convex, REST, and MCP.

### SmolRunner

Current candidate:

> Building a Rust Linux execution system for coding agents on Apple silicon Macs, with disposable Lima/VZ workers plus reusable project disks, OverlayFS workspaces, Git object pools, and crash recovery.

### Glossless

Current candidate, compressed from the older two-bullet version:

> Built a React/Vite artist reference editor with synchronized 2D and 3D pose editing, MediaPipe detection, editable keypoints, GLB/GLTF rig driving, lighting and silhouette studies, project files, reference sheet exports, and WebGL recovery that keeps 2D editing usable if 3D rendering fails.

### Cultist, Proofwake, Renderprove, Quarry, Scrapbook, Fieldwork

Keep these off the default one-page cut for now. They remain useful interview and site material. A repository existing is not a reason to spend a line on it.

## Industry experience

### IBM

Current candidates:

> Built and refactored Java end to end tests for IBM Cloud AI/ML and data workflows across Kafka, Spark, Snowflake, hybrid cloud, and on premises environments, and identified a critical RBAC flaw that required a three team hotfix.

> Cut developer onboarding from **3 hours to 15 minutes** by consolidating obsolete SDK and runtime setup.

The older resume also claimed adoption of the test suite across teams. Keep that available if it is worth the extra words when the page is assembled.

## Education and skills

> University of Toronto | BSc in Mathematics, Statistics & Computer Science | 2024

Keep skills compact and unsurprising.

> **Languages:** TypeScript, JavaScript, Rust, Java, Python, Go, SQL, C  
> **Technologies:** Linux, React, Vite, Next.js, Node.js, Cloudflare Workers, Convex, PostgreSQL, AWS, Docker, Git

## Disposition notes that are not resume prose

- React #37251 is open and has a positive submitted review.
- Cloud Hypervisor #8721 is open and has substantive upstream review, including an approval before later requested revisions.
- Vite #23208 is open.
- AI SDK #18371 and #18572 are the contributor repairs. Equivalent implementations were merged through #18400 and #18695, which is why the bullet keeps both numbers beside those clauses.

When one of these upstream states changes, update the number annotation. Don't rewrite the engineering sentence unless the engineering changed.