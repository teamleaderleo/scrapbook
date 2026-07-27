import { describe, expect, it } from 'vitest';

import {
  createAgentIdentitySigilRecipe,
  generateAgentIdentitySigil,
} from './agent-identity-sigils';
import { createAgentSigilRecipe } from './agent-sigils';

const baseIdentity = {
  scope: 'teamleaderleo/scrapbook',
  designation: 'Testing review',
  description: 'Found three actionable test findings in the current patch.',
};

describe('layered agent identity sigils', () => {
  it('repeats the exact generation-two recipe for the same layered inputs', () => {
    expect(createAgentIdentitySigilRecipe(baseIdentity)).toEqual(
      createAgentIdentitySigilRecipe(baseIdentity),
    );
  });

  it('changes only the frame layer when the repository scope changes', () => {
    const original = createAgentIdentitySigilRecipe(baseIdentity);
    const moved = createAgentIdentitySigilRecipe({
      ...baseIdentity,
      scope: 'teamleaderleo/stensibly',
    });

    expect(moved.layerFingerprints.frame).not.toBe(original.layerFingerprints.frame);
    expect(moved.layerFingerprints.glyph).toBe(original.layerFingerprints.glyph);
    expect(moved.layerFingerprints.accents).toBe(original.layerFingerprints.accents);
    expect(moved.paletteName).not.toBe('');
  });

  it('changes the glyph and accents when the designation changes but keeps the frame', () => {
    const original = createAgentIdentitySigilRecipe(baseIdentity);
    const renamed = createAgentIdentitySigilRecipe({
      ...baseIdentity,
      designation: 'Context review',
    });

    expect(renamed.layerFingerprints.frame).toBe(original.layerFingerprints.frame);
    expect(renamed.layerFingerprints.glyph).not.toBe(original.layerFingerprints.glyph);
    expect(renamed.layerFingerprints.accents).not.toBe(original.layerFingerprints.accents);
  });

  it('changes only the accent layer when the description changes', () => {
    const original = createAgentIdentitySigilRecipe(baseIdentity);
    const reassigned = createAgentIdentitySigilRecipe({
      ...baseIdentity,
      description: 'Reviewed the release notes and found one documentation correction.',
    });

    expect(reassigned.layerFingerprints.frame).toBe(original.layerFingerprints.frame);
    expect(reassigned.layerFingerprints.glyph).toBe(original.layerFingerprints.glyph);
    expect(reassigned.layerFingerprints.accents).not.toBe(original.layerFingerprints.accents);
  });

  it('preserves generation one as the exact flat-seed renderer', () => {
    const identity = createAgentIdentitySigilRecipe({
      ...baseIdentity,
      selection: { generation: 1, variant: 4, palette: 'cool', complexity: 'dense' },
    });
    const legacy = createAgentSigilRecipe({
      seed: baseIdentity.designation,
      nonce: 4,
      palette: 'cool',
      complexity: 'dense',
    });

    expect(identity.elements).toEqual(legacy.elements);
    expect(identity.fingerprint).toBe(legacy.fingerprint);
    expect(identity.generation).toBe(1);
  });

  it('uses the persisted variant to pin or deliberately reroll a generation', () => {
    const original = createAgentIdentitySigilRecipe(baseIdentity);
    const reroll = createAgentIdentitySigilRecipe({
      ...baseIdentity,
      selection: { generation: 2, variant: 1 },
    });

    expect(reroll.variant).toBe(1);
    expect(reroll.fingerprint).not.toBe(original.fingerprint);
    expect(reroll.elements).not.toEqual(original.elements);
  });

  it('keeps layered output bounded and portable', () => {
    for (let index = 0; index < 96; index += 1) {
      const generated = generateAgentIdentitySigil({
        scope: `owner/project-${index % 7}`,
        designation: `Agent designation ${index}`,
        description: `Assignment description ${index % 13}`,
        selection: {
          generation: index % 5 === 0 ? 1 : 2,
          variant: index % 4,
          complexity: index % 3 === 0 ? 'dense' : index % 2 === 0 ? 'quiet' : 'regular',
        },
      });

      expect(generated.recipe.elements.length).toBeGreaterThan(3);
      expect(generated.recipe.elements.length).toBeLessThanOrEqual(64);
      expect(generated.svg.length).toBeLessThan(24_000);
      expect(generated.dataUri.startsWith('data:image/svg+xml,')).toBe(true);
      expect(generated.svg).not.toContain('<script');
    }
  });

  it('rejects empty or unbounded identity fields', () => {
    expect(() =>
      createAgentIdentitySigilRecipe({ scope: ' ', designation: 'Testing review' }),
    ).toThrow(/scope must not be empty/i);
    expect(() =>
      createAgentIdentitySigilRecipe({ scope: 'teamleaderleo/scrapbook', designation: ' ' }),
    ).toThrow(/designation must not be empty/i);
    expect(() =>
      createAgentIdentitySigilRecipe({
        scope: 'teamleaderleo/scrapbook',
        designation: 'Testing review',
        description: 'x'.repeat(513),
      }),
    ).toThrow(/description must contain at most 512/i);
  });
});
