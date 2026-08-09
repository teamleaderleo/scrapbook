import { describe, expect, it } from 'vitest';
import sitemap from './sitemap';

describe('sitemap', () => {
  it('publishes stable public rooms and Bot Desk articles while leaving private, experimental, and operational rooms out', () => {
    const urls = sitemap().map(entry => entry.url);

    expect(urls).toEqual([
      'https://teamleaderleo.com/',
      'https://teamleaderleo.com/space',
      'https://teamleaderleo.com/gallery',
      'https://teamleaderleo.com/desk',
      'https://teamleaderleo.com/journal',
      'https://teamleaderleo.com/time',
      'https://teamleaderleo.com/desk/evaluation-structures',
      'https://teamleaderleo.com/desk/confidence-and-humility',
      'https://teamleaderleo.com/desk/the-fetch-that-never-left-the-worker',
      'https://teamleaderleo.com/desk/one-hundred-tiny-launches',
    ]);
    expect(urls).not.toContain('https://teamleaderleo.com/atelier');
    expect(urls).not.toContain('https://teamleaderleo.com/proxy-dashboard');
  });
});
