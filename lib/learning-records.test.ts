import { describe, expect, it } from 'vitest';
import type { Item } from '@/app/lib/item-types';
import {
  getReadableLearningRecord,
  learningRecordFixtures,
  projectSpaceItemToLearningRecord,
  publicLearningRecords,
  readableLearningRecords,
} from './learning-records';

describe('revisioned learning records', () => {
  it('renders ten public fixtures across code, interviews, design, and non-code learning', () => {
    expect(publicLearningRecords).toHaveLength(10);
    expect(publicLearningRecords.map(record => record.slug)).toEqual(
      expect.arrayContaining([
        'stateful-regex-api-boundaries',
        'interviewing-with-ai-as-a-review-loop',
        'dense-mobile-reading-without-scroll-traps',
        'learning-from-disagreement',
      ])
    );
    expect(
      new Set(publicLearningRecords.map(record => record.mode)).size
    ).toBeGreaterThanOrEqual(5);
  });

  it('keeps ids, revision ids, URLs, provenance, and typed relations inspectable', () => {
    for (const record of learningRecordFixtures) {
      expect(record.id).toBe(`learning:${record.slug}`);
      expect(record.canonicalUrl).toBe(`/space/records/${record.slug}`);
      expect(record.revisions.length).toBeGreaterThan(0);
      expect(new Set(record.revisions.map(revision => revision.id)).size).toBe(
        record.revisions.length
      );
      record.revisions.forEach((revision, index) => {
        expect(revision.id).toBe(`${record.id}@r${index + 1}`);
        expect(
          revision.sourceIds.every(sourceId =>
            record.sources.some(source => source.id === sourceId)
          )
        ).toBe(true);
      });
      for (const edge of record.relations) {
        expect(edge.type).toMatch(
          /^(prerequisite|explains|contrasts|example|implementation|question|revisit)$/
        );
        expect(edge.reason.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('publishes selected Q&A without leaking private records or editorial text', () => {
    expect(readableLearningRecords).toHaveLength(11);
    expect(
      getReadableLearningRecord('unlisted-record-shape-study')
    ).toBeDefined();
    expect(
      getReadableLearningRecord('private-working-conversation')
    ).toBeUndefined();

    const publicJson = JSON.stringify(readableLearningRecords);
    expect(publicJson).not.toContain('PRIVATE_');
    expect(publicJson).not.toContain('privateEditorial');
    expect(publicJson).not.toContain('conversationRefs');
    expect(publicJson).not.toContain('reviewSchedule');
    expect(publicJson).not.toContain('ownerToken');

    const promotedQa = getReadableLearningRecord(
      'stateful-regex-api-boundaries'
    )?.selectedQas[0];
    expect(promotedQa?.curation).toEqual({
      mode: 'owner-selected-excerpt',
      rawTranscriptPublished: false,
    });
  });

  it('projects an existing Space item without losing its stable source identity', () => {
    const item: Item = {
      id: 'a0a3d0bd-5893-4f6d-b4ca-19ef6b3bf56f',
      slug: 'cache-authority',
      title: 'Cache authority',
      url: 'https://github.com/example/repository/blob/abc/cache.ts',
      defaultIndex: 0,
      versions: [
        {
          label: 'Explanation',
          content: '# Cache authority\n\nThe current explanation.',
          contentHtml:
            '<h1>Cache authority</h1><p>The current explanation.</p>',
          code: null,
          codeHtml: '',
        },
      ],
      tags: ['source:fieldwork', 'mode:review'],
      category: 'review',
      createdAt: Date.UTC(2026, 7, 1),
      updatedAt: Date.UTC(2026, 7, 11),
      review: {
        state: 2,
        due: Date.UTC(2026, 7, 20),
        last_review: Date.UTC(2026, 7, 10),
        stability: 1,
        difficulty: 2,
        scheduled_days: 9,
        learning_steps: 0,
        reps: 2,
        lapses: 0,
        suspended: false,
      },
    };

    const record = projectSpaceItemToLearningRecord(item);
    expect(record).toMatchObject({
      id: `space:${item.id}`,
      slug: item.slug,
      canonicalUrl: `/space/records/${item.slug}`,
      provenance: {
        kind: 'space-item-projection',
        sourceItemId: item.id,
        sourceSlug: item.slug,
        sourceUpdatedAt: item.updatedAt,
      },
    });
    expect(record.sources[0]?.href).toBe(item.url);
    expect(JSON.stringify(record)).not.toContain('scheduled_days');
    expect(JSON.stringify(record)).not.toContain('last_review');
  });
});
