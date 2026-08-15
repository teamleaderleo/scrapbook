# Preflight

Primary repository: https://github.com/teamleaderleo/preflight

Preflight is the strongest current independent-engineering story because it combines deep investigation, runtime modification, performance engineering, compatibility design, benchmarking, packaging, and a path to real users.

This record intentionally stores more detail than any one-page resume should use.

## Current headline

The strongest current before/after evidence is the 2026-08-15 controlled 83-mod campaign now carried in Preflight PR #440:

- **89.00s baseline median**;
- **15.53s accelerated median**;
- five accepted runs per condition;
- conditions interleaved in one session;
- no exclusions;
- exact same 83-mod profile for both conditions.

That is the comparison to lead with when the claim/update candidate is published. It replaces the old temptation to present chronological endpoints from different development states as one before/after experiment.

The earlier reviewed 83-mod development profile also recorded:

- 16.66s cold;
- 16.28s warm;
- **15.88s warm gate**.

At that 15.88s gate, the run retained:

- 42/42 transformed-class cache hits;
- all 15,469 prepared texture/pixel-conversion hits;
- active adapter health;
- zero adapter declines or contained failures.

Earlier accepted development states reached roughly 101s, while the historical 88.13s median belonged to a 77-mod profile rather than the later 83-mod profile. Those values remain useful chronology, **not** the preferred before/after comparison.

Current controlled-claim packet: https://github.com/teamleaderleo/preflight/pull/440

Current optimization/product record: https://github.com/teamleaderleo/preflight

## Why the project is technically interesting

Preflight does not replace Starsector's live object model or edit the installation. It prepares deterministic work before launch and intercepts only exact runtime seams whose source identity and bytecode contract are known.

Behavioral adapters pin combinations of:

- game/mod archive or source identity;
- class bytes / class signature;
- class loader;
- method descriptors and expected bytecode shape;
- cache/input policy identity.

A changed or unsupported build declines the optimization and runs the original implementation. Runtime transformations happen only in the child JVM's memory.

This turns performance work into a compatibility problem: every shortcut has to answer both "is this work expensive?" and "what exact evidence makes reusing its answer valid?"

## Investigation stories

### The cache that sat behind a 27-second wait

An early prepared-pixel cache was technically valid but improved startup by only about 1.5%, despite profiles suggesting texture work was far larger.

Instead of assuming the cache implementation was too slow, the project added a critical-path discriminator. The loading thread was spending roughly **27 seconds waiting on a one-thread prefetch queue before the cache could help**.

Moving the intervention to the correct side of that wait turned essentially the same prepared work into the accepted ~29% startup campaign.

This is a strong story because the first implementation was not discarded for being "bad"; measurement showed it was placed behind the real critical-path owner.

### The graphics-driver bottleneck that was not a graphics-driver bottleneck

Log-gap attribution made the texture block look like roughly 13–18 seconds of graphics work.

Preflight built `SeamTimer` to measure entry→exit and exit→next-entry on the actual resource seam instead of charging silent intervals to whichever logger ran last.

On a representative run the seam showed more than 21,000 texture calls and exposed long between-call gaps that contained no texture work. A separate replay through the game's own LWJGL path showed the launch's texture uploads consumed only about **1.15 seconds of graphics-driver time**.

That result killed attractive plans around GL batching and reframed power-of-two padding as primarily a memory/VRAM concern instead of the big startup-time prize.

The instrumentation was built to permit the hypothesis to lose.

### The filesystem syscall that was mostly path construction

Resource resolution walked up to 84 mod roots. A launch could perform well over a million root/path combinations.

After caching directory listings, substantial time remained. Replay isolated approximately **2.393 seconds in repeated `new File(root, path)` construction/normalization alone** across 1,185,072 joins, with less time in the actual remembered-listing lookup and syscalls.

The final intervention moved one level up, where root and relative path were still separate, allowing direct indexed lookup without repeatedly constructing normalized `File` objects.

### The optimization that broke case-insensitive filesystem semantics

A remembered-directory lookup initially compared filenames as strings. That made valid Starsector resources disappear on normal case-insensitive macOS/Windows filesystems when the requested spelling differed from the stored spelling.

The correction preserved exact hits and exact misses cheaply, but delegated the narrow folded-name ambiguity back to `File.exists()`, the filesystem authority for that mount.

The measured profile required the expensive ambiguity check for only a tiny number of probes while restoring parity with the game's real resolver.

### The 600ms-looking command cache that saved ~165ms

