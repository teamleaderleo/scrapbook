import { botDeskEntries } from '@/lib/bot-desk';
import { getBotDeskDisplayCopy } from '@/lib/bot-desk-display';
import { getKnowledgeIndex } from '@/lib/knowledge';
import { publicLearningRecords } from '@/lib/learning-records';
import { siteNavigationGroups } from '@/lib/site-navigation';
import { workRecords } from '@/lib/work-records';
import type { DiscoveryItem } from '@/lib/discovery';

export async function getDiscoveryIndex(): Promise<DiscoveryItem[]> {
  'use cache';
  const knowledge = await getKnowledgeIndex();
  const items: DiscoveryItem[] = [
    ...botDeskEntries
      .filter(entry => entry.publicationState === 'Published')
      .map(entry => ({
        href: `/desk/${entry.slug}`,
        ...getBotDeskDisplayCopy(entry),
        summary: getBotDeskDisplayCopy(entry).blurb,
        kind: 'Workbench' as const,
        topics: entry.topics,
        date: entry.date,
      })),
    ...knowledge.concepts.map(entry => ({
      href: `/knowledge/${entry.slug}`,
      title: entry.title,
      summary: entry.summary ?? '',
      kind: 'Knowledge' as const,
      topics: [entry.trunk ?? ''],
      date: entry.updated ?? entry.created,
    })),
    ...publicLearningRecords.map(entry => ({
      href: entry.canonicalUrl,
      title: entry.title,
      summary: entry.spark,
      kind: 'Study' as const,
      topics: entry.topics,
      date: entry.revisions.at(-1)?.createdAt.slice(0, 10),
    })),
    ...workRecords.map(entry => ({
      href:
        entry.evidence.find(evidence => evidence.href.startsWith('/work/'))
          ?.href ?? `/work#${entry.id}`,
      title: entry.title,
      summary: entry.summary,
      kind: 'Project' as const,
      topics: [entry.kind],
    })),
    ...siteNavigationGroups
      .flatMap(group => group.items)
      .filter(
        entry =>
          !entry.external &&
          entry.surface !== 'private' &&
          entry.href.startsWith('/')
      )
      .map(entry => ({
        href: entry.href,
        title: entry.label,
        summary: entry.description,
        kind: 'Page' as const,
        topics: [],
      })),
  ];
  // Only public, deliberately projected metadata leaves the server.
  return Array.from(
    new Map(
      items.map(item => [
        item.href,
        {
          href: item.href,
          title: item.title,
          summary: item.summary,
          kind: item.kind,
          topics: item.topics,
          ...(item.date ? { date: item.date } : {}),
        },
      ])
    ).values()
  );
}
