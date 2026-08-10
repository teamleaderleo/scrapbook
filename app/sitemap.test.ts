import { describe, expect, it } from 'vitest';
import { botDeskEntries } from '@/lib/bot-desk';
import sitemap from './sitemap';

describe('sitemap', () => {
  it('publishes stable public rooms and Workbench articles while leaving private, experimental, and operational rooms out', () => {
    const urls = sitemap().map(entry => entry.url);
    const workbenchUrls = botDeskEntries.map(
      entry => `https://teamleaderleo.com/desk/${entry.slug}`
    );

    expect(urls).toEqual([
      'https://teamleaderleo.com/',
      'https://teamleaderleo.com/space',
      'https://teamleaderleo.com/gallery',
      'https://teamleaderleo.com/desk',
      'https://teamleaderleo.com/journal',
      'https://teamleaderleo.com/time',
      ...workbenchUrls,
    ]);
    expect(urls).not.toContain('https://teamleaderleo.com/atelier');
    expect(urls).not.toContain('https://teamleaderleo.com/proxy-dashboard');
  });
});
