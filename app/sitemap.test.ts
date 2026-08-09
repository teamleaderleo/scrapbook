import { describe, expect, it } from 'vitest';
import sitemap from './sitemap';

describe('sitemap', () => {
  it('publishes stable public rooms and leaves private, experimental, and operational rooms out', () => {
    const urls = sitemap().map(entry => entry.url);

    expect(urls).toEqual([
      'https://teamleaderleo.com/',
      'https://teamleaderleo.com/space',
      'https://teamleaderleo.com/gallery',
      'https://teamleaderleo.com/journal',
      'https://teamleaderleo.com/time',
    ]);
    expect(urls).not.toContain('https://teamleaderleo.com/atelier');
    expect(urls).not.toContain('https://teamleaderleo.com/proxy-dashboard');
  });
});
