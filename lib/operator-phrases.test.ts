import { describe, expect, it } from 'vitest';
import {
  operatorPhraseGroups,
  operatorPhrases,
  renderOperatorPhrasebookText,
} from './operator-phrases';

describe('operator phrasebook', () => {
  it('keeps phrase and group identities unique and every phrase grouped', () => {
    expect(new Set(operatorPhraseGroups.map(group => group.id)).size).toBe(
      operatorPhraseGroups.length
    );
    expect(new Set(operatorPhrases.map(phrase => phrase.id)).size).toBe(
      operatorPhrases.length
    );

    const groups = new Set(operatorPhraseGroups.map(group => group.id));
    expect(operatorPhrases.every(phrase => groups.has(phrase.group))).toBe(true);
  });

  it('keeps one featured phrase in every group for the homepage', () => {
    for (const group of operatorPhraseGroups) {
      expect(
        operatorPhrases.filter(
          phrase => phrase.group === group.id && phrase.featured
        )
      ).toHaveLength(1);
    }
  });

  it('features the perspective pass as the default review nudge', () => {
    const phrase = operatorPhrases.find(item => item.id === 'perspective-pass');

    expect(phrase).toMatchObject({
      group: 'review',
      label: 'Perspective pass',
      featured: true,
    });
    expect(phrase?.text).toContain('observed, inferred, assumed, and speculative');
    expect(phrase?.text).toContain('simplest recommendation');
  });

  it('renders a complete plain-text copy with stable phrase references', () => {
    const rendered = renderOperatorPhrasebookText();

    for (const phrase of operatorPhrases) {
      expect(rendered).toContain(`${phrase.label}:`);
      expect(rendered).toContain(
        `Reference: https://teamleaderleo.com/operator#${phrase.id}`
      );
      expect(rendered).toContain(phrase.text);
    }

    expect(rendered).toContain('https://teamleaderleo.com/operator');
    expect(rendered).toContain('Current direct messages override this page.');
  });
});
