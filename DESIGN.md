# Scrapbook Design Guide

This file records the design rules that have survived repeated revisions. Dated notes in `docs/interface-memory/` preserve the longer history, abandoned directions, and experiments.

## The place

Scrapbook is a personal workshop with distinct rooms:

- **Home** is a foyer and instrument panel.
- **Space** is a workbench and reference console.
- **Knowledge** is a linked technical atlas grown from reading, conversation, and real work.
- **Time** is a calibrated dial.
- **Gallery** is a pinboard and back room where scraps accumulate.
- **Agent check-ins** are signed field notes tied to real repository work.

The ordinary interface stays immediate and dependable. Selected objects receive tactile, material behaviour. Gallery and laboratory surfaces may become strange.

The operator's direction, this guide, interface memory, and established adjacent Scrapbook surfaces are the product authority. Generic assistant design heuristics are prompts for judgment, not a house style. Avoid defaulting to rounded card grids, pills and status badges, glass panels, gradients, oversized hero copy, or decorative icons unless the information model or an established component gives them a specific job. Prefer clear hierarchy, native browser behavior, compact inspection, and evidence that earns its space. Healthy detail may recede; actionable exceptions stay obvious. Accessibility, responsiveness, privacy, and safety still apply.

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

Use material variation to explain the role of an object. Every recipe has light and dark tokens in `app/materials.css`; components consume them through `MaterialSurface` and the small details in `components/material/material-primitives.tsx`.

| Role | Use | Character | Keep plain when |
| --- | --- | --- | --- |
| Painted steel | Instrument housings, durable panels, calibrated frames | Low-contrast mottling, shallow bevel, hairline seam, sparse hardware | A normal content card carries no instrument meaning |
| Phenolic plastic | Digit wells, bezels, compact controls, key-like objects | Warm near-black, tight inset shadow, slight moulded highlight | A large reading surface needs brighter contrast |
| Smoked or frosted glass | Protected readouts, lenses, scrubber thumbs | Edge reflection and local tint; blur stays modest and optional | Translucency has no useful relationship to the layer behind it |
| Slate | One small temporary datum, annotation, or status strip | Dry dark face, restrained chalk-like mark, minimal grain | Repeated metrics already have a clearer table or list |
| Paper | Gallery provenance, field notes, tags, temporary annotations | Warm fibre, quiet ink, imperfect edge used sparingly | Dense application controls need predictable alignment |
| Tape | Attachment cue for paper, prints, and provenance | Semi-opaque strip, slight skew, tiny lift shadow | The attachment is already obvious or the surface is interactive |
| Restrained hardware | Screws, rivets, seams, engraved or stamped labels | Small and functional-looking; usually two or four details per object | Decoration would compete with content or imply a false control |

### Reusable details

- `InsetSeam` separates a faceplate from its housing without adding layout space.
- `HardwareScrew` marks a panel corner; it never receives focus or pointer behaviour.
- `GlassLens` adds a local reflection over a protected readout.
- `EngravedLabel` belongs on durable housings and calibration marks.
- `StampedLabel` belongs on temporary or inspected objects.
- `PaperEdge` and `TapeStrip` support gallery and provenance objects.

### Guardrails

- Preserve WCAG text contrast on the final composited colour, including glass and texture layers.
- Keep texture beneath reading level: it should appear through highlights or close inspection, then recede.
- Use one dominant material and at most two supporting roles on an ordinary instrument.
- Keep screws, seams, labels, and tape outside the reading and touch areas.
- Let empty areas remain empty. Material depth never earns another metric.
- Use CSS gradients and compact repeating marks; large texture images stay outside ordinary route bundles.
- Give glass an opaque fallback. Honour reduced transparency, reduced motion, and forced-colour modes.
- Avoid continuous pointer lighting. Any moving highlight must be frame-limited, optional, and visually quiet.
- Preserve the dimensions owned by the component. A material pass may change paint and depth while leaving the tested footprint intact.

### Other tactile roles

Rubber and keycaps serve high-frequency actions, grading controls, and shortcuts. Use one- or two-pixel compression with a quick release.

Jelly, gel, and slime belong to explicit playful surfaces and the tactile lab. Keep primary navigation, text, and predictable controls stable.

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

Agent check-ins follow `docs/agent-check-ins.md`. An ordinary new check-in is one typed repository-backed entry with a designation, compact mark, work note, date, repository/runtime metadata when known, and inspectable source evidence. Generation 3 derives the visible sigil from repository plus designation, with the note contributing an optional highlight. Historical Generation 1 and Generation 2 selections remain reproducible. Older cards may retain local WebP artwork and creative metadata as historical compatibility data; those assets are outside the ordinary new-check-in path. Whimsy belongs in the presentation; repository and commit evidence stays literal.

The operational mutation and review path lives in the check-in contract and guide. Any future automated publishing should have deliberately narrow authority and an explicit approval path; ordinary check-ins continue through the normal repository edit and pull-request path.

## Space

Space should keep the working context available while the central content moves.

- Centralise shortcuts in one registry and generate the `?` reference from it.
- Persist selected item, review state, editor state, and relevant URL state.
- Keep desktop side tools accessible around a naturally scrolling centre.
- Use explicit mobile sheets and bottom actions.
- Model-generated companion solutions retain prompt, restatement, solution, complexity, tests, ambiguity notes, model, time, source, and revision history.

## Knowledge

Knowledge is a repository-backed reader over living Markdown, not a separate application database.

- Keep `knowledge/` canonical and useful directly on GitHub.
- Let directories provide broad orientation while relative links carry the richer cross-trunk graph.
- Prefer compact concept pages that can gain traces, counterexamples, pressure questions, and project evidence over encyclopedic one-shot articles.
- Preserve ordinary document reading: reflowing prose, useful hierarchy, direct links, and no canvas-only graph navigation.
- Show learning activity as quiet historical context. Daily `new`, `strengthened`, and `linked` counts describe edits to understanding without becoming scores, streaks, or completion percentages.
- Let Git history preserve how explanations change; avoid a second registry or database mirror merely to render the site.

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

Read `docs/interface-memory/2026-07-26-tactile-workshop.md` for the longer reasoning, material presets, physics candidates, implementation phases, and open questions that produced this guide. The first bounded material vocabulary is recorded in `docs/interface-memory/2026-07-27-subdued-material-system.md`.
