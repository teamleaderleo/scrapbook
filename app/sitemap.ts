import { botDeskEntries } from '@/lib/bot-desk';
import { publicLearningRecords } from '@/lib/learning-records';
import { indexedNavigationItems } from '@/lib/site-navigation';
import type { MetadataRoute } from 'next';

const BASE_URL = 'https://teamleaderleo.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const navigationEntries = indexedNavigationItems.map(item => ({
    url: new URL(item.href, BASE_URL).toString(),
    changeFrequency: item.sitemap.changeFrequency,
    priority: item.sitemap.priority,
  }));

  const deskEntries = botDeskEntries.map(entry => ({
    url: new URL(`/desk/${entry.slug}`, BASE_URL).toString(),
    lastModified: `${entry.date}T00:00:00.000Z`,
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  }));

  const learningRecordEntries = publicLearningRecords.map(record => ({
    url: new URL(record.canonicalUrl, BASE_URL).toString(),
    lastModified: `${record.revisions.at(-1)?.createdAt}T00:00:00.000Z`,
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  }));

  return [
    ...navigationEntries,
    {
      url: new URL('/space/records', BASE_URL).toString(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    },
    ...learningRecordEntries,
    ...deskEntries,
  ];
}
