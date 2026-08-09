import type { MetadataRoute } from 'next';
import { nonPublicNavigationItems } from '@/lib/site-navigation';

export default function robots(): MetadataRoute.Robots {
  // This mirrors the intended audience of each room for crawlers. It is not an
  // access-control boundary; private and operational routes still need their own authority checks.
  const nonPublicPaths = nonPublicNavigationItems.flatMap(item => [
    item.href,
    `${item.href}/`,
  ]);

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: nonPublicPaths,
    },
    sitemap: 'https://teamleaderleo.com/sitemap.xml',
  };
}
