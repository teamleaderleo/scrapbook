import { describe, expect, it } from 'vitest';
import {
  buildSpaceNextMove,
  buildSpacePracticePrompt,
  buildSpaceTypingTarget,
  compareSpaceTyping,
  parseSpaceNextMoveStage,
  parseSpacePracticeMode,
  spacePracticeStorageKey,
  spaceTypingWpm,
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
      mode: 'alter',
      label: 'Stress it',
    });
    expect(buildSpaceNextMove(study({ category: 'debug' }))).toMatchObject({
      mode: 'review',
      label: 'Review it',
    });
    expect(buildSpaceNextMove(study(), { learned: true })).toMatchObject({
      mode: 'explain',
      label: 'Transfer it',
    });
  });

  it('recognizes the expanded practice modes', () => {
    expect(parseSpacePracticeMode('trace')).toBe('trace');
    expect(parseSpacePracticeMode('review')).toBe('review');
    expect(parseSpacePracticeMode('alter')).toBe('alter');
    expect(parseSpacePracticeMode('type')).toBe('type');
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
    expect(spacePracticeStorageKey('cache-identity', 'type')).not.toBe(
      spacePracticeStorageKey('cache-identity', 'question')
    );
  });

  it('prefers exact code as a typing target', () => {
    expect(
      buildSpaceTypingTarget(
        study({
          versions: [
            {
              label: 'Implementation',
              content: 'The implementation publishes atomically.',
              contentHtml: '<p>The implementation publishes atomically.</p>',
              code: 'const next = await writeTemp();\nawait rename(next, live);',
              codeHtml: '',
            },
          ],
        })
      )
    ).toEqual({
      kind: 'code',
      label: 'Implementation code',
      text: 'const next = await writeTemp();\nawait rename(next, live);',
    });
  });

  it('falls back to a fenced code block before prose', () => {
    expect(
      buildSpaceTypingTarget(
        study({
          versions: [
            {
              label: 'Example',
              content: 'Try this:\n\n```ts\nconst value = cache.get(key);\n```\n\nThen explain it.',
              contentHtml: '',
              code: null,
              codeHtml: '',
            },
          ],
        })
      )
    ).toEqual({
      kind: 'code',
      label: 'Example code',
      text: 'const value = cache.get(key);',
    });
  });

  it('turns readable markdown into a bounded prose typing target', () => {
    const target = buildSpaceTypingTarget(
      study({
        versions: [
          {
            label: 'Talking points',
            content:
              '# Retry semantics\n\n**Idempotency** keeps a repeated request safe. [Retries](https://example.com) still need a stable key.',
            contentHtml: '',
            code: null,
            codeHtml: '',
          },
        ],
      })
    );

    expect(target).toEqual({
      kind: 'prose',
      label: 'Talking points excerpt',
      text: 'Retry semantics\n\nIdempotency keeps a repeated request safe. Retries still need a stable key.',
    });
  });

  it('scores exactness, overflow, and completion without fuzzy matching', () => {
    expect(compareSpaceTyping('cache', 'caxhe')).toMatchObject({
      correctCharacters: 4,
      errorCharacters: 1,
      overflowCharacters: 0,
      accuracy: 0.8,
      progress: 1,
      complete: false,
    });
    expect(compareSpaceTyping('cache', 'cache')).toMatchObject({
      correctCharacters: 5,
      errorCharacters: 0,
      complete: true,
    });
    expect(compareSpaceTyping('cache', 'cache!').overflowCharacters).toBe(1);
  });

  it('estimates words per minute from correct character throughput', () => {
    expect(spaceTypingWpm(50, 60_000)).toBe(10);
    expect(spaceTypingWpm(20, 500)).toBe(0);
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

  it('can carry a stable Scrapbook reading URL into another chat', () => {
    expect(
      buildSpacePracticePrompt({
        mode: 'trace',
        title: 'Trace the request',
        sourceUrl: null,
        studyUrl: 'https://example.com/space/read/trace-the-request',
        draft: '',
      })
    ).toContain('Scrapbook: https://example.com/space/read/trace-the-request');
  });

  it('includes the bounded reference when copying a typing exercise', () => {
    expect(
      buildSpacePracticePrompt({
        mode: 'type',
        title: 'Atomic cache publication',
        sourceUrl: null,
        draft: 'const next',
        typingTarget: {
          kind: 'code',
          label: 'Implementation code',
          text: 'const next = await writeTemp();',
        },
      })
    ).toContain(
      'Typing reference (Implementation code):\nconst next = await writeTemp();\n\nMy copy:\nconst next'
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
