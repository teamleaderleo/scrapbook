# Generation 3 agent-sigil principles

Generation 3 is an evolutionary follow-up to the existing deterministic sigil system. Generation 1 and Generation 2 remain callable and unchanged.

The goal is to make the population calmer, more varied, and easier to distinguish at small sizes while retaining the qualities that already work:

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

Generate a calm base recipe directly:

- one primary construction;
- zero or one supporting rhythm or boundary;
- zero to two accents;
- two to three compositional layers at guestbook size;
- one or two stroke weights;
- sparse micro-detail;
- a complete enclosing ring only when the family requires it;
- protected negative space recorded in the recipe.

`quiet` is the default density for new guestbook identities. `regular` may add one supporting relation. `dense` is intended for larger exports and does not define the base silhouette.

## 2. Every region needs one job

Use a small set of optional regions:

```text
core       primary identity motif
rhythm     one repeated ring, lattice, route, or linked-cell relation
boundary   optional open or closed perimeter
accent     zero to two description-derived events
void       protected empty area
```

A mark can use only the regions it needs.

Good combinations include:

- core only;
- core plus rhythm;
- core plus interrupted boundary;
- lattice plus void;
- route plus one node;
- rhythm plus one accent;
- sparse technical diagram with no decorative frame.

Use “mandala-informed” only for concentric hierarchy and rhythmic organisation. Avoid reproducing sacred diagrams or ritual iconography.

## 3. Seeding responsibilities remain separate

```text
scope                    family, broad proportion, base lattice or radial order
designation              core motif, joint cadence, cut, bend, or internal rhythm
scope + designation      stable palette family
description              optional accent, interruption, or small infill only
generation + variant     explicit reproducible candidate
```

Hard requirements:

- description changes preserve the primary identity graph;
- description changes preserve the palette fingerprint;
- scope changes may change family and proportion while preserving designation-derived details where the family permits;
- variant changes are deliberate rerolls;
- each generation remains independently reproducible.

## 4. Grammar groups

Generation 3 contains several visibly different groups. The default contact sheet should distribute families instead of letting one group dominate.

### Quiet radial

- **Quiet rosette:** one ring of broad lobes and a simple centre.
- **Interrupted halo:** one or two incomplete rings with deliberate gaps.
- **Star chamber:** polygonal centre and restrained outer rhythm.
- **Open wheel:** spokes or linked cells without a solid enclosing circle.
- **Offset mandala:** radial order with one controlled omission or imbalance.

Use “mandala-informed” only for concentric hierarchy and rhythmic organisation. Sacred diagrams and ritual iconography remain outside the generator.

### Kumiko-informed lattice

- **Triangular brace:** connected struts and broad triangular voids.
- **Hex cell:** one or two nested hexagonal cells with sparse infill.
- **Diamond weave:** diagonal bars with alternating open cells.
- **Nested joint:** compact inner lattice suspended in a larger opening.
- **Broken lattice:** one deliberate missing strut or cell.
- **Hybrid rosette lattice:** radial rhythm built from joined bars instead of overlapping petals.

The implementation is graph-based enough to inspect joints, struts, cells, and voids independently.

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

These families should feel technical while avoiding franchise interfaces, logos, invented alphabets, or mission insignia.

## 5. Colour roles

Every mark should feel like one coherent colour world.

Use semantic roles:

```text
dominant   primary construction
support    secondary relation
highlight  one focal event
neutral    outline, shadow, or contrast
```

Automatic palette selection mixes several modes across the population:

- **monotone:** one hue with controlled value and chroma steps;
- **duotone:** dominant plus adjacent or restrained complementary support;
- **tri-colour:** dominant, support, and one limited highlight;
- **material:** wood, graphite, ceramic, stone, or metal-inspired neutrals;
- **luminous:** dark neutral basis with one or two technical accents.

Rules:

- store reviewed palette families as explicit data;
- keep RGB/HSL choices bounded to those families;
- use no more than three chromatic roles at guestbook size;
- allow a colour role to disappear at 16–24 px;
- avoid equal visual weight across every colour;
- derive light- and dark-mode mappings from the same semantic roles;
- keep monochrome output readable;
- description text leaves the palette fingerprint unchanged.

## 6. Negative space is part of identity

Every family should declare minimum open areas or gaps.

Examples:

- Kumiko-informed families record open cells;
- interrupted halos record angular gap ranges;
- cutout tiles record aperture area;
- routes record minimum separation between segments;
- technical marks reserve space around the primary datum.

A renderer preserves these voids through size changes.

## 7. Small-size behaviour

Review 16, 24, 32, 48, and 72 px output.

At smaller sizes:

- accents may disappear;
- infill depth may reduce;
- one colour role may collapse into another;
- minimum strut width stays visible;
- negative-space openings stay open;
- the family and primary silhouette remain recognisable.

The compact renderer simplifies the same recipe rather than creating a different identity.

## 8. Similarity checks

Fingerprints provide exact inspection while visual separation also uses geometry evidence.

Useful deterministic checks include:

- canonical geometry serialization;
- lattice graph topology;
- occupancy grids;
- radial mass histograms;
- connected-component counts;
- aspect ratio and centroid;
- negative-space descriptors.

A visible population rejects exact duplicates and uses variant pinning when a reviewed pair still collides visually.

## 9. Cultural and legal handling

- Extract mechanics, not finished motifs.
- Record the original culture, period, material, and function in the atlas.
- Generated work is presented as new algorithmic geometry rather than authentic traditional craft.
- Sacred symbols stay outside decorative output.
- Museum objects, workshop examples, logos, insignia, mission marks, and franchise interfaces stay outside direct reproduction.
- Keep culturally specific names in research notes unless the implementation genuinely follows the named method.
- Preserve source links and image licences when external imagery enters documentation.

## 10. Promotion acceptance

Generation 3 passed the population-level lab review on current main before becoming the ordinary guestbook default.

Accepted evidence includes:

- labels-hidden combined populations with graph separation;
- independent geometry, palette, and description-accent fingerprints;
- deterministic monotone/duotone/tri-colour and reviewed palette-family behavior;
- light and dark mode;
- phone and laptop widths;
- Chromium coverage plus the repository's WebKit compatibility lane;
- 16, 24, 32, 48, and 72 px output;
- compact 16–24 px reduction that removes the optional highlight before identity detail;
- description-edit isolation and palette-stability checks;
- dedicated `sigil-lab-visual-review` artifacts;
- explicit preservation of historical Generation 1 and Generation 2 selections.

The promotion target remains a wall that feels calmer without becoming plain, richer without becoming random, and varied without turning into an unfiltered collection of borrowed aesthetics.
