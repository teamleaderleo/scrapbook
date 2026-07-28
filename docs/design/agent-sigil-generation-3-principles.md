# Generation 3 agent-sigil principles

Generation 3 is an evolutionary follow-up to the existing deterministic sigil system. Generation 1 and Generation 2 remain callable and unchanged.

The goal is not to replace radial identities with another single house style. It is to make the population calmer, more varied, and easier to distinguish at small sizes while retaining the qualities that already work:

- deterministic layered inputs;
- reproducible generations and variants;
- compact SVG output;
- radial and mandala-like rhythm where appropriate;
- expressive but bounded colour;
- inspectable recipes rather than stored image blobs.

Historical context and source links live in [`agent-sigil-reference-atlas.md`](agent-sigil-reference-atlas.md).

Related issues:

- [#443 — Generation 3 integration brief](https://github.com/teamleaderleo/scrapbook/issues/443)
- [#447 — Kumiko-informed lattice grammar](https://github.com/teamleaderleo/scrapbook/issues/447)
- [#448 — cohesive seeded colour systems](https://github.com/teamleaderleo/scrapbook/issues/448)
- [#449 — sourced reference atlas](https://github.com/teamleaderleo/scrapbook/issues/449)

## 1. Calmness is a recipe property

Do not generate a busy mark and then try to simplify it with CSS or size-specific hiding.

The base recipe should be calm:

- one primary construction;
- zero or one supporting rhythm or boundary;
- zero to two accents;
- two to three compositional layers at guestbook size;
- one or two stroke weights;
- no automatic field of micro-dots;
- no complete enclosing ring unless the family requires it;
- protected negative space recorded in the recipe.

`quiet` should be the default density for new guestbook identities. `regular` may add one supporting relation. `dense` is intended for larger exports and must not define the base silhouette.

## 2. Every region needs one job

Use a small set of optional regions:

```text
core       primary identity motif
rhythm     one repeated ring, lattice, route, or linked-cell relation
boundary   optional open or closed perimeter
accent     zero to two description-derived events
void       protected empty area
```

A mark does not need every region.

Good combinations include:

- core only;
- core plus rhythm;
- core plus interrupted boundary;
- lattice plus void;
- route plus one node;
- rhythm plus one accent;
- sparse technical diagram with no decorative frame.

## 3. Seeding responsibilities remain separate

```text
scope                    family, broad proportion, base lattice or radial order
designation              core motif, joint cadence, cut, bend, or internal rhythm
scope + designation      stable palette family
description              optional accent, interruption, or small infill only
generation + variant     explicit reproducible candidate
```

Hard requirements:

- changing the description must not reconstruct the primary identity;
- changing the description must not recolour the identity;
- changing the scope may change the family and proportion while preserving designation-derived details where the family permits;
- variant changes are deliberate rerolls, not hidden random state;
- each generation remains independently reproducible.

## 4. Grammar groups

Generation 3 should contain several visibly different groups. No one group should dominate the default contact sheet.

### Quiet radial

- **Quiet rosette:** one ring of broad lobes and a simple centre.
- **Interrupted halo:** one or two incomplete rings with deliberate gaps.
- **Star chamber:** polygonal centre and restrained outer rhythm.
- **Open wheel:** spokes or linked cells without a solid enclosing circle.
- **Offset mandala:** radial order with one controlled omission or imbalance.

Use “mandala-informed” only for concentric hierarchy and rhythmic organisation. Do not reproduce sacred diagrams or ritual iconography.

### Kumiko-informed lattice

- **Triangular brace:** connected struts and broad triangular voids.
- **Hex cell:** one or two nested hexagonal cells with sparse infill.
- **Diamond weave:** diagonal bars with alternating open cells.
- **Nested joint:** compact inner lattice suspended in a larger opening.
- **Broken lattice:** one deliberate missing strut or cell.
- **Hybrid rosette lattice:** radial rhythm built from joined bars instead of overlapping petals.

The implementation must be graph-based enough to inspect joints, struts, cells, and voids independently.

### Cutout and grid

- **Pierced plate:** one bold mass defined by an aperture or notch.
- **Binary stitch:** small orthogonal grid generated from seeded binary words.
- **Open weave:** repeated modules with controlled transparency.
- **Quasicrystal crop:** rare nonperiodic cluster with one focal vertex.

### Technical and speculative

- **Telemetry rose:** central datum, sparse ticks, one highlighted sector.
- **Orbital transfer:** two or three arcs joined by a tangent or node.
- **Circuit shrine:** orthogonal paths converging on one centre.
- **Calibration glyph:** crosshair, offset scale, and one irregular reference.
- **Signal braid:** two or three monoline routes with controlled crossings.
- **Constellation circuit:** sparse nodes joined by rule-based routes.

These families should feel technical without borrowing franchise interfaces, logos, invented alphabets, or mission insignia.

## 5. Colour is structural

More colour is allowed, but every mark should feel like one coherent colour world.

Use semantic roles:

```text
dominant   primary construction
support    secondary relation
highlight  one focal event
neutral    outline, shadow, or contrast
```

Automatic palette selection should mix several modes across the population:

- **monotone:** one hue with controlled value and chroma steps;
- **duotone:** dominant plus adjacent or restrained complementary support;
- **tri-colour:** dominant, support, and one limited highlight;
- **material:** wood, graphite, ceramic, stone, or metal-inspired neutrals;
- **luminous:** dark neutral basis with one or two technical accents.

Rules:

- store reviewed palette families as explicit data;
- do not use unrestricted RGB or HSL randomisation;
- use no more than three chromatic roles at guestbook size;
- allow a colour role to disappear at 16–24 px;
- avoid equal visual weight across every colour;
- derive light- and dark-mode mappings from the same semantic roles;
- keep monochrome output readable;
- never let description text change the palette fingerprint.

## 6. Negative space is part of identity

Every family should declare minimum open areas or gaps.

Examples:

- Kumiko-informed families record open cells;
- interrupted halos record angular gap ranges;
- cutout tiles record aperture area;
- routes record minimum separation between segments;
- technical marks reserve space around the primary datum.

A renderer must not close or fill these voids merely to add detail.

## 7. Small-size behaviour

Review 16, 24, 32, 48, and 72 px output.

At smaller sizes:

- accents may disappear;
- infill depth may reduce;
- one colour role may collapse into another;
- minimum strut width must remain visible;
- negative-space openings must not close;
- the family and primary silhouette must remain recognisable.

The compact renderer may simplify a recipe, but it must not produce a different identity.

## 8. Similarity checks

Fingerprints alone do not prevent visible collisions.

Add deterministic similarity checks using one or more of:

- canonical geometry serialization;
- lattice graph topology;
- occupancy grids;
- radial mass histograms;
- connected-component counts;
- aspect ratio and centroid;
- negative-space descriptors.

A visible population should reject exact duplicates and flag near-duplicates for variant pinning or regeneration.

## 9. Cultural and legal handling

- Extract mechanics, not finished motifs.
- Record the original culture, period, material, and function in the atlas.
- Do not label generated work as authentic traditional craft.
- Do not combine sacred symbols into decorative output.
- Do not copy museum objects, workshop examples, logos, insignia, mission marks, or franchise interfaces.
- Keep culturally specific names in research notes unless the implementation genuinely follows the named method.
- Preserve source links and image licences when external imagery enters documentation.

## 10. Lab acceptance

Generation 3 remains lab-only until the complete population passes visual review.

Required evidence:

- Generation 2 and Generation 3 using the same identities;
- labels-hidden monochrome contact sheet;
- separate radial, Kumiko-informed, cutout/grid, and technical rows;
- light and dark mode;
- mobile and desktop widths;
- Chromium and WebKit;
- all reviewed icon sizes;
- description-edit isolation examples;
- palette-stability examples;
- similarity warnings and any pinned variants;
- no production guestbook switch without explicit approval.

The acceptance target is a wall that feels calmer without becoming plain, richer without becoming random, and varied without turning into an unfiltered collection of borrowed aesthetics.
