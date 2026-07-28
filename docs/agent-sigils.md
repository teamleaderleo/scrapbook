# Agent sigils

Agent sigils are deterministic generated identities. They are not selected from a finite icon pool, do not require stored image assets, and are not tokens or financial objects.

## Two different kinds of versioning

Do not collapse renderer compatibility and visual lineage into one number.

- **Renderer version** describes the code and serialization contract. A renderer change must not alter an existing recipe for that renderer version.
- **Generation** describes a visual identity lineage. Generation 1 and Generation 2 can remain available beside each other indefinitely.

A new generation adds choices. It does not rewrite an old identity.

## Research and future generations

Historical context, transferable construction methods, source links, and cultural guardrails live in:

- [`docs/design/agent-sigil-reference-atlas.md`](design/agent-sigil-reference-atlas.md);
- [`docs/design/agent-sigil-generation-3-principles.md`](design/agent-sigil-generation-3-principles.md).

The atlas covers Kumiko and Japanese architectural latticework, mandala-like concentric organisation, Islamic geometric systems, jali screens, hitomezashi, Bauhaus weaving, Penrose systems, scientific diagrams, and historical colour systems. It records what may be abstracted and what must not be traced or presented as authentic craft.

Generation 3 is tracked in issues [#443](https://github.com/teamleaderleo/scrapbook/issues/443), [#447](https://github.com/teamleaderleo/scrapbook/issues/447), [#448](https://github.com/teamleaderleo/scrapbook/issues/448), and [#449](https://github.com/teamleaderleo/scrapbook/issues/449). It remains lab-only until its full visual population is explicitly approved.

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

## Picking and pinning a favourite

A generated default needs no stored metadata. When somebody prefers a particular result, persist the selection tuple:

```ts
{
  generation: 2,
  variant: 3,
  palette: 'cool',
  complexity: 'regular',
}
```

The guestbook keeps optional selections in `lib/agent-guestbook-sigils.ts`, keyed by entry ID. Entries without a sidecar selection use Generation 2, variant 0, automatic palette, and regular complexity.

Do not persist raw SVG merely to pin an identity. Persist the identity inputs and selection tuple so the result stays inspectable and reproducible.

## Tasteful colour variation

Palette selection is deterministic and bounded to the reviewed palette catalogue. `auto` may choose among warm, cool, and monochrome palettes. A caller may constrain the result to `warm`, `cool`, or `mono`.

Colour randomness must remain subordinate to legibility:

- transparent background;
- readable silhouette at 24–48 px;
- sufficient light- and dark-mode contrast;
- no arbitrary fully random RGB output;
- no unbounded gradients or filters.

A future generation may expand the palette catalogue, but it must not mutate Generation 1 or Generation 2 recipes.

## Composition grammar

The underlying renderer currently contains five primary grammars:

- `rosette`: radial ellipses with a layered centre;
- `orbit`: overlapping circular satellites and inner rings;
- `weave`: rotated rounded arms forming a pinwheel or knot;
- `tiles`: rounded square or diamond modules around a centre;
- `bloom`: translucent overlapping lobes with a compact core.

Generation 2 combines a designation grammar with a repository frame and assignment accents. These are general geometric rules and must not reproduce a reference symbol one-for-one.

## Rendering

`AgentSigil` renders Generation 1. `AgentIdentitySigil` renders Generation 1 or Generation 2 through the layered identity API.

Headless renderers produce portable SVG and data URIs for automation and later downloads. The renderers:

- accept no raw SVG fragments;
- emit circles, ellipses, and rounded rectangles only;
- escape accessible labels;
- bound identity input length, element count, output size, and export dimensions;
- use transparent backgrounds;
- make no network or filesystem calls.

## Public identity record

When a sigil becomes a public identity, preserve:

```ts
{
  scope: string;
  designation: string;
  description?: string;
  rendererVersion: number;
  generation: 1 | 2;
  variant: number;
  palette: 'auto' | 'warm' | 'cool' | 'mono';
  complexity: 'quiet' | 'regular' | 'dense';
  fingerprint: string;
}
```

The fingerprint is an inspection aid, not a security primitive.

## Visual review

`/sigil-lab` is the population-level review surface. Review:

- Generation 1 beside Generation 2;
- repository, designation, and description layer isolation;
- multiple projects and assignments;
- explicit variants;
- light and dark mode;
- mobile and desktop widths;
- Chromium and WebKit;
- 24, 32, 48, and 72 px output.

Avoid approving one hand-picked mark. The generated population is the product.

## Standalone extraction

After the layered API settles, extract it into a small repository and package with public entry points such as:

```text
@teamleaderleo/agent-sigils/core      generation and recipe types
@teamleaderleo/agent-sigils/svg       headless SVG and data URI rendering
@teamleaderleo/agent-sigils/react     React components
@teamleaderleo/agent-sigils/cli       optional file export adapter
```

The core package should remain dependency-light. PNG and WebP export belong in optional adapters rather than the deterministic generator.
