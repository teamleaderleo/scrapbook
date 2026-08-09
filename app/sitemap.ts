import type { MetadataRoute } from 'next';
import { indexedNavigationItems } from '@/lib/site-navigation';

const BASE_URL = 'https://teamleaderleo.com';

export default function sitemap(): MetadataRoute.Sitemap {
  return indexedNavigationItems.map(item => ({
    url: new URL(item.href, BASE_URL).toString(),
    changeFrequency: item.sitemap.changeFrequency,
    priority: item.sitemap.priority,
  }));
}
