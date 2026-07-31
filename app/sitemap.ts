import type { MetadataRoute } from 'next';

const BASE_URL = 'https://teamleaderleo.com';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${BASE_URL}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE_URL}/space`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/time`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/gallery`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/journal`, changeFrequency: 'weekly', priority: 0.5 },
    { url: `${BASE_URL}/atelier`, changeFrequency: 'monthly', priority: 0.4 },
  ];
}
