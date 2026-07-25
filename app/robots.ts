import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard/', '/proxy-dashboard/', '/login/'],
    },
    sitemap: 'https://teamleaderleo.com/sitemap.xml',
  };
}
