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

  it('renders a complete plain-text copy with the lazy operator link', () => {
    const rendered = renderOperatorPhrasebookText();

    for (const phrase of operatorPhrases) {
      expect(rendered).toContain(`${phrase.label}:`);
      expect(rendered).toContain(phrase.text);
    }

    expect(rendered).toContain('https://teamleaderleo.com/operator');
    expect(rendered).toContain('Current direct messages override this page.');
  });
});
