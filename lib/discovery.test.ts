import { describe, expect, it } from 'vitest';
import {
  parseRecentPaths,
  searchDiscovery,
  type DiscoveryItem,
} from './discovery';
import { getDiscoveryIndex } from './discovery-index';
import { getKnowledgeReadingPath } from './knowledge';
import { learningRecordFixtures } from './learning-records';

const items: DiscoveryItem[] = [
  {
    href: '/desk/cache',
    title: 'A cache story',
    summary: 'CPU and memory',
    kind: 'Workbench',
    topics: ['performance'],
  },
  {
    href: '/knowledge/memory',
    title: 'Memory hierarchy',
    summary: 'A cache story',
    kind: 'Knowledge',
    topics: ['performance'],
  },
];

describe('discovery', () => {
  it('matches all terms across fields, ranks titles first, and combines collection filters', () => {
    expect(searchDiscovery(items, ' MEMORY ')).toEqual([items[1], items[0]]);
    expect(searchDiscovery(items, 'memory performance', 'Workbench')).toEqual([
      items[0],
    ]);
    expect(searchDiscovery(items, 'memory missing')).toEqual([]);
    expect(searchDiscovery(items, '')).toEqual(items);
  });
  it('keeps recent storage bounded, deduplicated, and free of query strings or arbitrary URLs', () => {
    expect(
      parseRecentPaths(
        JSON.stringify([
          '/desk/cache',
          '/desk/cache',
          '//evil.test',
          'https://evil.test',
          '/machine-health/access?token=x',
          '/space/edit/private',
          '/knowledge/a/../b',
          '/desk/a?secret=x',
          '/knowledge/performance/memory',
        ])
      )
    ).toEqual(['/desk/cache', '/knowledge/performance/memory']);
    expect(parseRecentPaths('{broken')).toEqual([]);
    expect(parseRecentPaths(JSON.stringify({ href: '/desk/cache' }))).toEqual(
      []
    );
    expect(parseRecentPaths('x'.repeat(8193))).toEqual([]);
    expect(
      parseRecentPaths(
        JSON.stringify(Array.from({ length: 20 }, (_, i) => `/desk/item-${i}`))
      )
    ).toHaveLength(12);
  });
  it('projects only public search metadata and excludes private and unlisted study records', async () => {
    const index = await getDiscoveryIndex();
    expect(new Set(index.map(item => item.href)).size).toBe(index.length);
    expect(index.some(item => item.kind === 'Knowledge')).toBe(true);
    expect(index.some(item => item.kind === 'Project')).toBe(true);
    for (const entry of learningRecordFixtures.filter(
      entry => entry.visibility !== 'public'
    )) {
      expect(index.some(item => item.href === entry.canonicalUrl)).toBe(false);
    }
    for (const entry of index) {
      expect(
        Object.keys(entry).every(key =>
          ['href', 'title', 'summary', 'kind', 'topics', 'date'].includes(key)
        )
      ).toBe(true);
      expect(entry.href.startsWith('/')).toBe(true);
    }
  });
  it('derives the suggested path from the handoff without copying session instructions or external links', () => {
    const markdown =
      '## Default next walk\n\nFollow [Memory](performance/memory-hierarchy.md) → [External](https://example.com).\n\nThen [Other](security/authority.md).';
    expect(getKnowledgeReadingPath(markdown)).toEqual([
      { title: 'Memory', href: '/knowledge/performance/memory-hierarchy' },
    ]);
    expect(getKnowledgeReadingPath('No reading path yet.')).toEqual([]);
  });
});
