import { describe, expect, it } from 'vitest';
import {
  getKnowledgeDocument,
  getKnowledgeHandoff,
  getKnowledgeIndex,
  knowledgeSlugFromSourcePath,
  resolveKnowledgeLink,
  rewriteKnowledgeLinks,
} from './knowledge';

describe('knowledge forest', () => {
  it('turns repository paths into stable site slugs', () => {
    expect(knowledgeSlugFromSourcePath('storage/mvcc.md')).toBe('storage/mvcc');
    expect(knowledgeSlugFromSourcePath('storage/README.md')).toBe('storage');
  });

  it('rewrites relative Markdown links without damaging external or local anchors', () => {
    expect(
      resolveKnowledgeLink('distributed-systems/idempotency.md', '../storage/transactions.md')
    ).toBe('/knowledge/storage/transactions');
    expect(
      resolveKnowledgeLink('distributed-systems/idempotency.md', 'README.md#start')
    ).toBe('/knowledge/distributed-systems#start');
    expect(
      resolveKnowledgeLink('distributed-systems/idempotency.md', 'https://example.com/x.md')
    ).toBe('https://example.com/x.md');
    expect(resolveKnowledgeLink('storage/mvcc.md', '#invariant')).toBe('#invariant');

    expect(
      rewriteKnowledgeLinks(
        'See [transactions](../storage/transactions.md) and [the section](#x).',
        'distributed-systems/idempotency.md'
      )
    ).toContain('](/knowledge/storage/transactions)');
  });

  it('derives the index from files instead of a hand-maintained registry', async () => {
    const index = await getKnowledgeIndex();
    expect(index.trunks.length).toBeGreaterThanOrEqual(9);
    expect(index.concepts.map(entry => entry.slug)).toEqual(
      expect.arrayContaining([
        'distributed-systems/idempotency',
        'storage/mvcc',
        'engineering-judgment/debugging-discriminators',
        'ai-systems/inference-serving',
      ])
    );
    expect(index.concepts.map(entry => entry.slug)).not.toContain('HANDOFF');
    expect(index.concepts.map(entry => entry.slug)).not.toContain('LEARNING');
    expect(index.logs[0]?.date).toBe('2026-08-25');
  });

  it('renders a concept and a trunk from the same repository-backed reader', async () => {
    const concept = await getKnowledgeDocument([
      'distributed-systems',
      'idempotency',
    ]);
    const trunk = await getKnowledgeDocument(['distributed-systems']);

    expect(concept?.title).toBe('Idempotency');
    expect(concept?.html).toContain('/knowledge/storage/transactions');
    expect(trunk?.kind).toBe('trunk');
    expect(trunk?.html).toContain('/knowledge/distributed-systems/idempotency');
  });

  it('loads the current handoff separately from the durable concept index', async () => {
    const handoff = await getKnowledgeHandoff();

    expect(handoff.title).toBe('Current handoff');
    expect(handoff.updated).toBe('2026-08-25');
    expect(handoff.html).toContain('/knowledge/computation/cancellation');
    expect(handoff.html).toContain('/knowledge/distributed-systems/idempotency');
  });
});