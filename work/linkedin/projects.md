# Projects

Keep these four projects, in this order. Remove or hide the remaining low-signal project entries.

## Preflight

**Link:** https://github.com/teamleaderleo/preflight

**Dates:** Jul 2026–Present

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

## Glossless

**Link:** https://glossless.app/

- Artist reference editor with synchronized 2D and 3D pose editing.
- Uses MediaPipe detections as editable keypoints, drives GLTF rigs from the 2D pose, and supports
  lighting and silhouette studies.
- Saves project files and reference-sheet exports; WebGL recovery keeps 2D editing usable if the 3D
  renderer fails.

## Stensibly

**Link:** https://github.com/teamleaderleo/stensibly

- Hosted coordination system for human and agent work with durable claims, cross-session handoffs,
  exact preconditions around GitHub changes, and repository activity that can continue into email
  after workers exit.
- Built with Cloudflare Workers, Convex, REST, and MCP.

## Scrapbook / teamleaderleo.com

**Link:** https://teamleaderleo.com/

- Personal site, knowledge workspace, and repository-backed publication/evidence lab.
- A maintained Next.js/React product for public work records, writing, GitHub activity, art, and
  interface experiments.
