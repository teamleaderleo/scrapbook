import { describe, expect, it } from 'vitest';

import {
  createAgentGeneration3SigilRecipe,
  createDistinctAgentGeneration3Population,
  generateAgentGeneration3Sigil,
  renderAgentGeneration3SigilSvg,
} from './agent-generation-3-sigils';
import { agentKumikoFamilies, agentKumikoOccupancyDistance } from './agent-kumiko-sigils';

const baseIdentity = {
  scope: 'teamleaderleo/scrapbook',
  designation: 'Testing review',
  description: 'Found three actionable test findings.',
  family: 'diamond-weave' as const,
  complexity: 'quiet' as const,
  paletteMode: 'tri-colour' as const,
};

describe('combined Generation 3 agent sigils', () => {
  it('repeats the exact combined recipe for the same inputs', () => {
    expect(createAgentGeneration3SigilRecipe(baseIdentity)).toEqual(
      createAgentGeneration3SigilRecipe(baseIdentity),
    );
  });

  it('keeps description edits inside the accent layer', () => {
    const original = createAgentGeneration3SigilRecipe(baseIdentity);
    const reassigned = createAgentGeneration3SigilRecipe({
      ...baseIdentity,
      description: 'Reviewed release documentation and compatibility notes.',
    });

    expect(reassigned.geometry.graphFingerprint).toBe(original.geometry.graphFingerprint);
    expect(reassigned.geometry.occupancyDescriptor).toBe(
      original.geometry.occupancyDescriptor,
    );
    expect(reassigned.palette).toEqual(original.palette);
    expect(reassigned.layerFingerprints.geometry).toBe(
      original.layerFingerprints.geometry,
    );
    expect(reassigned.layerFingerprints.palette).toBe(
      original.layerFingerprints.palette,
    );
    expect(reassigned.layerFingerprints.accents).not.toBe(
      original.layerFingerprints.accents,
    );
    expect(reassigned.fingerprint).not.toBe(original.fingerprint);
  });

  it('changes colour density without changing the construction graph', () => {
    const duotone = createAgentGeneration3SigilRecipe({
      ...baseIdentity,
      paletteMode: 'duotone',
    });
    const triColour = createAgentGeneration3SigilRecipe(baseIdentity);

    expect(duotone.geometry.graphFingerprint).toBe(
      triColour.geometry.graphFingerprint,
    );
    expect(duotone.geometry.occupancyDescriptor).toBe(
      triColour.geometry.occupancyDescriptor,
    );
    expect(duotone.layerFingerprints.palette).not.toBe(
      triColour.layerFingerprints.palette,
    );
  });

  it('keeps wrapped palette variants canonical in the combined identity', () => {
    const first = createAgentGeneration3SigilRecipe({
      ...baseIdentity,
      paletteVariant: 0,
    });
    const wrapped = createAgentGeneration3SigilRecipe({
      ...baseIdentity,
      paletteVariant: 2,
    });

    expect(wrapped.palette).toEqual(first.palette);
    expect(wrapped.palette.paletteVariant).toBe(0);
    expect(wrapped.fingerprint).toBe(first.fingerprint);
  });

  it('builds a deterministic graph-separated population', () => {
    const inputs = Array.from({ length: 18 }, (_, index) => ({
      scope: `owner/project-${index % 7}`,
      designation: `Agent designation ${index}`,
      description: `Assignment ${index}`,
      family: agentKumikoFamilies[index % agentKumikoFamilies.length],
      complexity: 'quiet' as const,
    }));
    const first = createDistinctAgentGeneration3Population(inputs, {
      minimumOccupancyDistance: 8,
    });
    const second = createDistinctAgentGeneration3Population(inputs, {
      minimumOccupancyDistance: 8,
    });

    expect(first).toEqual(second);
    expect(new Set(first.map((recipe) => recipe.geometry.graphFingerprint)).size).toBe(
      first.length,
    );

    for (let left = 0; left < first.length; left += 1) {
      for (let right = left + 1; right < first.length; right += 1) {
        expect(
          agentKumikoOccupancyDistance(
            first[left]!.geometry.occupancyDescriptor,
            first[right]!.geometry.occupancyDescriptor,
          ),
        ).toBeGreaterThanOrEqual(8);
      }
    }
  });

  it('drops the highlight role in compact SVG without changing identity', () => {
    const recipe = createAgentGeneration3SigilRecipe(baseIdentity);
    const full = renderAgentGeneration3SigilSvg(recipe, {
      size: 48,
      surface: 'dark',
    });
    const compact = renderAgentGeneration3SigilSvg(recipe, {
      size: 24,
      surface: 'dark',
    });

    expect(full).toContain('data-generation-3-role="highlight"');
    expect(compact).not.toContain('data-generation-3-role="highlight"');
    expect(compact).toContain('data-generation-3-role="dominant"');
    expect(compact).toContain('data-generation-3-role="support"');
    expect(createAgentGeneration3SigilRecipe(baseIdentity).fingerprint).toBe(
      recipe.fingerprint,
    );
  });

  it('renders bounded light, dark, and monochrome portable SVG', () => {
    for (let index = 0; index < 96; index += 1) {
      const input = {
        scope: `owner/project-${index % 11}`,
        designation: `Agent designation ${index}`,
        description: `Assignment description ${index % 13}`,
        variant: index % 7,
        paletteVariant: index % 4,
        paletteMode:
          index % 3 === 0
            ? ('duotone' as const)
            : index % 2 === 0
              ? ('tri-colour' as const)
              : ('auto' as const),
        family: agentKumikoFamilies[index % agentKumikoFamilies.length],
        complexity: 'quiet' as const,
      };
      const generated = generateAgentGeneration3Sigil(input, {
        size: index % 2 === 0 ? 24 : 72,
        surface: index % 3 === 0 ? 'monochrome' : index % 2 === 0 ? 'dark' : 'light',
      });

      expect(generated.recipe.geometry.struts.length).toBeGreaterThanOrEqual(5);
      expect(generated.svg.length).toBeLessThan(20_000);
      expect(generated.svg).not.toContain('<script');
      expect(generated.dataUri.startsWith('data:image/svg+xml,')).toBe(true);
      expect(generated.accessibleLabel).toContain('Generation 3');
    }
  });
});
