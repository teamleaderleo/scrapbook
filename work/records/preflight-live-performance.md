# Preflight — live performance record

**Updated:** 2026-08-26

This is the current career-facing performance overlay for Preflight. Use this file ahead of older timing language in `preflight.md`, `portfolio-inventory.md`, and `resume-candidates.md` when the numbers conflict.

## Current headline

Preflight takes an 83-mod Starsector installation on an M5 MacBook Air from a recently observed ordinary launch of **112.17 seconds** to a retained accelerated launch of **13.69 seconds**.

That is approximately **8.19× faster**, or an **87.8% reduction in elapsed startup time**. Machine state can move individual development launches around the mid-teens while the low-usage/cool accelerated runs remain in the same low-14-second regime; that variance is useful context rather than a replacement headline.

For career-facing summaries, lead with:

> **112.17s → 13.69s on an 83-mod legacy game stack.**

The earlier roughly 101-second observed high and the old 89.00s → 15.53s same-session campaign remain benchmark history in the repository. They answer earlier measurement questions and do not outrank the current development observations simply because they were collected under different machine states or comparison protocols. A run measured with the same startup clock is a run; campaign labels describe why launches were collected, not a different class of elapsed time.

## Current product frontier

The steady-state Compact path is now roughly:

- **13.69s current career-facing endpoint**;
- **~15s preparation** on the current working path;
- **~1.1 GB retained Compact data** (the documented pack is 1,087,894,442 bytes);
- **83 enabled mods** on the current M5 MacBook Air profile;
- 15,469 prepared texture hits in the documented learned-order runs, with three ordinary source fallbacks and zero pixel-conversion fallbacks.

The preparation number is moving quickly. The August 23 committed evidence recorded 17.25s for one Compact path and 16.21s for a fresh Balanced→Compact transition; current development has moved into the ~15-second regime. Treat the newest observed preparation result as the live number on the next refresh.

## Useful numerical arc

### Startup

- Earlier retained high in the development history: roughly **101s**.
- Recent ordinary development launch: **112.17s**.
- Earlier optimized states moved through the 40s, 30s, 20s, and low-15s.
- Current career-facing endpoint: **13.69s**.
- Low-usage/cool accelerated runs remain in the same low-14-second regime; active development and machine state can move individual runs into the mid-teens.

### Preparation and storage

The pack-publication work removed a second major source of wasted time and disk use:

- Compact preparation using per-file durable intermediates: **92.30s**.
- Rebuildable intermediates with one final durable pack publication: **16.51s** in the published experiment.
- Later committed consuming-pack path: **17.25s**.
- Fresh Balanced→Compact transition: **16.21s**.
- Current working frontier: **~15s**.

Storage moved at the same time:

- old Balanced finished directory: about **4.76 GB**;
- pack-only Balanced: about **2.3 GB**;
- Compact steady state: about **1.1 GB**.

The optimization story now includes launch speed, preparation speed, and a much smaller steady-state footprint.

### Physical layout result

Logical cache coverage alone did not determine performance.

The same Compact corpus launched in **33.53s** when written alphabetically and **14.174s** when written in observed access order. Reordering an existing pack took **2.02s**.

That is a **2.37× whole-launch difference from physical ordering alone**, with the logical contents held constant. The learned-order pack retained 14,774 distinct source-image blobs covering 16,013 logical paths.

### Other high-signal component results

Keep these available when a role benefits from mechanism-level detail:

- generated Janino class-map work: **18.014s → 2.364s** direct aggregate generation time, an **86.9% reduction** in the measured pilot;
- shared cache-profile identity: **1.613s → 0.452s**;
- merged variant JSON path: **10.15× faster** in isolated measurement;
- weapon loader: **3.34×**;
- projectile loader: **2.34×**;
- ship hull loader: **3.52×**;
- roughly **1.22 GiB** of empty power-of-two texture padding removed from historical upload volume;
- a one-thread prefetch wait once accounted for roughly **27 seconds** of critical-path delay before prepared texture work could help;
- resource lookup work reached more than a million root/path combinations, with about **2.393s** isolated in repeated Java `File` construction/normalization alone;
- six overlapping prepared-artifact identity passes were reduced from **1,612.6ms → 451.6ms** while keeping the resulting identities byte-identical.

These component numbers overlap. Use them as engineering evidence, not as additive startup savings.

## Product and compatibility context

The speedup sits inside a larger desktop/tooling product:

- Java instrumentation and bytecode adapters against game/mod code Preflight does not own;
- exact compatibility identities with original-path fallback when an input is changed or unsupported;
- prepared textures, audio, JSON/data loaders, resource indexes, and generated bytecode;
- automatic profile learning and Compact cache/profile management;
- mod linting/validation and stronger error reporting;
- Tauri desktop UI with dependency/topology visualization;
- macOS, Windows, and Linux packaging/testing;
- bundled runtime, updater/rollback work, diagnostics/support tooling, and gameplay pilots.

## Career-facing usage

The shortest useful version is:

> Built a cross-platform performance and compatibility layer for an 83-mod legacy game stack, cutting observed startup from 112.17s to 13.69s (~8.19×) while shrinking the steady-state prepared footprint to ~1.1 GB and preparation to roughly 15s.

For a deeper systems/performance conversation, follow with the physical-order result, bytecode/runtime adapters, compatibility/fallback model, and investigation stories.

Run-to-run machine-state context belongs in the evidence record; it does not replace the 13.69s endpoint or the current 112.17s ordinary-launch headline. The old 89.00s → 15.53s benchmark remains in the evidence archive as historical comparison context only.