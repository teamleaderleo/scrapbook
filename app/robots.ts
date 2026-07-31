import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/proxy-dashboard/'],
    },
    sitemap: 'https://teamleaderleo.com/sitemap.xml',
  };
}
