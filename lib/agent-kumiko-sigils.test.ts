import { describe, expect, it } from 'vitest';

import {
  agentKumikoFamilies,
  agentKumikoOccupancyDistance,
  createAgentKumikoSigilRecipe,
  createDistinctAgentKumikoPopulation,
  generateAgentKumikoSigil,
  renderAgentKumikoSigilSvg,
} from './agent-kumiko-sigils';

const baseIdentity = {
  scope: 'teamleaderleo/scrapbook',
  designation: 'Testing review',
  description: 'Found three actionable test findings in the current patch.',
  family: 'diamond-weave' as const,
};

describe('experimental Kumiko-informed agent sigils', () => {
  it('repeats the exact construction graph for the same layered inputs', () => {
    expect(createAgentKumikoSigilRecipe(baseIdentity)).toEqual(
      createAgentKumikoSigilRecipe(baseIdentity),
    );
  });

  it('keeps description changes inside the accent layer', () => {
    const original = createAgentKumikoSigilRecipe(baseIdentity);
    const reassigned = createAgentKumikoSigilRecipe({
      ...baseIdentity,
      description: 'Reviewed release documentation and compatibility notes.',
    });

    expect(reassigned.graphFingerprint).toBe(original.graphFingerprint);
    expect(reassigned.occupancyDescriptor).toBe(original.occupancyDescriptor);
    expect(reassigned.layerFingerprints.lattice).toBe(original.layerFingerprints.lattice);
    expect(reassigned.layerFingerprints.infill).toBe(original.layerFingerprints.infill);
    expect(reassigned.layerFingerprints.palette).toBe(original.layerFingerprints.palette);
    expect(reassigned.layerFingerprints.accents).not.toBe(
      original.layerFingerprints.accents,
    );
    expect(reassigned.paletteName).toBe(original.paletteName);
  });

  it('lets scope alter the lattice without recolouring from the description', () => {
    const original = createAgentKumikoSigilRecipe(baseIdentity);
    const moved = createAgentKumikoSigilRecipe({
      ...baseIdentity,
      scope: 'teamleaderleo/stensibly',
    });

    expect(moved.layerFingerprints.lattice).not.toBe(
      original.layerFingerprints.lattice,
    );
    expect(moved.graphFingerprint).not.toBe(original.graphFingerprint);
  });

  it('lets designation alter infill while keeping description out of palette selection', () => {
    const original = createAgentKumikoSigilRecipe(baseIdentity);
    const renamed = createAgentKumikoSigilRecipe({
      ...baseIdentity,
      designation: 'Context review',
    });
    const wordingOnly = createAgentKumikoSigilRecipe({
      ...baseIdentity,
      description: 'A completely different assignment sentence.',
    });

    expect(renamed.layerFingerprints.infill).not.toBe(
      original.layerFingerprints.infill,
    );
    expect(wordingOnly.layerFingerprints.palette).toBe(
      original.layerFingerprints.palette,
    );
  });

  it('provides eight visibly different construction families', () => {
    const recipes = agentKumikoFamilies.map((family) =>
      createAgentKumikoSigilRecipe({
        scope: `lab/${family}`,
        designation: 'Lattice specimen',
        description: 'Highlight one reviewed joint.',
        family,
        complexity: 'regular',
      }),
    );

    expect(new Set(recipes.map((recipe) => recipe.graphFingerprint)).size).toBe(
      agentKumikoFamilies.length,
    );
    expect(new Set(recipes.map((recipe) => recipe.occupancyDescriptor)).size).toBe(
      agentKumikoFamilies.length,
    );
    expect(recipes.every((recipe) => recipe.protectedVoids >= 2)).toBe(true);
  });

  it('selects a deterministic population with separated occupancy descriptors', () => {
    const inputs = agentKumikoFamilies.map((family, index) => ({
      scope: `population/project-${index}`,
      designation: `Review designation ${index}`,
      description: `Assignment ${index}`,
      family,
    }));
    const first = createDistinctAgentKumikoPopulation(inputs, {
      minimumOccupancyDistance: 8,
    });
    const second = createDistinctAgentKumikoPopulation(inputs, {
      minimumOccupancyDistance: 8,
    });

    expect(first).toEqual(second);
    expect(new Set(first.map((recipe) => recipe.graphFingerprint)).size).toBe(
      first.length,
    );

    for (let left = 0; left < first.length; left += 1) {
      for (let right = left + 1; right < first.length; right += 1) {
        expect(
          agentKumikoOccupancyDistance(
            first[left]!.occupancyDescriptor,
            first[right]!.occupancyDescriptor,
          ),
        ).toBeGreaterThanOrEqual(8);
      }
    }
  });

  it('keeps output bounded, portable, and legible as monochrome SVG', () => {
    for (let index = 0; index < 96; index += 1) {
      const generated = generateAgentKumikoSigil({
        scope: `owner/project-${index % 11}`,
        designation: `Agent designation ${index}`,
        description: `Assignment description ${index % 13}`,
        variant: index % 7,
        family: agentKumikoFamilies[index % agentKumikoFamilies.length],
        complexity:
          index % 3 === 0 ? 'dense' : index % 2 === 0 ? 'quiet' : 'regular',
      });
      const monochrome = renderAgentKumikoSigilSvg(generated.recipe, {
        size: 24,
        monochrome: true,
      });

      expect(generated.recipe.nodes.length).toBeGreaterThanOrEqual(6);
      expect(generated.recipe.struts.length).toBeGreaterThanOrEqual(5);
      expect(generated.recipe.struts.length).toBeLessThanOrEqual(36);
      expect(generated.svg.length).toBeLessThan(20_000);
      expect(generated.dataUri.startsWith('data:image/svg+xml,')).toBe(true);
      expect(generated.svg).not.toContain('<script');
      expect(monochrome).toContain('currentColor');
      expect(monochrome).toContain('width="24"');
    }
  });

  it('rejects empty and unbounded identity fields', () => {
    expect(() =>
      createAgentKumikoSigilRecipe({ scope: ' ', designation: 'Testing review' }),
    ).toThrow(/scope must not be empty/i);
    expect(() =>
      createAgentKumikoSigilRecipe({
        scope: 'teamleaderleo/scrapbook',
        designation: ' ',
      }),
    ).toThrow(/designation must not be empty/i);
    expect(() =>
      createAgentKumikoSigilRecipe({
        scope: 'teamleaderleo/scrapbook',
        designation: 'Testing review',
        description: 'x'.repeat(513),
      }),
    ).toThrow(/description must contain at most 512/i);
  });
});
