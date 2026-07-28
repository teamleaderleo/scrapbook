import { describe, expect, it } from 'vitest';

import { createGeneration3PaletteRecipe } from './agent-sigil-generation-3-palettes';

const identity = {
  scope: 'teamleaderleo/scrapbook',
  designation: 'Testing review',
};

describe('Generation 3 palette canonical identity', () => {
  it('gives identical resolved colours one canonical recipe and fingerprint', () => {
    const first = createGeneration3PaletteRecipe({ ...identity, paletteVariant: 0 });
    const wrapped = createGeneration3PaletteRecipe({ ...identity, paletteVariant: 2 });

    expect(wrapped).toEqual(first);
    expect(wrapped.paletteVariant).toBe(0);
    expect(wrapped.fingerprint).toBe(first.fingerprint);
  });

  it('keeps the other reviewed in-family variant distinct', () => {
    const first = createGeneration3PaletteRecipe({ ...identity, paletteVariant: 0 });
    const second = createGeneration3PaletteRecipe({ ...identity, paletteVariant: 1 });

    expect(second.paletteVariant).toBe(1);
    expect(second.variantId).not.toBe(first.variantId);
    expect(second.fingerprint).not.toBe(first.fingerprint);
  });
});
