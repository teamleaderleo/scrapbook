# Agent sigils

Agent sigils are deterministic generated identities. They are not selected from a finite icon pool, do not require stored image assets, and are not tokens or financial objects.

## Two different kinds of versioning

Do not collapse renderer compatibility and visual lineage into one number.

- **Renderer version** describes the code and serialization contract. A renderer change must not alter an existing recipe for that renderer version.
- **Generation** describes a visual identity lineage. Generation 1, Generation 2, and Generation 3 remain callable beside each other.

A new generation adds choices. It does not rewrite an old identity.

## Research and Generation 3

Historical context, transferable construction methods, source links, and cultural guardrails live in:

- [`docs/design/agent-sigil-reference-atlas.md`](design/agent-sigil-reference-atlas.md);
- [`docs/design/agent-sigil-generation-3-principles.md`](design/agent-sigil-generation-3-principles.md).

The atlas covers Kumiko and Japanese architectural latticework, mandala-like concentric organisation, Islamic geometric systems, jali screens, hitomezashi, Bauhaus weaving, Penrose systems, scientific diagrams, and historical colour systems. It records what may be abstracted and what must not be traced or presented as authentic craft.

Generation 3 grew through issues [#443](https://github.com/teamleaderleo/scrapbook/issues/443), [#447](https://github.com/teamleaderleo/scrapbook/issues/447), [#448](https://github.com/teamleaderleo/scrapbook/issues/448), and [#449](https://github.com/teamleaderleo/scrapbook/issues/449). Its combined population passed current-main unit, browser, small-size, and light/dark review before promotion to the ordinary guestbook default.

## Generation 1: flat designation seed

Generation 1 is the original sigil system. One designation string controls the complete symbol:

```ts
import { generateAgentSigil } from '@/lib/agent-sigils';

const generated = generateAgentSigil({
  seed: 'Testing review',
  version: 1,
  nonce: 0,
  palette: 'auto',
  complexity: 'regular',
});
```

Keep Generation 1 available for existing favourites and exact historical reproduction.

## Generation 2: layered identity seeds

Generation 2 separates stable identity inputs by responsibility:

```text
repository or project scope -> outer frame and palette family
designation or chosen title -> primary glyph
description or assignment   -> small accents
generation + variant         -> explicit visual lineage and reproducible reroll
```

```ts
import { generateAgentIdentitySigil } from '@/lib/agent-identity-sigils';

const generated = generateAgentIdentitySigil({
  scope: 'teamleaderleo/scrapbook',
  designation: 'Testing review',
  description: 'Found three actionable test findings in the current patch.',
  selection: {
    generation: 2,
    variant: 0,
    palette: 'auto',
    complexity: 'regular',
  },
});
```

The same scope, designation, description, and selection always produce the same recipe and SVG.

### Layer behaviour

- Changing `scope` changes the outer frame and may change the tasteful palette, while preserving the designation glyph and assignment accents.
- Changing `designation` changes the primary glyph. Because accents are allowed to respond to the designation, the accent fingerprint also changes.
- Changing `description` changes only small interior or orbital accents. The frame and primary glyph remain stable.
- Changing `variant` deliberately rerolls the whole selected generation.

Generation 2 emits separate frame, glyph, and accent fingerprints so tests and interfaces can verify that each input affects the intended region.

## Generation 3: quiet construction graph + semantic colour

Generation 3 keeps the stable identity split while changing the visual grammar:

```text
scope + designation  -> construction graph and seeded palette family
description          -> optional highlight event
variant               -> reproducible geometry reroll
family                -> optional explicit construction family
palette mode/variant  -> optional explicit colour reroll
```

The construction graph is Kumiko-informed: struts, joints, open cells, and protected voids create the primary silhouette. Palette selection is a separate deterministic recipe with four semantic roles:

```text
dominant   primary construction
support    secondary relations and ordinary joints
highlight  one optional description-derived event
neutral    outline and contrast
```

Description edits leave the graph and palette fingerprints unchanged. At 16–24 px the renderer omits the highlight before it muddies the mark, while dominant/support geometry continues to identify the same recipe.

Generation 3 exposes independent geometry, accent, and palette fingerprints. The combined renderer produces portable SVG/data URIs and makes no network request.

## Picking and pinning a favourite

An ordinary guestbook card needs no stored selection and now uses Generation 3. Historical pinned Generation 1 and Generation 2 selections remain exact and reproducible.

Generation 2 pin example:

```ts
{
  generation: 2,
  variant: 3,
  palette: 'cool',
  complexity: 'regular',
}
```

Generation 3 pin example:

```ts
{
  generation: 3,
  variant: 2,
  family: 'diamond-weave',
  paletteMode: 'duotone',
  paletteVariant: 1,
}
```

The guestbook keeps optional selections in `lib/agent-guestbook-sigils.ts`, keyed by entry ID. Persist the identity inputs and selection tuple rather than raw SVG.

## Tasteful colour variation

Generation 1 and Generation 2 use the reviewed warm/cool/monochrome catalogue. Generation 3 expands that into deterministic palette families and modes while keeping colour subordinate to legibility.

Generation 3 palette modes include:

- monotone;
- duotone;
- tri-colour;
- material;
- luminous.

Every mode maps back to dominant/support/highlight/neutral roles for light, dark, and monochrome surfaces. Description text never changes the palette fingerprint.

## Composition grammar

Generation 1 and Generation 2 retain the original radial grammar families such as rosette, orbit, weave, tiles, and bloom.

Generation 3 adds graph-based construction families including triangular brace, hex cell, diamond weave, nested joint, broken lattice, star joint, and related quiet lattice variants. These are general geometric operations derived from researched construction mechanics, not copies of source motifs.

## Rendering

- `AgentSigil` renders Generation 1.
- `AgentIdentitySigil` renders Generation 1 or Generation 2 through the historical layered API.
- `AgentGeneration3Sigil` renders Generation 3.
- `GuestbookIdentitySigil` dispatches ordinary cards to Generation 3 and preserves explicit historical Generation 1/2 selections.

Headless renderers produce portable SVG and data URIs. The renderers accept bounded typed inputs, escape accessible labels, use transparent backgrounds, and avoid network/filesystem calls.

## Public identity record

A public identity keeps stable input plus a generation-specific selection:

```ts
{
  scope: string;
  designation: string;
  description?: string;
  generation: 1 | 2 | 3;
  selection?: Record<string, string | number>;
  fingerprint: string;
}
```

Generation-specific recipes retain their own renderer version and typed selection fields. The fingerprint is an inspection aid, not a security primitive.

## Visual review

`/sigil-lab` is the population-level authoring surface. Review:

- Generation 1, Generation 2, Kumiko construction studies, and combined Generation 3;
- repository/designation/description isolation;
- labels-hidden populations rather than one hand-picked mark;
- multiple projects and assignments;
- explicit variants;
- light and dark mode;
- mobile and desktop widths;
- 16, 24, 32, 48, and 72 px output;
- semantic palette stability and compact highlight reduction.

When a browser check adds useful evidence, run the focused Chromium spec:

```bash
pnpm exec playwright test tests/e2e/sigil-lab.spec.ts --project=chromium
```

Routine hosted CI covers lint, Vitest, and the production build. Visual inspection remains an author-side check.

## Standalone extraction

After the APIs settle further, extract them into a small repository/package with public entry points such as:

```text
@teamleaderleo/agent-sigils/core      generation and recipe types
@teamleaderleo/agent-sigils/svg       headless SVG and data URI rendering
@teamleaderleo/agent-sigils/react     React components
@teamleaderleo/agent-sigils/cli       optional file export adapter
```

The core package should remain dependency-light. PNG and WebP export belong in optional adapters rather than the deterministic generator.