Rule-command lookup walked a declared package list until `Class.forName()`/instantiation found a winner. It looked like hundreds of milliseconds of failed classpath search.

A prepared package map removed most of those probes but recovered only about **165ms**. Measurement showed the successful class load/verification/initialization dominated; failures were cheap.

The same investigation exposed a larger cost outside the game: six independent prepared-artifact caches were rebuilding overlapping dependency identities before the JVM launched.

That led to a shared identity pass reducing launcher-side identity work from **1,612.6ms to 451.6ms** while keeping all six resulting identities byte-identical.

### The digest memo that was deliberately not built

A per-file hash memo keyed by path/size/mtime looked like an obvious next optimization.

After parallelization, measuring first showed the memo was worth only about **65ms**, while weakening detection of same-size content changes. The project kept full content hashing and removed duplicated passes instead.

Useful interview story: optimization was rejected because the speed/safety trade did not clear the bar.

### Audio: move pure decode, not unsafe shared state

The game decoded roughly 2,099 Ogg Vorbis assets (about 140.7 MB encoded, 1.23 GB PCM) through a two-thread pool. The main thread eventually blocked waiting for the workers.

Widening the pool was rejected because each task also touched OpenAL and an unsynchronized map.

Preflight instead isolated the pure decoder seam, prepared exact decoded results outside the timed launch, and left the game's OpenAL ownership and worker topology intact.

The prepared cache keys the exact encoded input/decoder policy and falls through to the original decoder when evidence does not match.

### Janino generated bytecode

Starsector/mod startup generates Java classes through Janino. Preflight built a complete generated-class-map cache rather than treating individual class bytes independently.

The context identity covers compiler/version inputs, ordered source/archive inputs, classpath, JVM modules, parent loader, debug settings, and protection-domain policy.

A live 89-mod pilot reported:

- cold: 228 misses/stores, 18.014s direct aggregate;
- warm: 228 hits, 2.364s direct aggregate;
- **15.650s / 86.9% reduction in direct aggregate generation time**;
- zero errors, corruptions, or policy declines in the measured pair.

Whole-launch movement in that pilot was smaller, which is itself useful: direct component savings and critical-path launch savings are kept conceptually separate.

Canonical packet: https://github.com/teamleaderleo/preflight/pull/319

## Metrics bank

Use only metrics whose measurement boundary fits the claim being made.

### Current / headline candidates

- **89.00s baseline → 15.53s accelerated** on the same 83-mod profile in one interleaved session, five accepted runs per condition, no exclusions (2026-08-15 campaign candidate).
- Earlier 83-mod gates include 16.66s cold, 16.28s warm, and a 15.88s warm record with 42/42 transformed-class hits and 15,469/15,469 prepared texture/pixel-conversion hits.
- Earlier accepted launches reached roughly 101s, but that is chronology rather than the controlled baseline for the 15.53s result.
- The historical 88.13s five-run median came from a 77-mod profile and should not be mislabeled as the later 83-mod baseline.

### Historical composed campaign

An earlier main-branch campaign measured:

- 80.09s baseline;
- 42.36s full Preflight;
- 37.74s removed / 47.1%;
- 1.89× overall.

Fifteen unattended launches were run: five per condition, conditions interleaved each round, all accepted.

This remains good evidence for benchmarking discipline, even though it is no longer the fastest/current build.

### Repeated work

Historical measured scorecards include approximately:

- 64,739 direct cache or memo hits;
- 192,089 operations removed or shortcut;
- 50,879 texture prefetch enqueues skipped;
- 64,956 image decode/pixel conversion/color calculations bypassed;
- 11,690 merged spec values served;
- 30,726 rule tokenizations memoized;
- 21,059 repeated duplicate scans replaced by hash checks;
- 671 command-package resolutions prepared;
- 12,103 real-path resolutions avoided.

These numbers are useful as texture, not as a resume-number wall.

### Resource / memory

Historical texture work reduced upload volume from approximately:

- 3.65 GiB → 2.43 GiB;
- **1.22 GiB of empty power-of-two padding removed**.

### Loader examples

Historical isolated loader measurements include:

- merged variant JSON: 10.15× faster merge/parse;
- weapon data: 3.34× faster loader;
- projectile data: 2.34× faster loader;
- ship hull data: 3.52× faster loader;
- shared cache-profile identity: 1.613s → 0.452s / 3.57×;
- AshLib callback work reduced by multiple seconds;
- GraphicsLib compact replay reduced a measured callback by multiple seconds.

Do not combine isolated component multipliers as if they were independent end-to-end speedups.

## Runtime / bytecode engineering bank

