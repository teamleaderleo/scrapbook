# Scrapbook Design Guide

This file records the design rules that have survived repeated revisions. Dated notes in `docs/interface-memory/` preserve the longer history, abandoned directions, and experiments.

## The place

Scrapbook is a personal workshop with distinct rooms:

- **Home** is a foyer and instrument panel.
- **Space** is a workbench and reference console.
- **Time** is a calibrated dial.
- **Gallery** is a pinboard and back room where scraps accumulate.
- **Agent check-ins** are signed field notes tied to real repository work.

The ordinary interface stays immediate and dependable. Selected objects receive tactile, material behaviour. Gallery and laboratory surfaces may become strange.

## Browser behaviour stays native

- Use natural document scrolling.
- Compose common desktop views densely enough to fit comfortably while preserving zoom, large text, short windows, and mobile browser chrome.
- Start pointer capture after drag intent is clear.
- Keep keyboard focus visible and restore it when overlays close.
- Preserve the current page and useful data through navigation, refreshes, and recoverable failures.

## Motion describes an object

Animation should imply material or action:

- keycaps compress and release;
- split flaps rotate around hinges;
- tape lifts at an edge;
- heavy panels settle with weight;
- paper tags move lightly;
- jelly deforms locally and carries momentum through neighbouring points.

Use a small motion vocabulary:

| Family | Typical duration | Use |
| --- | ---: | --- |
| Press | 80–120 ms | Click, tap, or key acknowledgement |
| Reveal | 180–260 ms | Menus, labels, and details |
| Mechanical | 250–500 ms | Flaps, hinges, toggles, and drawers |
| Material simulation | Frame-driven while active | Explicit tactile experiments |
| Ambient | Rare and slow | Expressive gallery or theme surfaces |

Pause ambient and simulated motion while hidden. `prefers-reduced-motion` must leave every state legible and usable.

## Materials have jobs

### Machined metal

Counters, hinges, calibrated controls, and status. Tight travel, restrained reflection, weighted settling.

### Rubber and keycaps

High-frequency actions, grading controls, and shortcuts. One- or two-pixel compression with a quick release.

### Paper, tape, and card

Gallery entrances, annotations, agent notes, provenance, and temporary-looking objects. Slight rotation, imperfect alignment, lifted corners.

### Smoked acrylic

Depth and enclosure. Prefer tint and edge reflection over broad blur. Give text an opaque local backing whenever translucency lowers clarity.

### Jelly, gel, and slime

Explicit playful surfaces and the tactile lab. Keep primary navigation, text, and predictable controls stable.

## Loading and refreshes

- Keep the previous successful view visible while fresh content resolves.
- Prefetch likely navigation targets from hover, focus, visibility, and pointer intent.
- Use an accurate destination shell only when it closely matches the rendered page.
- Share upstream caches across viewers.
- Deduplicate in-flight work.
- Refresh on focus when the current snapshot is due.
- Retain stale data during upstream failures and apply backoff.
- Expose enough timestamps, source information, request IDs, and cache metadata to diagnose behaviour.

## Dense inspection surfaces

Neighbouring hover targets should behave as one continuous inspection area.

- Mount one tooltip controller for a dense grid.
- Update content while crossing cells.
- Add a brief exit grace period around the complete area.
- Keep pointer and keyboard placement independent.
- Use a selected readout or anchored popover on touch.
- Avoid click-induced tooltip jumps.

## Gallery and agent work

The gallery may overlap, rotate, collect residue, and feel unofficial. Every artifact still carries inspectable provenance.

Agent check-ins follow `docs/agent-check-ins.md` and may include a codename, insignia, local WebP, repository, runtime, and source link. Whimsy belongs in the presentation; repository and commit evidence stays literal.

Future automated publishing should use narrow signed credentials or repository workflows, with an approval path and machine-readable records. General database credentials stay out of contributing agents.

## Space

Space should keep the working context available while the central content moves.

- Centralise shortcuts in one registry and generate the `?` reference from it.
- Persist selected item, review state, editor state, and relevant URL state.
- Keep desktop side tools accessible around a naturally scrolling centre.
- Use explicit mobile sheets and bottom actions.
- Model-generated companion solutions retain prompt, restatement, solution, complexity, tests, ambiguity notes, model, time, source, and revision history.

## Tactile laboratory

Keep simulation isolated from ordinary route bundles.

- Dynamically import the lab.
- Use an existing rigid-body layer for walls and ordinary collisions.
- Add a deliberately small particle-and-constraint layer for deformable bodies.
- Step physics at a fixed interval with a capped accumulator.
- Pause while hidden or outside the viewport.
- Keep per-frame state outside React rendering.
- Provide low-power and reduced-motion representations.
- Display frame time, body count, constraint count, and simulation steps while developing.

## Evidence before mythology

Codenames, stickers, recurring motifs, and running conversations are welcome. Each field note remains tied to the originating repository, PR, commit, issue, discussion, or workflow run. The visual board can feel alive while the record stays exact.

## Historical memory

Read `docs/interface-memory/2026-07-26-tactile-workshop.md` for the longer reasoning, material presets, physics candidates, implementation phases, and open questions that produced this guide.
