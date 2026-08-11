import { describe, expect, it } from 'vitest';
import { agentJournalEntries } from './agent-journal';
import { botDeskEntries } from './bot-desk';
import {
  getRelatedScrapbookRefs,
  scrapbookRelations,
  type ScrapbookArtifact,
} from './scrapbook-relations';

const publicArtifacts = new Map<string, ScrapbookArtifact>([
  ...botDeskEntries.map(
    entry =>
      [
        `desk:${entry.slug}`,
        {
          surface: 'desk' as const,
          id: entry.slug,
          href: `/desk/${entry.slug}`,
          title: entry.title,
        },
      ] as const
  ),
  ...agentJournalEntries.map(
    entry =>
      [
        `journal:${entry.id}`,
        {
          surface: 'journal' as const,
          id: entry.id,
          href: `/journal#journal-${entry.id}`,
          title: entry.codename,
        },
      ] as const
  ),
]);

describe('Scrapbook relations', () => {
  it('references canonical public artifacts at both ends', () => {
    for (const relation of scrapbookRelations) {
      for (const artifact of [relation.from, relation.to]) {
        expect(
          publicArtifacts.get(`${artifact.surface}:${artifact.id}`)
        ).toEqual(artifact);
      }
    }
  });

  it('derives bounded backlinks from the same relation source', () => {
    const deskRefs = getRelatedScrapbookRefs('desk', 'evaluation-structures');
    expect(deskRefs).toEqual([
      expect.objectContaining({
        surface: 'journal',
        id: '2026-08-10-evaluation-structures',
        relation: 'evidence',
      }),
    ]);

    const journalRefs = getRelatedScrapbookRefs(
      'journal',
      '2026-08-10-evaluation-structures'
    );
    expect(journalRefs).toEqual([
      expect.objectContaining({
        surface: 'desk',
        id: 'evaluation-structures',
        relation: 'continues',
      }),
    ]);
    expect(deskRefs).toHaveLength(1);
    expect(journalRefs).toHaveLength(1);
    expect(getRelatedScrapbookRefs('desk', 'missing')).toEqual([]);
  });
});