Potential resume language can draw from:

- Java instrumentation agent and `ClassFileTransformer` path;
- exact source/class-loader/bytecode-shape gates;
- preserving untouched original implementations as fallback;
- generated Janino bytecode-map persistence and exact context identity;
- ASM-style transformation plans against obfuscated game/mod classes;
- JFR collection and attribution;
- seam-level timing and exact critical-path probes;
- adapter health reporting after each run;
- source-history/boundary audits across thousands of blobs/files.

The important point is not "used bytecode" as jargon. It is that Preflight safely intervenes in code it does not own while explicitly defining when the intervention is valid and when it must decline.

## Productization bank

Current work has crossed beyond a benchmark harness.

The development branch includes:

- CLI plus Tauri desktop host;
- Launch, Prepare, Profiles, Storage, diagnostics, and tracked launch flows;
- macOS arm64 DMG;
- Windows x64 NSIS;
- Linux x64 Debian and AppImage packages;
- bundled minimal Java runtime;
- checksum manifests;
- update signing pipeline and isolated update/rollback tests;
- explicit settings write boundaries and backups;
- support ZIP generation with bounded allowlists/size limits/redaction;
- opt-in diagnostics intake through a hostile-input-validating Worker and private R2 retention/deletion flow;
- gameplay pilots across startup, save loading, campaign navigation, simulator/refit, large combat, retreat, audio transitions, and shutdown.

For career signal, this matters because it changes Preflight from "private performance experiment" toward "software distributed into uncontrolled user environments."

## Mod linter / secondary evidence

The same codebase contains read-only analysis tooling. Historical profiles found examples including:

- progressive JPEGs decoding 8.75× slower through the game's ImageIO path;
- avoidable texture/audio allocation;
- duplicate/shadowed resources;
- unused assets;
- extension mismatches;
- configuration placed where the game never reads it.

This is probably portfolio/interview material rather than scarce resume space.

## Strong resume story families

The final resume should not try to fit every metric. Strong composite families are:

### 1. Outcome + product

Controlled same-profile launch result, scale of the mod profile, and distribution/productization.

### 2. Runtime compatibility engineering

Exact-gated Java-agent transformations, generated bytecode/data preparation, and original-path fallback under source drift.

### 3. Investigation discipline

Critical-path instrumentation repeatedly disproved attractive first theories and redirected effort to the true bottleneck: queue wait, resource walks/path construction, duplicated identity work, generated-code compilation, etc.

A general resume can probably spend three dense bullets / roughly six lines here. A Valve/performance-oriented resume can spend more.

## Candidate prose, intentionally overcomplete

These are ingredients, not final resume bullets.

- Built a Java-agent performance layer for an 83-mod Starsector installation; a controlled interleaved campaign measured main-menu startup at 89.00s baseline versus 15.53s accelerated across five accepted runs per condition with no exclusions.
- Precompute and replay merged game/mod data, textures, audio, resource indexes, and Janino-generated class maps only when exact input/compiler/archive identities match; unsupported or changed builds automatically execute the original implementation.
- Built JFR, seam-level timing, unattended A/B campaigns, loader probes, and exact replay harnesses that repeatedly overturned initial bottleneck theories and redirected optimization toward critical-path work rather than profiler/log volume.
- Reduced Janino generated-class-map work 18.014s → 2.364s (86.9%) in a live 89-mod cold/warm pilot with 228/228 warm cache hits and zero corruption/policy declines.
- Eliminated over a GiB of empty texture padding in a historical full load while preserving upload-ready pixels and original OpenGL ownership.
- Reworked resource resolution after tracing more than a million root/path joins and discovering that path construction/normalization, not only filesystem syscalls, dominated the remaining resolver cost.
- Shipped the engine behind a Tauri desktop app with multi-platform beta artifacts, signed-update/rollback machinery, opt-in bounded diagnostics, and explicit fail-safe compatibility reporting.

## Open verification / release notes

The 2026-08-15 campaign now supplies the clean same-profile controlled comparison that the record previously lacked. Before turning it into the final release/package claim, preserve the exact evidence boundary already recorded in the candidate:

- exact game build;
- exact enabled-mod profile/order;
- machine/hardware;
- cold/warm definition;
- sample count and interleaving;
- baseline and optimized distribution;
- accepted/rejected run rules;
- adapter health / activation evidence.

The current claim candidate records the same 83-mod profile, one sitting, five accepted runs per condition, interleaving, and zero exclusions. A later hosted release candidate should rerun or explicitly bind the packaged artifact before claiming that the distributed binary has the same measured result.
