import { describe, expect, it } from 'vitest';
import {
  buildSpacePracticePrompt,
  spacePracticeStorageKey,
} from './space-practice';

describe('Space practice prompts', () => {
  it('keeps local drafts isolated by study and practice mode', () => {
    expect(spacePracticeStorageKey('cache-identity', 'question')).toBe(
      'space:practice:cache-identity:question'
    );
    expect(spacePracticeStorageKey('cache-identity', 'trace')).not.toBe(
      spacePracticeStorageKey('cache-identity', 'question')
    );
  });

  it('builds a portable prompt with provenance and optional notes', () => {
    expect(
      buildSpacePracticePrompt({
        mode: 'trace',
        title: 'Atomic cache publication',
        sourceUrl: 'https://example.com/source',
        draft: '  Start at the temporary file.  ',
      })
    ).toBe(
      [
        'Trace one concrete input through the system, step by step.',
        '',
        'Study: Atomic cache publication',
        'Source: https://example.com/source',
        '',
        'My notes:',
        'Start at the temporary file.',
      ].join('\n')
    );
  });

  it('does not invent an empty notes block', () => {
    expect(
      buildSpacePracticePrompt({
        mode: 'question',
        title: 'A bounded question',
        sourceUrl: null,
        draft: '   ',
      })
    ).not.toContain('My notes:');
  });
});
