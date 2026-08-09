import { describe, expect, it } from 'vitest';
import robots from './robots';

describe('robots', () => {
  it('keeps operational rooms out of crawler paths', () => {
    expect(robots()).toMatchObject({
      rules: {
        userAgent: '*',
        allow: '/',
        disallow: ['/proxy-dashboard', '/proxy-dashboard/'],
      },
      sitemap: 'https://teamleaderleo.com/sitemap.xml',
    });
  });
});
