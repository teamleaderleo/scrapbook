# Subdued material vocabulary — 2026-07-27

Issue: #384  
Lane: Agent 4 — material vocabulary and scoreboard study  
Base: `main` at `ca54db56b67553393aff5b1eee59d8fc927d179d`

## Intent

Scrapbook should read as a cabinet of distinct working objects. Material cues carry role and atmosphere while typography, spacing, interaction, and responsive behaviour remain familiar.

The target is a quiet form of skeuomorphism:

- recognisable materials without photoreal imitation;
- depth concentrated around edges, seams, and protected readouts;
- texture visible through close inspection and highlight, then absent from ordinary reading;
- decorative hardware used as punctuation;
- CSS-only recipes on ordinary routes.

## Material map

### Painted steel

Use for durable housings and instrument faceplates. The recipe combines a low-contrast diagonal value shift, tiny repeating grain, an upper highlight, a lower inset shadow, and a modest cast shadow.

Light mode uses warm grey steel. Dark mode uses charcoal steel. Neither expression becomes chrome.

### Phenolic plastic

Use for digit wells, bezels, compact controls, and key-like objects. The surface stays warm near-black with a slight moulded highlight and deep inset edge.

The role carries density and grip. It should remain local rather than becoming a page background.

### Smoked or frosted glass

Use for lenses, protected readouts, and translucent handles. The cue comes from edge reflection and local tint. Backdrop blur remains modest and has an opaque fallback.

Glass belongs where the layer beneath it contributes meaning. It should never become the default card treatment.

### Slate

Use for one temporary datum, annotation, or status strip. Grain stays dry and quiet. The text uses a warm chalk-like colour with ordinary contrast requirements.

Slate should be rare enough that it reads as an annotation surface.

### Paper

Use for provenance, gallery notes, field records, and temporary objects. Warm fibre, a tiny repeating speckle, and an optional imperfect edge provide the cue.

Paper may rotate or overlap in the gallery. Application controls remain aligned and predictable.

### Tape

Use to explain attachment. A tape strip is semi-opaque, slightly skewed, and visually passive. It never covers controls, focus rings, or critical text.

### Restrained hardware

Use a sparse vocabulary of screws, inset seams, engraved labels, stamped labels, paper edges, and tape strips. These details support object identity. They carry no pointer behaviour and consume no layout space.

## Token strategy

`app/materials.css` owns the light and dark variables for face, low face, edge, highlight, shadow, ink, mark, hardware, and grain opacity. Recipes use HSL channels so theme expressions can change without rewriting every gradient.

`components/material/material-primitives.tsx` exposes:

- `MaterialSurface`;
- `InsetSeam`;
- `HardwareScrew`;
- `GlassLens`;
- `EngravedLabel`;
- `StampedLabel`;
- `PaperEdge`;
- `TapeStrip`.

The primitive layer stays visually thin. Component authors choose semantic elements and retain ownership of dimensions, layout, and interaction.

## Accessibility and fallback rules

- Text contrast is judged after all tint and texture layers are composited.
- Glass becomes locally opaque when backdrop filtering is unavailable.
- `prefers-reduced-transparency` removes blur and raises local opacity.
- `prefers-reduced-motion` removes decorative transition duration.
- Forced-colour mode collapses recipes to `Canvas` and `CanvasText` with explicit borders.
- Hardware and texture remain pointer-transparent.
- The material layer introduces no continuous animation or pointer-tracking loop.

## Scoreboard exemplar plan

The homepage scoreboard is the first complete application after #389 fixes its tested footprint.

Paint-only mapping:

- outer housing: painted steel;
- corner details: four small screws, positioned inside the existing border box;
- header labels: engraved treatment;
- digit wells: phenolic plastic;
- protected digit faces: local glass lenses;
- secondary values: one slate annotation area or restrained inset readouts;
- seams: one inset faceplate seam;
- motion: existing split-flap motion retained, with no new continuous lighting effect.

The material pass must preserve the settled min-height, padding, grid, digit clamp, breakpoint, and touch target contract from #389.

## Restraint decisions

Several surfaces stay plain by design:

- page background and ordinary content cards;
- the contribution field until its later geometry lane settles;
- navigation and routine buttons;
- long scrolling lists;
- body copy and metadata rows;
- empty areas inside the scoreboard.

The exemplar receives one dominant steel role, phenolic and glass readouts, and a small slate secondary role. Paper and tape remain available to the gallery rather than appearing on the scoreboard.

## Evidence matrix

The exemplar review should capture these four cases at 100% browser zoom:

| Theme | Viewport | Required checks |
| --- | --- | --- |
| Light | Mobile, 390×844 | Contrast, touch behaviour, zero horizontal overflow |
| Dark | Mobile, 390×844 | Digit legibility, glass fallback, compact footprint |
| Light | Desktop, 1366×768 | Above-the-fold relationship with contribution field and recent systems |
| Dark | Desktop, 1440×900 | Depth hierarchy, restrained grain, focus visibility |

Also exercise reduced motion, reduced transparency, and forced-colour fallbacks. Compare route bundle output before and after; this slice adds CSS and TypeScript only, with zero raster texture assets.

## Open coordination

Agent 1 / #389 owns dimensions and short-viewport behaviour. Agent 4 reviews that density work before transplanting the paint-only exemplar. Agent 1 performs the final homepage reconciliation. The material PR remains draft and unmerged throughout that exchange.
