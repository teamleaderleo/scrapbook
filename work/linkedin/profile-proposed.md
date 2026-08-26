# Proposed LinkedIn profile

## Intro

**Location:** San Francisco, California — leave unchanged.

**Headline:** Software Engineer | Runtime, Performance & Developer Tools | Rust, Java, TypeScript

Tighter alternate, only if the default is awkward in LinkedIn's layout:

> Software Engineer | Runtime & Performance | Developer Tools | Rust, Java, TypeScript

## About

Software engineer interested in runtime, performance, developer tools, and difficult correctness
problems.

Most recently I created Preflight, an open-source performance launcher and mod-analysis toolkit for
Starsector. On my 83-mod M5 MacBook Air development setup, startup moved from 112.17 seconds to
13.69 seconds. The work spans JVM profiling and instrumentation, runtime bytecode rewriting,
caching and storage layout, Rust/Tauri, React, packaging, signed updates and rollback, and recovery.

I've also contributed merged fixes to React, Cloud Hypervisor, Vite, Cloudflare Workers SDK, and the
Vercel AI SDK.

Outside software, I draw and spent several years freelancing as an illustrator.

## Featured

Keep it small and do not create a post:

1. Preflight — https://github.com/teamleaderleo/preflight
2. teamleaderleo.com — https://teamleaderleo.com/
3. Current resume PDF, if LinkedIn accepts the existing artifact cleanly

## Experience

### Independent Software Engineer

**Independent / Self-employed** · Self-employed

**Jul 2026–Present**

- Created Preflight, an open-source performance launcher and mod-analysis toolkit that moved startup
  from **112.17s to 13.69s** on an 83-mod M5 MacBook Air development setup through JVM profiling and
  instrumentation, runtime bytecode rewriting, memoized reads, precomputed artifacts, and storage
  layout work.
- Contributed merged upstream fixes across React, Cloud Hypervisor, Vite, Cloudflare Workers SDK,
  and Vercel AI SDK, covering DOM listener identity, VMM lifecycle and persistent metadata ownership,
  build cleanup and resource lifetime, worker teardown and credential freshness, and Web Streams and
  error preservation.
- Turned Preflight's Java engine into a self-contained Windows/macOS/Linux desktop app with a React
  UI over a Rust/Tauri host, bundled Java runtime, durable launch/playtime history, signed updates
  with rollback, recovery tools, and package-lifecycle testing.

### IBM — Software Developer Intern

**May 2021–Aug 2022** · Toronto, Ontario, Canada

- Identified a critical RBAC flaw that required a three-team hotfix.
- Built and refactored Java end-to-end tests for IBM Cloud AI/ML and data workflows across Kafka,
  Spark, Snowflake, hybrid cloud, and on-premises environments.
- Reduced developer onboarding from **3 hours to 15 minutes** by consolidating obsolete SDK and
  runtime setup.

### Freelance Illustrator

Preserve the existing company, dates, and factual client relationship.

- Worked with clients on freelance digital illustration and character artwork.
- Portfolio: preserve the current portfolio link after verifying that it still resolves.

Remove the old `2.4k hours and counting` line.

Remove the old `Next.js — Open Source Contributor` experience entry completely.

## Projects

### Preflight

https://github.com/teamleaderleo/preflight · Jul 2026–Present

- Created an open-source cross-platform performance launcher and mod-analysis toolkit for
  Starsector; startup moved **112.17s → 13.69s** on my 83-mod M5 MacBook Air development setup
  (**87.8% less time, 8.19× speedup**).
- Profiled and instrumented an obfuscated JVM stack across the game and third-party mods, then moved
  repeated data parsing, texture work, generated-code compilation, and high-frequency runtime work
  out of the critical path.
- Showed that physical layout mattered independently of logical cache coverage: the same Compact
  texture corpus launched in **33.53s** alphabetically and **14.174s** in observed startup order.
- Turned the Java engine into a Windows/macOS/Linux desktop app with a React UI over Rust/Tauri,
  bundled Java, launch/playtime history, recovery, signed updates with rollback, and package testing.

### Glossless

https://glossless.app/

- Artist reference editor with synchronized 2D and 3D pose editing.
- Uses MediaPipe detections as editable keypoints, drives GLTF rigs from the 2D pose, and supports
  lighting and silhouette studies.
- Saves project files and reference-sheet exports; WebGL recovery keeps 2D editing usable if the 3D
  renderer fails.

### Stensibly

https://github.com/teamleaderleo/stensibly

Jul 2026–Present

- Hosted coordination system for human and agent work with durable claims, cross-session handoffs,
  exact preconditions around GitHub changes, and repository activity that can continue into email
  after workers exit.
- Built with Cloudflare Workers, Convex, REST, and MCP.

### Scrapbook / teamleaderleo.com

https://teamleaderleo.com/

- Personal site, knowledge workspace, and repository-backed publication/evidence lab.
- A maintained Next.js/React product for public work records, writing, GitHub activity, art, and
  interface experiments.

Remove or hide the remaining low-signal projects; target four visible projects.

## Skills

Pin/show first: **Rust, Java, TypeScript, Linux, React**.

Then retain the strong current set from [`skills.md`](skills.md) and make only easy removals from the
100-skill backlog.

## Education

Keep:

> University of Toronto — BSc, Mathematics, Statistics & Computer Science — 2024

Remove the SAT score and Courses section.

## Activity

Leave empty. Do not write or publish a LinkedIn post.
