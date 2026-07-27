import { describe, expect, it } from 'vitest';

import {
  AGENT_SIGIL_RENDERER_VERSION,
  agentSigilFamilies,
  createAgentSigilRecipe,
  generateAgentSigil,
  renderAgentSigilSvg,
} from './agent-sigils';

describe('agent sigils', () => {
  it('repeats the exact recipe for the same versioned seed', () => {
    const options = {
      seed: 'Testing review',
      nonce: 3,
      complexity: 'dense' as const,
      palette: 'cool' as const,
    };

    expect(createAgentSigilRecipe(options)).toEqual(createAgentSigilRecipe(options));
    expect(createAgentSigilRecipe(options).version).toBe(AGENT_SIGIL_RENDERER_VERSION);
  });

  it('changes the fingerprint and geometry when the nonce changes', () => {
    const original = createAgentSigilRecipe({ seed: 'Testing review', nonce: 0 });
    const reroll = createAgentSigilRecipe({ seed: 'Testing review', nonce: 1 });

    expect(reroll.fingerprint).not.toBe(original.fingerprint);
    expect(reroll.elements).not.toEqual(original.elements);
  });

  it('uses all composition families across a broad deterministic population', () => {
    const families = new Set(
      Array.from({ length: 256 }, (_, index) =>
        createAgentSigilRecipe({ seed: `population-${index}` }),
      ).map((recipe) => recipe.family),
    );

    expect(families).toEqual(new Set(agentSigilFamilies));
  });

  it('keeps recipes and SVG output bounded', () => {
    for (let index = 0; index < 96; index += 1) {
      const recipe = createAgentSigilRecipe({
        seed: `bounded-${index}`,
        complexity: index % 3 === 0 ? 'dense' : index % 2 === 0 ? 'quiet' : 'regular',
      });
      const svg = renderAgentSigilSvg(recipe);

      expect(recipe.elements.length).toBeGreaterThan(3);
      expect(recipe.elements.length).toBeLessThanOrEqual(48);
      expect(svg.length).toBeLessThan(20_000);
      expect(svg.startsWith('<svg')).toBe(true);
      expect(svg.endsWith('</svg>')).toBe(true);
      expect(svg).not.toContain('<script');

      for (const element of recipe.elements) {
        const numericValues = Object.values(element).filter(
          (value): value is number => typeof value === 'number',
        );
        expect(numericValues.every(Number.isFinite)).toBe(true);
        if (element.transform) {
          expect(element.transform).toMatch(/^[a-zA-Z0-9().,\-\s]+$/);
        }
      }
    }
  });

  it('honours palette groups without storing image assets', () => {
    const warm = createAgentSigilRecipe({ seed: 'warm', palette: 'warm' });
    const cool = createAgentSigilRecipe({ seed: 'cool', palette: 'cool' });
    const mono = createAgentSigilRecipe({ seed: 'mono', palette: 'mono' });

    expect(warm.palette.group).toBe('warm');
    expect(cool.palette.group).toBe('cool');
    expect(mono.palette.group).toBe('mono');
  });

  it('escapes accessible labels in headless SVG output', () => {
    const recipe = createAgentSigilRecipe({ seed: 'label test' });
    const svg = renderAgentSigilSvg(recipe, { label: 'A < B & "C"' });

    expect(svg).toContain('aria-label="A &lt; B &amp; &quot;C&quot;"');
  });

  it('returns a portable data URI and inspectable recipe', () => {
    const generated = generateAgentSigil({ seed: 'portable identity' });

    expect(generated.dataUri.startsWith('data:image/svg+xml,')).toBe(true);
    expect(generated.svg).toContain(generated.recipe.fingerprint);
    expect(generated.accessibleLabel).toContain(generated.recipe.family);
  });

  it('rejects empty and unbounded seeds', () => {
    expect(() => createAgentSigilRecipe({ seed: '   ' })).toThrow(/must not be empty/i);
    expect(() => createAgentSigilRecipe({ seed: 'x'.repeat(257) })).toThrow(/at most 256/i);
  });
});
