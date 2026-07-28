import { describe, expect, it } from 'vitest';

import {
  assertGeneration3PaletteContrast,
  GENERATION_3_MIN_ROLE_CONTRAST,
  generation3PaletteContrastFailures,
  generation3PaletteContrastRatio,
} from './agent-sigil-generation-3-palette-contrast';
import {
  createGeneration3PaletteRecipe,
  generation3PaletteCatalogue,
  generation3PaletteModes,
  type Generation3PaletteRole,
} from './agent-sigil-generation-3-palettes';

const baseIdentity = {
  scope: 'teamleaderleo/scrapbook',
  designation: 'Testing review',
};

const roles: Generation3PaletteRole[] = ['dominant', 'support', 'highlight', 'neutral'];
const hexColour = /^#[0-9a-f]{6}$/i;

describe('Generation 3 palette foundation', () => {
  it('repeats the exact palette recipe for the same identity and variant', () => {
    expect(createGeneration3PaletteRecipe(baseIdentity)).toEqual(
      createGeneration3PaletteRecipe(baseIdentity),
    );
  });

  it('keeps description edits outside the palette seed', () => {
    const original = {
      ...baseIdentity,
      description: 'Found three actionable test findings.',
    };
    const revised = {
      ...baseIdentity,
      description: 'Reviewed compatibility and release documentation.',
    };

    const first = createGeneration3PaletteRecipe({
      scope: original.scope,
      designation: original.designation,
    });
    const second = createGeneration3PaletteRecipe({
      scope: revised.scope,
      designation: revised.designation,
    });

    expect(second).toEqual(first);
  });

  it('supports every reviewed mode with at least two explicit families', () => {
    for (const paletteMode of generation3PaletteModes) {
      const families = generation3PaletteCatalogue.filter(
        (family) => family.mode === paletteMode,
      );
      expect(families.length).toBeGreaterThanOrEqual(2);

      const recipe = createGeneration3PaletteRecipe({ ...baseIdentity, paletteMode });
      expect(recipe.mode).toBe(paletteMode);
      expect(families.map((family) => family.id)).toContain(recipe.familyId);
    }
  });

  it('stores two reviewed variants with bounded semantic roles in every family', () => {
    expect(generation3PaletteCatalogue).toHaveLength(10);

    for (const family of generation3PaletteCatalogue) {
      expect(family.id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      expect(family.label.length).toBeGreaterThan(0);
      expect(family.variants).toHaveLength(2);

      for (const variant of family.variants) {
        expect(variant.id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
        expect(variant.label.length).toBeGreaterThan(0);

        for (const surface of [variant.light, variant.dark, variant.monochrome]) {
          expect(Object.keys(surface).sort()).toEqual([...roles].sort());
          for (const role of roles) expect(surface[role]).toMatch(hexColour);
        }

        expect(new Set(Object.values(variant.light)).size).toBe(roles.length);
        expect(new Set(Object.values(variant.dark)).size).toBe(roles.length);
      }
    }
  });

  it('rejects catalogue colours that collapse into the neutral role', () => {
    expect(GENERATION_3_MIN_ROLE_CONTRAST).toBe(1.5);
    expect(generation3PaletteContrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5);

    for (const family of generation3PaletteCatalogue) {
      for (const variant of family.variants) {
        expect(generation3PaletteContrastFailures(variant)).toEqual([]);
        expect(() => assertGeneration3PaletteContrast(variant)).not.toThrow();
      }
    }

    const source = generation3PaletteCatalogue[0]!.variants[0]!;
    const collapsed = {
      ...source,
      light: {
        ...source.light,
        dominant: source.light.neutral,
      },
    };
    expect(generation3PaletteContrastFailures(collapsed)).toEqual([
      expect.objectContaining({
        paletteId: collapsed.id,
        surface: 'light',
        role: 'dominant',
        ratio: 1,
      }),
    ]);
    expect(() => assertGeneration3PaletteContrast(collapsed)).toThrow(/fails the contrast floor/i);
  });

  it('keeps the family stable while palette variants reroll inside it', () => {
    const original = createGeneration3PaletteRecipe(baseIdentity);
    const reroll = createGeneration3PaletteRecipe({ ...baseIdentity, paletteVariant: 1 });

    expect(reroll.paletteVariant).toBe(1);
    expect(reroll.familyId).toBe(original.familyId);
    expect(reroll.variantId).not.toBe(original.variantId);
    expect(reroll.fingerprint).not.toBe(original.fingerprint);
    expect(reroll).toEqual(
      createGeneration3PaletteRecipe({ ...baseIdentity, paletteVariant: 1 }),
    );
  });

  it('produces a varied but bounded automatic population', () => {
    const recipes = Array.from({ length: 80 }, (_, index) =>
      createGeneration3PaletteRecipe({
        scope: `owner/project-${index % 9}`,
        designation: `Agent designation ${index}`,
        paletteVariant: index % 4,
      }),
    );

    expect(new Set(recipes.map((recipe) => recipe.familyId)).size).toBeGreaterThanOrEqual(7);
    expect(new Set(recipes.map((recipe) => recipe.mode))).toEqual(
      new Set(generation3PaletteModes),
    );
  });

  it('rejects empty, unbounded, unsupported, or non-finite inputs', () => {
    expect(() =>
      createGeneration3PaletteRecipe({ scope: ' ', designation: 'Testing review' }),
    ).toThrow(/scope must not be empty/i);
    expect(() =>
      createGeneration3PaletteRecipe({ scope: 'teamleaderleo/scrapbook', designation: ' ' }),
    ).toThrow(/designation must not be empty/i);
    expect(() =>
      createGeneration3PaletteRecipe({
        scope: 'teamleaderleo/scrapbook',
        designation: 'x'.repeat(161),
      }),
    ).toThrow(/designation must contain at most 160/i);
    expect(() =>
      createGeneration3PaletteRecipe({
        ...baseIdentity,
        paletteVariant: Number.POSITIVE_INFINITY,
      }),
    ).toThrow(/variant must be between/i);
    expect(() =>
      createGeneration3PaletteRecipe({
        ...baseIdentity,
        paletteMode: 'rainbow' as never,
      }),
    ).toThrow(/unsupported Generation 3 palette mode/i);
  });
});
