# Agent sigil reference atlas

This document records the historical and design references behind future agent-sigil experiments. It is a research aid, not a claim that generated SVG marks reproduce any traditional craft, sacred diagram, museum object, or protected visual identity.

The working rule is simple:

> Study construction methods, material behaviour, compositional logic, and information hierarchy. Do not trace finished motifs.

Each section separates three questions:

1. What was the original tradition, object, or design system?
2. Which abstract mechanics might transfer to a deterministic generator?
3. Which names, meanings, and forms must remain outside the generated output?

Related implementation issues:

- [#443 — calmer mandala- and Kumiko-informed Generation 3](https://github.com/teamleaderleo/scrapbook/issues/443)
- [#447 — Kumiko-informed lattice grammar](https://github.com/teamleaderleo/scrapbook/issues/447)
- [#448 — cohesive seeded colour systems](https://github.com/teamleaderleo/scrapbook/issues/448)
- [#449 — this sourced reference atlas](https://github.com/teamleaderleo/scrapbook/issues/449)

## 1. Kumiko and Japanese architectural latticework

### Historical setting

Kumiko is a Japanese woodworking method in which thin strips of wood are precisely cut and fitted into latticework without nails. Japan House London describes it as a method used in architectural fittings such as shōji sliding partitions, ranma transoms, and tsuitate freestanding screens. Its workshop material dates the method to at least the Kamakura period, 1185–1333, while also noting its continuing use in later architectural craft.

Kumiko is inseparable from material and labour. The visual pattern is the result of exact cuts, fitted joints, wood grain, repeated cells, and the surrounding light. The gaps are not leftovers. They determine how the object breathes and how it changes the room around it.

The Takenaka Carpentry Tools Museum places this work within tategu, the wider field of traditional Japanese architectural joinery and fittings.

### Transferable mechanics

A procedural translation should begin with a construction graph:

```text
nodes       visible joints or intersections
struts      bars connecting compatible nodes
cells       triangular, square, diamond, or hexagonal regions
infill      one secondary construction inside selected cells
voids       deliberately unfilled cells
boundary    optional open or closed perimeter
```

Useful generator lessons:

- complexity can emerge from a small vocabulary of joints and cells;
- precise repetition feels calmer than unrelated decoration;
- a missing strut can be more distinctive than another ornament;
- the base lattice should survive in monochrome;
- description-derived changes should alter one splice, interruption, or infill rather than rebuilding the lattice;
- open-cell area and minimum strut width must be explicit parts of the recipe.

### Cultural and naming guardrails

- Call generated work **Kumiko-informed**, not Kumiko.
- Do not present a generated result as authentic Japanese joinery.
- Do not trace named traditional patterns from workshop photographs or museum objects.
- Historical pattern names may appear in research notes, but they should not become automatic marketing labels for unrelated generated marks.
- Record the original architectural and material context whenever a named pattern is discussed.

### Primary sources

- [Japan House London — Making Kumiko Latticework](https://www.japanhouselondon.uk/whats-on/making-kumiko-latticework/)
- [Japan House London — Making Kumiko Latticework Coasters](https://www.japanhouselondon.uk/whats-on/making-kumiko-latticework-coasters/)
- [Japan House London — Kumiko Latticework Coaster Workshop](https://www.japanhouselondon.uk/venue-hire/cultural-offerings/kumiko-latticework-coaster-workshop/)
- [Takenaka Carpentry Tools Museum — The Anatomy of Tategu](https://tategu.dougukan.jp/en)

## 2. Mandala-like concentric organisation

### Historical caution

“Mandala” refers to religious and ritual diagrams in several Asian traditions, not merely to any circular pattern. The sigil generator must not borrow sacred figures, deity arrangements, ritual diagrams, seed syllables, or named religious compositions.

The transferable lesson is narrower: concentric hierarchy can give every region one job.

### Transferable mechanics

```text
core       primary identity motif
rhythm     one repeated ring or relation
boundary   optional enclosure
accent     zero to two small events
void       protected empty space
```

A generated mark does not need every region. Calm combinations include:

- core only;
- core plus one broad rhythm;
- core plus an interrupted boundary;
- open wheel with no complete ring;
- lattice plus central void;
- one repeated relation with a single omission.

The implementation should use **mandala-informed** only as a description of concentric hierarchy and rhythmic balance.

### Guardrails

- Do not reproduce sacred diagrams or ritual iconography.
- Do not name a generated mark after a religious composition merely because it is radial.
- Do not use religious meaning as decorative flavour.
- Keep the design discussion focused on hierarchy, repetition, symmetry, omission, and breathing room.

## 3. Islamic geometric pattern systems

### Historical setting

The Metropolitan Museum of Art describes geometric pattern as one of the major nonfigural traditions in Islamic art. Simple forms such as circles, squares, stars, and multisided polygons can be combined, duplicated, interlaced, and arranged into highly ordered compositions. The Met also emphasises the possibility of apparent infinite growth and the coexistence of geometric, vegetal, calligraphic, and figural elements across different objects and periods.

This history is broader and more varied than a single “Islamic pattern” aesthetic. The relevant lesson for the generator is the use of repeat units and local construction rules, not the copying of a mosque panel, manuscript border, or sacred object.

### Transferable mechanics

- repeat units built from circles, squares, triangles, and polygons;
- star construction derived from inscribed geometry;
- interlace and over-under routing;
- local adjacency rules that create larger order;
- finite crops that still imply continuation;
- controlled alternation between dense and open regions.

### Guardrails

- Do not trace architectural panels or manuscript decoration.
- Do not mix calligraphy or sacred text into generated marks.
- Do not describe a generic polygonal result as authentic Islamic ornament.
- Preserve object, period, geography, and medium in research notes rather than collapsing the tradition into a visual tag.

### Primary source

- [The Met — Geometric Patterns in Islamic Art](https://www.metmuseum.org/essays/geometric-patterns-in-islamic-art)

## 4. Jali pierced screens

### Historical setting

Jali are pierced architectural screens used in South Asian architecture as windows, dividers, railings, and environmental filters. The Met’s Mughal examples show that their geometry worked both as a carved surface and as moving silhouettes cast by sunlight. Some surviving examples were carved from single pieces of sandstone or marble, making the relationship between solid material and removed space central to the craft.

### Transferable mechanics

- negative-space masks rather than additive ornament;
- nested patterns with different visual scales;
- thick and thin grids;
- a shape defined by what has been cut away;
- silhouettes designed to affect surrounding space;
- optional reversal between positive and negative geometry.

A “cutout tile” or “pierced plate” family could use one bold mass whose identity comes from a notch, aperture, or nested void.

### Guardrails

- Use **jali-informed cutout logic**, not copied screens.
- Do not reuse exact star-and-hexagon layouts from museum objects.
- Record the original architectural role, material, and period.

### Primary sources

- [The Met — Pierced Window Screen (Jali), second half of the 16th century](https://www.metmuseum.org/art/collection/search/453343)
- [The Met — Pierced Window Screen (Jali), early 17th century](https://www.metmuseum.org/art/collection/search/453241)

## 5. Hitomezashi and binary grid stitching

### Historical setting

Hitomezashi is a form of Japanese sashiko stitching built from repeated unit-length stitches. Recent mathematical papers describe how binary words can specify patterns and how stitches connect into strands, loops, and enclosed regions.

The mathematical representation is especially relevant to deterministic identity generation because text seeds can be transformed into binary sequences without adding opaque random noise.

### Transferable mechanics

- convert a stable seed into horizontal and vertical binary words;
- place unit segments according to parity or phase rules;
- detect loops, regions, and connected components;
- use one controlled dual or inverted variation;
- derive compact orthogonal marks from a small grid.

### Guardrails

- Call the result **grid-stitch-informed** unless it accurately follows the traditional construction.
- Do not present a mathematical reinterpretation as handcrafted sashiko.
- Keep traditional history and modern mathematical analysis clearly separated.

### Research sources

- [Seaton and Hayes — Mathematical specification of hitomezashi designs](https://arxiv.org/abs/2208.12580)
- [Defant and Kravitz — Loops and Regions in Hitomezashi Patterns](https://arxiv.org/abs/2201.03461)

## 6. Bauhaus composition and weaving

### Historical setting

The Bauhaus operated from 1919 to 1933 as a school joining artistic experimentation with practical design disciplines. MoMA describes its curriculum as combining work on space, colour, and composition with applied workshops including weaving, metalwork, typography, and cabinetmaking.

Anni Albers studied and later taught in the Bauhaus weaving workshop. Her design studies explored horizontal-vertical construction, colour, shape, proportion, rhythm, and the structural behaviour of textile layers. Her later open weaves and room dividers also treated textile as an architectural surface that could shape space while remaining permeable.

### Transferable mechanics

- economy of primitives;
- many arrangements from identical modules;
- asymmetry inside a disciplined grid;
- colour as a structural relation rather than decoration;
- explicit exercises that isolate one variable at a time;
- open weave and transparency as alternatives to solid fill.

### Guardrails

- Do not turn “Bauhaus” into a synonym for primary-colour rectangles.
- Attribute specific artists and workshops when their work is discussed.
- Do not reproduce a particular textile or composition study.

### Primary sources

- [MoMA — Bauhaus and Beyond](https://www.moma.org/calendar/galleries/5388)
- [MoMA — Anni Albers, Design for Smyrna Rug](https://www.moma.org/collection/works/3735)
- [MoMA — Anni Albers](https://www.moma.org/artists/96-anni-albers)

## 7. Penrose tilings and quasicrystalline order

### Historical setting

Penrose tilings use a small set of shapes and matching rules to create ordered, nonperiodic arrangements. Their relevance is not that every sigil should become a tiling, but that a family can feel coherent without repeating on a simple grid.

### Transferable mechanics

- two-shape vocabularies;
- local matching rules;
- fivefold relationships;
- finite crops selected from a larger deterministic field;
- long-range order without obvious repetition;
- rare variants that look systematic without appearing cloned.

### Guardrails

- Do not claim a mathematically exact Penrose tiling unless the matching rules are actually implemented.
- Prefer **quasicrystal-informed** for looser experiments.
- Keep this family rare at guestbook size; small crops can become visually noisy.

### Research sources

- [Science Museum Group — Penrose tiling teaching set](https://collection.sciencemuseumgroup.org.uk/objects/co59913/set-of-76-green-and-124-brown-chicken-shaped-pieces-of-cardboard)
- [Science Museum Group — 3D version of the Penrose tiling](https://collection.sciencemuseumgroup.org.uk/objects/co8188744/3d-version-of-the-penrose-tiling)

## 8. Scientific diagrams and speculative technical language

### Historical setting

NASA display standards are designed for operational clarity rather than decoration. The current display appendix states that information should be limited to what is needed, related elements should be grouped, and icons and symbols must be visually distinct from one another.

The Voyager Golden Record cover is a separate historical example of sparse diagrams carrying instructions and scientific references. Its engravings describe playback, a hydrogen-based time reference, and the Sun’s location relative to pulsars.

These references support a science-fiction lane grounded in information design rather than franchise imitation.

### Transferable mechanics

- one primary datum with supporting marks;
- sparse ticks, vectors, arcs, and calibration lines;
- consistent symbol suites;
- explicit distinction between flow, boundary, state, and annotation;
- asymmetrical ray lengths or node positions derived from a seed;
- technical-looking marks that remain readable without invented alien alphabets.

Candidate original families:

- telemetry rose;
- orbital transfer;
- circuit shrine;
- calibration glyph;
- signal braid;
- sparse constellation circuit;
- quasicrystal beacon.

### Legal and design guardrails

- Do not use NASA logos, insignia, mission patches, or protected identifiers.
- Do not copy the Voyager cover diagram.
- Do not reproduce a film, game, or television interface.
- Do not invent unreadable microtext merely to signal “science fiction.”
- Keep symbols visually distinct and information density bounded.

### Primary sources

- [NASA — Appendix F: Display Standard](https://www.nasa.gov/reference/appendix-f-vol-2/)
- [JPL — Voyager’s Special Cargo: The Golden Record](https://www.jpl.nasa.gov/images/pia14113-voyagers-special-cargo-the-golden-record/)

## 9. Historical colour systems and material colour

### Kasane no irome

Heian court dress used established layered colour combinations associated with season and occasion. The Japanese government’s historical overview describes more than one hundred recorded combinations and explains how small visible edges of layered silk produced subtle relationships and gradations.

The transferable lesson is that a palette can be relational and layered. It is not permission to take ceremonial combinations, strip away their context, and use their names as generated presets.

### Cut glass and colour through depth

Japanese cut-glass traditions show another relationship between geometry and colour. In Satsuma kiriko, coloured glass layered over clear glass produces gradients when cuts vary in depth and angle. The result depends on material thickness and light, not merely on selecting several swatches.

The procedural lesson is to assign colour by role and depth:

```text
dominant   primary construction
support    secondary relation
highlight  one focal event
neutral    outline, shadow, or contrast
```

### Guardrails

- Do not label an arbitrary palette with a historical ceremonial name.
- Do not claim material effects that flat SVG cannot reproduce.
- Record colour history as context for relationship, layering, and restraint.
- Keep generated palette names descriptive and internal.

### Research sources

- [Highlighting Japan — Kimono Combinations: The Seasons in Layers of Silk](https://www.gov-online.go.jp/eng/publicity/book/hlj/html/202010/202010_06_en.html)
- [Highlighting Japan — The Revival and Development of Satsuma Kiriko](https://www.gov-online.go.jp/eng/publicity/book/hlj/html/202211/202211_05_en.html)
- [Highlighting Japan — Glass Use and Glass Crafts in Japan](https://www.gov-online.go.jp/eng/publicity/book/hlj/html/202211/202211_01_en.html)

## 10. Procedural translation table

| Research lane | Original concern | Transferable mechanic | Candidate control | Main caution |
| --- | --- | --- | --- | --- |
| Kumiko | fitted wooden lattice and architectural light | joint graph, cells, voids | lattice family, infill depth, missing strut | do not claim authentic craft |
| Mandala-like hierarchy | ritual and concentric organisation | core, rhythm, boundary, void | ring roles, omission, symmetry | avoid sacred diagrams and terminology |
| Islamic geometry | repeat units and interlace | polygon rules, stars, local growth | unit type, adjacency, over-under phase | do not trace architectural ornament |
| Jali | pierced architectural screens | cutout masks and nested voids | plate shape, aperture, inversion | preserve South Asian context |
| Hitomezashi | unit stitches and loops | binary words, parity, regions | grid size, phase, dual | do not call a mathematical remix traditional embroidery |
| Bauhaus weaving | material, construction, colour, proportion | module economy and structural colour | module set, rhythm, value plan | avoid generic style branding |
| Penrose systems | nonperiodic order | matching rules and finite crops | tile set, crop, focal vertex | do not claim exact mathematics loosely |
| NASA and Voyager | operational distinction and encoded diagrams | sparse technical relationships | datum, ticks, vectors, node count | no logos, insignia, or copied diagrams |
| Historical colour systems | layered material colour | role-based palettes and gradation | mode, family, highlight weight | no decontextualised ceremonial naming |

## 11. Research acceptance checklist

A new reference enters the implementation backlog only when the design note can answer all of these:

- What was the original material, function, period, and cultural context?
- Which construction principle is being abstracted?
- Can the principle be expressed as a small deterministic recipe?
- Does it improve small-size distinction or calmness?
- Can the result remain original without tracing a source object?
- Are sacred, ceremonial, legal, or attribution concerns recorded?
- Does the lab show the reference beside a monochrome fallback?
- Can a reviewer explain why the result belongs to the generator rather than to the source tradition?

The atlas should narrow choices. It is not an instruction to combine every reference into every mark.
