import { describe, expect, it } from 'vitest';
import {
  censorRuleFromWords,
  segmentCensoredText,
  STRONG_PROFANITY_CENSOR_RULES,
} from './censor-reveal';

describe('censor reveal matching', () => {
  it('finds strong profanity while preserving the original text', () => {
    const segments = segmentCensoredText(
      'Bobs have my fucking heart and that shit is staying.'
    );

    expect(segments.filter(segment => segment.censored)).toEqual([
      { text: 'fucking', censored: true, ruleIds: ['fuck'] },
      { text: 'shit', censored: true, ruleIds: ['shit'] },
    ]);
    expect(segments.map(segment => segment.text).join('')).toBe(
      'Bobs have my fucking heart and that shit is staying.'
    );
  });

  it('supports deliberate non-profanity censor rules', () => {
    const privateNames = censorRuleFromWords('private-name', ['Mothbit', 'Luna']);
    const segments = segmentCensoredText(
      'Mothbit met Luna at the workbench.',
      [privateNames]
    );

    expect(segments.filter(segment => segment.censored).map(segment => segment.text)).toEqual([
      'Mothbit',
      'Luna',
    ]);
  });

  it('does not mutate caller-owned regular expression cursors', () => {
    const pattern = /fuck/gi;
    pattern.lastIndex = 2;

    segmentCensoredText('fuck fuck', [{ id: 'test', pattern }]);

    expect(pattern.lastIndex).toBe(2);
  });

  it('merges overlapping matches into one covered range', () => {
    const segments = segmentCensoredText('motherfucker', [
      ...STRONG_PROFANITY_CENSOR_RULES,
      { id: 'whole', pattern: /motherfucker/gi },
    ]);

    expect(segments).toEqual([
      {
        text: 'motherfucker',
        censored: true,
        ruleIds: ['fuck', 'whole'],
      },
    ]);
  });
});
