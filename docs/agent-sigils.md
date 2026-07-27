# Agent sigils

Agent sigils are deterministic generated identities built from a versioned recipe. They are not selected from a fixed icon pool and they do not require stored image assets.

## Identity contract

The stable identity input is:

```text
renderer version + nonce + complexity + palette mode + seed
```

`createAgentSigilRecipe` hashes that input, initializes a small deterministic PRNG, selects one composition family and palette, and emits bounded serializable SVG elements.

```ts
import { generateAgentSigil } from '@/lib/agent-sigils';

const generated = generateAgentSigil({
  seed: 'Testing review',
  version: 1,
  nonce: 0,
  palette: 'auto',
  complexity: 'regular',
});

console.log(generated.recipe.fingerprint);
console.log(generated.svg);
console.log(generated.dataUri);
```

The same options must always produce the same recipe and SVG. A deliberate reroll increments `nonce`. Existing identities should not be silently rerolled.

## Composition families

Version 1 contains five grammars:

- `rosette`: radial ellipses with a layered centre;
- `orbit`: overlapping circular satellites and inner rings;
- `weave`: rotated rounded arms forming a pinwheel or knot;
- `tiles`: rounded square or diamond modules around a centre;
- `bloom`: translucent overlapping lobes with a compact core.

The families are made from general geometric primitives. They must not reproduce a reference symbol one-for-one.

## Rendering

`AgentSigil` renders the recipe as React SVG. `renderAgentSigilSvg` produces portable headless markup for downloads, automation, and future command-line use.

The renderer:

- accepts no raw SVG fragments;
- emits circles, ellipses, and rounded rectangles only;
- escapes accessible labels;
- bounds seed length, element count, output size, and export dimensions;
- uses transparent backgrounds;
- remains readable at 24–48 px;
- makes no network or filesystem calls.

## Versioning

A renderer version is part of the identity. Geometry or palette changes that would alter existing recipes require a new version rather than mutating version 1.

Persist this tuple when a sigil becomes a public identity:

```ts
{
  seed: string;
  version: number;
  nonce: number;
  palette: 'auto' | 'warm' | 'cool' | 'mono';
  complexity: 'quiet' | 'regular' | 'dense';
  fingerprint: string;
}
```

The fingerprint is an inspection aid, not a security primitive.

## Review fence

`/sigil-lab` is the visual review surface. Guestbook cards and other production lists should not adopt generated sigils until the lab population has been reviewed in:

- light and dark mode;
- mobile and desktop widths;
- Chromium and WebKit;
- 24, 32, 48, and 72 px output;
- multiple seeds, families, palettes, and nonce rerolls.

Avoid approving one hand-picked mark. The population is the product.

## Standalone extraction

Once the version 1 recipe and renderer are accepted, extract the pure module into a small package and repository with three public entry points:

```text
@teamleaderleo/agent-sigils/core   recipe generation and types
@teamleaderleo/agent-sigils/svg    headless SVG and data URI rendering
@teamleaderleo/agent-sigils/react  React component
```

A later CLI can expose:

```console
agent-sigil "Testing review" --size 128 --format svg
agent-sigil "Testing review" --nonce 1 --format png
agent-sigil batch seeds.txt --output ./sigils
```

The standalone package should remain dependency-light. PNG/WebP export may use an optional adapter rather than adding a raster dependency to the core generator.
