import { describe, expect, it } from 'vitest';
import {
  buildSpaceNextMove,
  buildSpacePracticePrompt,
  parseSpaceNextMoveStage,
  parseSpacePracticeMode,
  spacePracticeStorageKey,
} from './space-practice';
import type { Item } from '@/app/lib/item-types';

function study(overrides: Partial<Item> = {}): Item {
  return {
    id: 'study-id',
    title: 'Atomic cache publication',
    slug: 'atomic-cache-publication',
    url: 'https://example.com/source',
    defaultIndex: 0,
    versions: [
      {
        label: 'Note',
        content: 'A bounded explanation.',
        contentHtml: '<p>A bounded explanation.</p>',
        code: null,
        codeHtml: '',
      },
    ],
    tags: [],
    category: 'article',
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  };
}

describe('Space practice prompts', () => {
  it('triages studies into source-bounded next moves', () => {
    expect(
      buildSpaceNextMove(
        study({ category: 'trace', tags: ['topic:lifecycle'] })
      )
    ).toMatchObject({ mode: 'trace', label: 'Trace it' });
    expect(buildSpaceNextMove(study({ category: 'design' }))).toMatchObject({
      mode: 'question',
      label: 'Stress it',
    });
    expect(buildSpaceNextMove(study(), { learned: true })).toMatchObject({
      mode: 'explain',
      label: 'Transfer it',
    });
  });

  it('recognizes only supported practice modes', () => {
    expect(parseSpacePracticeMode('trace')).toBe('trace');
    expect(parseSpacePracticeMode('invented')).toBeUndefined();
    expect(parseSpacePracticeMode(undefined)).toBeUndefined();
    expect(parseSpaceNextMoveStage('familiar')).toBe('familiar');
    expect(parseSpaceNextMoveStage('learned')).toBe('learned');
    expect(parseSpaceNextMoveStage('fresh')).toBeUndefined();
  });

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

  it('copies a contextual prompt when one is supplied', () => {
    expect(
      buildSpacePracticePrompt({
        mode: 'trace',
        title: 'Atomic cache publication',
        sourceUrl: null,
        draft: '',
        prompt: 'Predict the first observable write.',
      })
    ).toContain('Predict the first observable write.');
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
