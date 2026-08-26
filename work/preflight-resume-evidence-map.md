# Preflight resume evidence map

This file is the breadcrumb index from career-facing Preflight claims back to the engineering that supports them. `resume-current.md` owns the current default resume wording. `records/preflight-live-performance.md` owns the current career-facing Preflight performance headline and moving performance numbers. This file owns provenance: which Preflight PRs, commits, evidence notes, and measurements a future editor should read before changing a claim. It is not a competing wording or headline authority.

## Source rule

Use this order when sources disagree:

1. current Preflight code and retained runtime artifacts
2. Preflight evidence notes that reconstruct the measured behavior
3. implementation PRs and commits
4. front-facing README/docs summaries
5. career copy in Scrapbook

PR descriptions are useful maps, but they are not automatically the latest measurement. Keep measurement and implementation breadcrumbs separate when the final number was established after the first implementation PR.

Umbrella integration: [Preflight PR #322 — Accelerate startup and harden mod-heavy gameplay](https://github.com/teamleaderleo/preflight/pull/322), merged as [`159e8704a048adebf932f3da89e2c7ad521a31ac`](https://github.com/teamleaderleo/preflight/commit/159e8704a048adebf932f3da89e2c7ad521a31ac). This is the broad product/integration checkpoint, not a substitute for the smaller source chain below.

## Startup headline: 101s → 13.69s

Career claim:

> Reduced startup **101s → 13.69s (86.4% less time, 7.38× speedup)** ...

Primary measurement breadcrumbs:

- [`docs/evidence/2026-08-23-storage-to-fourteen-seconds.md`](https://github.com/teamleaderleo/preflight/blob/main/docs/evidence/2026-08-23-storage-to-fourteen-seconds.md) — current storage/launch chronology, the five-run G1 condition with a **14.04s median and retained 13.69s endpoint**, Compact preparation, and the later **16.21s** fresh Compact transition.
- [PR #1078 — Recover low-15s startup and correct preparation storage](https://github.com/teamleaderleo/preflight/pull/1078) — establishes the reviewed G1 path and records the **14.04s median and 13.69s retained endpoint** plus the learned Compact pack.
- [PR #408 — Measure the numbers the beta promises](https://github.com/teamleaderleo/preflight/pull/408) — earlier same-profile campaign and first measured **200.77s** cold preparation; useful chronology, not the current 13.69 endpoint.
- [PR #322](https://github.com/teamleaderleo/preflight/pull/322) — older integrated 15.88s checkpoint and the broad set of optimizations that became the product.

`records/preflight-live-performance.md` owns the selected **101s → 13.69s** career headline. The older 89.00s → 15.53s same-profile campaign remains useful A/B evidence for the comparison question it was designed to answer; same-profile pairing does not give it editorial priority over the retained development endpoint. Change the career headline only through an explicit new decision, not by preferring one benchmark protocol over another.

## JSON/CSV memoization and typed-tree architecture

Current career story:

> Five loader-specific caches exposed the wrong abstraction boundary. Repeated JSON/CSV parsing and merging moved to a shared memoized read layer, reparsed text became typed trees, and the result was measured at both the loader and common-read boundaries.

Initial five loader-specific caches:

- [PR #275 — Narrow variant cache profile validation](https://github.com/teamleaderleo/preflight/pull/275)
- [PR #278 — Cache merged weapon definition JSON](https://github.com/teamleaderleo/preflight/pull/278)
- [PR #281 — Cache merged projectile JSON](https://github.com/teamleaderleo/preflight/pull/281)
- [PR #284 — Cache merged ship hull JSON](https://github.com/teamleaderleo/preflight/pull/284)
- [PR #288 — Cache merged campaign rules CSV](https://github.com/teamleaderleo/preflight/pull/288)

The cumulative phase result **SpecStore 19.8s → 9.8s** is reconstructed in [`docs/evidence/2026-08-03-spec-store-is-no-longer-a-reading-problem.md`](https://github.com/teamleaderleo/preflight/blob/main/docs/evidence/2026-08-03-spec-store-is-no-longer-a-reading-problem.md). That note also records the individual cache seams and what remained afterward.

Move to the common mod-facing boundary:

- [PR #307 — Read each JSON path once per launch](https://github.com/teamleaderleo/preflight/pull/307), merged as [`41321b9a8af1e3b3fff62f75d4528b400fd81c1b`](https://github.com/teamleaderleo/preflight/commit/41321b9a8af1e3b3fff62f75d4528b400fd81c1b)
  - **39,017 JSON calls / 8,378 distinct paths**
  - **78.5%** repeated paths
  - **1,618,401 filesystem probes**, 42.6 per JSON call
  - common-loader sample launch **84.49s → 73.54s**
  - mod callbacks **23.97s → 15.46s** on that stock-mod probe

Decision not to build a sixth loader cache:

- [PR #312 — SpecStore is no longer a reading problem](https://github.com/teamleaderleo/preflight/pull/312), merged as [`7205bdacc0ffb507b3607783c0271852074c60bf`](https://github.com/teamleaderleo/preflight/commit/7205bdacc0ffb507b3607783c0271852074c60bf)
  - identifies the **two merged-reader methods** every merged JSON/CSV overload reaches
  - measures **2,366 calls / 2.86s** of merged reading left across the whole launch
  - explicitly argues for one general cache instead of another pinned loader

General cache and typed representation:

- [PR #314 — Cache all merged data reads](https://github.com/teamleaderleo/preflight/pull/314), merged as [`f9314661d7850078cc0bd1b5d83d08243cab55f7`](https://github.com/teamleaderleo/preflight/commit/f9314661d7850078cc0bd1b5d83d08243cab55f7)
  - merged-read seam **2.1715s → 0.3000s**
  - production tagged-tree fidelity corpus **12,584 objects / 990,602 recursively compared values**
  - one general artifact below the per-spec caches
  - evidence: [`docs/evidence/2026-08-04-merged-read-cache-launch.md`](https://github.com/teamleaderleo/preflight/blob/main/docs/evidence/2026-08-04-merged-read-cache-launch.md)
- [PR #316 — Decode spec caches from tagged JSON trees](https://github.com/teamleaderleo/preflight/pull/316), merged as [`f63303d4799a306cdb12ea74d22195ba8441368e`](https://github.com/teamleaderleo/preflight/commit/f63303d4799a306cdb12ea74d22195ba8441368e)
  - replaces text reparsing in the four prepared spec JSON caches with the same typed representation
  - rehydration seam **394ms → 132/134ms**
  - evidence: [`docs/evidence/2026-08-04-tagged-spec-json.md`](https://github.com/teamleaderleo/preflight/blob/main/docs/evidence/2026-08-04-tagged-spec-json.md)

Important shorthand boundary: “turned five caches into one” describes the architectural convergence, not the literal deletion of every upper cache. The final design still has upper domain caches, with shared work moved down into common tagged-tree/full-data infrastructure.

## Texture runtime: serialized prefetch and VRAM padding

Current career story:

> The first texture cache sat on the wrong side of the real bottleneck. Move the cache decision ahead of the serialized prefetch queue, then remove waste in the upload path.

Breadcrumbs:

- [`609b27d4676b93582ea6d2a3f90bbbd706befc35`](https://github.com/teamleaderleo/preflight/commit/609b27d4676b93582ea6d2a3f90bbbd706befc35) — moves the prepared-texture decision before the game's single-threaded prefetch queue.
- [`docs/optimization-history.md`](https://github.com/teamleaderleo/preflight/blob/main/docs/optimization-history.md) — chronology containing the accepted **88.13s → 62.60s** texture/prefetch step and subsequent texture-path work.
- [`docs/evidence/2026-08-02-the-padding-is-gone.md`](https://github.com/teamleaderleo/preflight/blob/main/docs/evidence/2026-08-02-the-padding-is-gone.md) — live full-load proof for **1.22 GiB of VRAM padding removed**.
- [PR #799](https://github.com/teamleaderleo/preflight/pull/799) is later integrity work that preserves the already-measured source-hash win without restoring per-hit SHA. It is useful if the resume ever mentions the **6.68s** source-hashing CPU removal, but it is not the origin of the prefetch result.

## Third-party startup callbacks

Current career story:

> Removed **>12s of startup work across three third-party mod callbacks** by memoizing repeated hull/variant reads, deduplicating and replaying unresolved generated-texture requests, and caching rebuilt paintjob catalogs.

The components are deliberately separate from the common-loader memo above:

- AshLib repeated ship JSON: **7.066–7.435s removed**
  - evidence: [`docs/evidence/2026-08-02-ashlib-startup-json-cache.md`](https://github.com/teamleaderleo/preflight/blob/main/docs/evidence/2026-08-02-ashlib-startup-json-cache.md)
  - evidence/implementation commit: [`b3397db8a3c41753c64ce285c9bab4122f427803`](https://github.com/teamleaderleo/preflight/commit/b3397db8a3c41753c64ce285c9bab4122f427803)
- GraphicsLib compact generated-state replay: **4.821s removed** at the retained component boundary
  - source-side measurement: [`docs/evidence/2026-08-02-graphicslib-compact-autogen-replay.md`](https://github.com/teamleaderleo/preflight/blob/main/docs/evidence/2026-08-02-graphicslib-compact-autogen-replay.md)
  - non-invasive delivery: [PR #318 — Deliver GraphicsLib compact replay through the exact adapter](https://github.com/teamleaderleo/preflight/pull/318)
  - integrated live evidence: [`docs/evidence/2026-08-04-graphicslib-compact-replay-adapter-live.md`](https://github.com/teamleaderleo/preflight/blob/main/docs/evidence/2026-08-04-graphicslib-compact-replay-adapter-live.md)
- MagicLib paintjob catalog: **0.65s → 0.05s** at the catalog boundary, **0.88s → 0.25s** for the plugin callback
  - [PR #1083 — Cache MagicLib paintjob catalog](https://github.com/teamleaderleo/preflight/pull/1083)
  - evidence: [`docs/evidence/2026-08-23-magiclib-paintjob-catalog-cache.md`](https://github.com/teamleaderleo/preflight/blob/main/docs/evidence/2026-08-23-magiclib-paintjob-catalog-cache.md)

[`28b7032fb4460036ac19433f534819771fda891c`](https://github.com/teamleaderleo/preflight/commit/28b7032fb4460036ac19433f534819771fda891c) records that the AshLib + GraphicsLib source-side changes together account for **11.89–12.26s**. Adding the later isolated MagicLib catalog reduction supports the resume-safe `>12s` wording. Do not add PR #307's common-loader improvement on top of this as another callback total; it overlaps the same mod work from a lower boundary.

## In-game campaign runtime

Recommended career wording:

> Removed repeated O(n) scans and allocations from campaign simulation by replacing sector-wide entity lookup scans with mutation-tracked indexes (**227,805 full-list validations → 0, 79.1M entity-reference checks → 0**), short-circuiting **117.9M unchanged commodity recomputations**, and skipping defensive list copies on **15.4M empty script calls**.

### Entity lookup index

Implementation starts here:

- [PR #266 — Add a fail-closed campaign entity lookup index](https://github.com/teamleaderleo/preflight/pull/266)
- implementation commit [`d561a29cfc53126b2f35986708fcabd2375719f7`](https://github.com/teamleaderleo/preflight/commit/d561a29cfc53126b2f35986708fcabd2375719f7)
- [PR #321 — Report campaign entity-index activity after each run](https://github.com/teamleaderleo/preflight/pull/321) makes the live use measurable.

Final measurement lives in [`docs/evidence/2026-08-02-a-failed-lookup-scans-the-sector.md`](https://github.com/teamleaderleo/preflight/blob/main/docs/evidence/2026-08-02-a-failed-lookup-scans-the-sector.md):

- original late-save model: one failed lookup **1.486ms**, about 9% of a 16.7ms frame
- first save/combat v3 pilot after the initial mutation-tracking implementation: **227,805 deep validations** walking **79,131,653 entity references**
- repaired next live pilot: **229,924 fast validations, 0 deep validations, 0 validated references**, while tracking **74,751 live list mutations**

The total number of lookups is not identical between the two adjacent pilots, so career copy should use the work that actually went to zero: **227,805 full-list validations → 0** and **79.1M reference checks → 0**. Do not write `227,805 calls → 0 calls`; the lookups still happen and are answered through the index.

### Economy, markets, and defensive snapshots

[`docs/evidence/2026-08-05-campaign-engine-call-times.md`](https://github.com/teamleaderleo/preflight/blob/main/docs/evidence/2026-08-05-campaign-engine-call-times.md) is the main campaign attribution spine:

- one run: **2,120,837 market advances / 15,109.8ms**
- later drill-down: **1,072,831 market advances / 9,924.5ms**
- **483,766,272 commodity-stat accesses** and **120,941,568 event-mod accesses** inside those market advances
- campaign maintenance: **15,402,921 empty** script lists out of 15,689,139 calls, so the rewrite avoids the defensive snapshot on **98.176%** of calls

Commodity memoization is reconstructed in [`docs/evidence/2026-08-05-commodity-event-mod-campaign-hotspot.md`](https://github.com/teamleaderleo/preflight/blob/main/docs/evidence/2026-08-05-commodity-event-mod-campaign-hotspot.md):

- early live memo: 15,970,331 unchanged hits / 197,095 delegations
- refined paths progressively remove validation work
- final retained v4 live profile: **117,907,677 unchanged memo hits / 223,330 real-state delegations**

The campaign work is integrated under [PR #322](https://github.com/teamleaderleo/preflight/pull/322). There is no controlled before/after FPS result for the final campaign optimizations. Keep the operation-count reductions; do not infer or advertise an FPS delta.

## Preflight texture-cache preparation and physical layout

Current career story:

> Remove needless durability boundaries, stream rebuildable intermediates into one final pack, then tune physical layout from observed access order.

Breadcrumbs:

- [PR #408](https://github.com/teamleaderleo/preflight/pull/408) — first measured cold preparation **200.77s** and **4.76 GB** Balanced cache.
- [PR #1079 — Cut texture preparation time and add Compact storage](https://github.com/teamleaderleo/preflight/pull/1079)
  - Compact per-file durable intermediates **92.30s → 16.51s**
  - Balanced **198.56s → 44.62s**
  - explains that thousands of rebuildable files were being forced before the final pack
- [PR #1080 — Halve texture preparation disk requirement](https://github.com/teamleaderleo/preflight/pull/1080) — current streaming/publication path and disk requirement.
- [PR #1078](https://github.com/teamleaderleo/preflight/pull/1078) and [`docs/evidence/2026-08-23-storage-to-fourteen-seconds.md`](https://github.com/teamleaderleo/preflight/blob/main/docs/evidence/2026-08-23-storage-to-fourteen-seconds.md)
  - final retained Compact storage ~**1.1 GB**
  - fresh Balanced → learned Compact transition completes at **16.21s**
  - same Compact logical corpus: **33.53s** alphabetical vs **14.174s** observed access order
- earlier physical-order implementation commit: [`c38272ecc107ff6283c0956ba581fb545523ac28`](https://github.com/teamleaderleo/preflight/commit/c38272ecc107ff6283c0956ba581fb545523ac28)

Keep **200.77s → 16.21s** as the career-facing preparation arc only while the endpoint remains supported by the retained fresh transition. The intermediate PR #1079 numbers explain the mechanism; they are not the final resume endpoint.

## Generated bytecode / Janino

Current career story:

> First remove repeated compilation, then normalize the cache after discovering that almost every persisted class was duplicated across requests.

Compiler-cache layer:

- [PR #319 — Reuse exact Janino generated bytecode maps](https://github.com/teamleaderleo/preflight/pull/319), merged as [`3c42c77aded36d09aefd98f6aaef776924aa400c`](https://github.com/teamleaderleo/preflight/commit/3c42c77aded36d09aefd98f6aaef776924aa400c)
- evidence: [`docs/evidence/2026-08-04-janino-bytecode-live-pilot.md`](https://github.com/teamleaderleo/preflight/blob/main/docs/evidence/2026-08-04-janino-bytecode-live-pilot.md)
- **228 requests**, cold **18.014s**, warm **2.364s**
- same live pair whole launch **34.83s → 29.46s**

Representation layer:

- implementation/evidence commit [`31d4409250a74e350d6e3470ff5cc032aa0dd927`](https://github.com/teamleaderleo/preflight/commit/31d4409250a74e350d6e3470ff5cc032aa0dd927)
- evidence: [`docs/evidence/2026-08-05-janino-deduplicated-pack.md`](https://github.com/teamleaderleo/preflight/blob/main/docs/evidence/2026-08-05-janino-deduplicated-pack.md)
- **36,332 generated-class occurrences / 149,732,372 expanded bytecode bytes**
- only **280 unique classes / 1,006,460 unique bytecode bytes**
- persisted storage **145.96 MiB → 1.13 MiB**
- exact warm replay **1.501s → 29ms**

Earlier substrate/history if an interview asks how the live cache was made safe: PRs [#56](https://github.com/teamleaderleo/preflight/pull/56), [#58](https://github.com/teamleaderleo/preflight/pull/58), [#63](https://github.com/teamleaderleo/preflight/pull/63), and the unified evidence collector [#84](https://github.com/teamleaderleo/preflight/pull/84).

## Desktop productization

Current career story:

> Turned the Java performance engine into a self-contained Windows, macOS, and Linux desktop app with a React UI over a Rust/Tauri native host, bundled Java runtime, durable launch/playtime history, locally traced ship wireframes from installed game data, profile management, and signed updates with rollback.

Architecture and packaging:

- [`preflight-desktop/README.md`](https://github.com/teamleaderleo/preflight/blob/main/preflight-desktop/README.md) — current architecture: React renders the UI, the narrow Rust/Tauri host owns native/process operations, the browser layer has no shell/filesystem permission, and the package carries the Java engine plus a platform-native `jlink` runtime.
- [PR #322](https://github.com/teamleaderleo/preflight/pull/322) — broad integration checkpoint for the Java engine, desktop host, native distribution, recovery, diagnostics, and update path.
- [`docs/releases/0.1.0.md`](https://github.com/teamleaderleo/preflight/blob/main/docs/releases/0.1.0.md) — current product contract for profiles/settings, playtime/history, storage/recovery, native packages, signed updates/rollback, and package evidence.

Durable playtime/history:

- [`preflight-cli/src/main/java/dev/starsector/preflight/cli/Playtime.java`](https://github.com/teamleaderleo/preflight/blob/main/preflight-cli/src/main/java/dev/starsector/preflight/cli/Playtime.java) — playtime is derived from launch-ledger durations rather than stored as a second mutable counter; incomplete sessions and non-game launch attempts remain distinguishable.
- [PR #485 — Make playtime history durable and truthful](https://github.com/teamleaderleo/preflight/pull/485) — serializes ledger/history work across threads/processes and preserves incomplete-session semantics.
- [PR #488 — Show durable playtime in the desktop](https://github.com/teamleaderleo/preflight/pull/488) — brings the ledger-derived lifetime total into the native UI.
- [PR #541 — Make launch history and failed-run support durable](https://github.com/teamleaderleo/preflight/pull/541), integrated in commit [`94b64a108ba60c8069e9f85c6942381e071db364`](https://github.com/teamleaderleo/preflight/commit/94b64a108ba60c8069e9f85c6942381e071db364) — process-bound heartbeat/recovery keeps history useful when the wrapper or machine is interrupted.
- [PR #809 — Export portable play history](https://github.com/teamleaderleo/preflight/pull/809) — versioned read-only JSON/CSV history export without exposing run paths/logs/credentials.

Locally derived Hangar:

- [`987745237651bc4a338ccf9768e02c540b4b1bce`](https://github.com/teamleaderleo/preflight/commit/987745237651bc4a338ccf9768e02c540b4b1bce) — Hangar work converges on tracing the player's installed hull sprites/data at runtime rather than shipping a baked proprietary-art-derived catalog; the commit history explicitly removes a 7,112-line generated artifact once the runtime tracer can derive it locally.
- [`docs/public-writing-sales-inventory.md`](https://github.com/teamleaderleo/preflight/blob/main/docs/public-writing-sales-inventory.md) — current product framing: installed hull definitions and sprites are traced locally into bounded wireframe contours/interior geometry so the app visually belongs beside the game without bundling its art.

Responsiveness and footprint boundaries:

- [PR #1104 — Show Home before background maintenance](https://github.com/teamleaderleo/preflight/pull/1104) — validates the remembered installation through a quick snapshot first and moves automatic cache/evidence housekeeping out of the opening interaction window. This supports an engineering claim about prioritizing interaction latency, not a numeric startup-speed claim.
- No retained current-package measurement in this map establishes a **~200 MB desktop RSS** figure. Do not put that number on the resume until an exact package/process-set measurement is captured and its accounting boundary is defined.
- Likewise, prefer concrete architectural/product evidence over adjectives such as `snappy`, `lightweight`, or `fast` unless a desktop-specific measurement is retained.

The built-in before/after benchmark is useful product functionality, but it does not currently earn resume space over durable playtime/history, locally derived Hangar geometry, self-contained packaging, or signed update/rollback.

Treat this as a product-ownership claim, not a released-binary claim. Check current release status before changing `public open source` to stronger distribution wording.

## Linter / source-side ecosystem analysis

Current career story:

> The runtime investigation also became source-side tooling that identifies expensive or broken third-party assets/configs without rewriting them.

Breadcrumbs:

- [`docs/asset-lint.md`](https://github.com/teamleaderleo/preflight/blob/main/docs/asset-lint.md) — canonical rule set and reviewed profile totals.
- [PR #216 — lint calibration across 86 mods](https://github.com/teamleaderleo/preflight/pull/216), merged as [`731868018f5760ef09655d402e29383856bb0147`](https://github.com/teamleaderleo/preflight/commit/731868018f5760ef09655d402e29383856bb0147)
- current reviewed-profile receipts in `asset-lint.md`: **1,392 findings across 84 roots**, **771.9 MB VRAM padding**, **687.9 MB decoded at load**, **100.8 MB disk**, **four broken released configs**, progressive textures **8.75×** slower to decode.

Calibration counts are evidence quality, not resume lead material.

## Maintenance checklist

When a Preflight career claim changes:

1. if current default resume wording changes, update `resume-current.md` first; use `resume-candidates.md` for alternates and reservoir material;
2. if the current Preflight performance headline or a moving performance number changes, update `records/preflight-live-performance.md` first;
3. update this file when the claim, endpoint, implementation chain, or source authority changes;
4. update any current public or review projection that would otherwise show stale provenance; do not hard-code an old PR as a permanent synchronization target;
5. if Preflight itself changes the implementation, re-read current code and retained artifacts before trusting an older evidence note;
6. never infer an FPS result from campaign operation counts or an end-to-end launch result by adding component savings from different runs.