import { describe, expect, it } from 'vitest';
import { createRssFeed, type RssFeedItem } from './rss-feed';

const item = (overrides: Partial<RssFeedItem> = {}): RssFeedItem => ({
  id: 'https://teamleaderleo.com/blog/older',
  title: 'Older post',
  summary: 'A useful summary.',
  publishedAt: '2026-07-20T10:00:00.000Z',
  link: 'https://teamleaderleo.com/blog/older',
  author: 'Leo Li',
  ...overrides,
});

function feed(items: RssFeedItem[], maximumItems?: number) {
  return createRssFeed({
    title: 'teamleaderleo & notes',
    description: 'Posts < journal entries',
    siteUrl: 'https://teamleaderleo.com/',
    feedUrl: 'https://teamleaderleo.com/feed.xml',
    items,
    maximumItems,
  });
}

describe('createRssFeed', () => {
  it('sorts newest first and escapes XML-sensitive text', () => {
    const xml = feed([
      item(),
      item({
        id: 'https://teamleaderleo.com/blog/newer',
        link: 'https://teamleaderleo.com/blog/newer',
        title: 'Newer <post> & "notes"',
        summary: "One 'careful' summary\u0001",
        publishedAt: '2026-07-30T12:00:00.000Z',
        author: 'Agent & editor',
      }),
    ]);

    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(xml).toContain('<title>teamleaderleo &amp; notes</title>');
    expect(xml).toContain('<description>Posts &lt; journal entries</description>');
    expect(xml).toContain('Newer &lt;post&gt; &amp; &quot;notes&quot;');
    expect(xml).toContain('One &apos;careful&apos; summary�');
    expect(xml).toContain('<dc:creator>Agent &amp; editor</dc:creator>');
    expect(xml.indexOf('/blog/newer')).toBeLessThan(xml.indexOf('/blog/older'));
    expect(xml).toContain('<lastBuildDate>Thu, 30 Jul 2026 12:00:00 GMT</lastBuildDate>');
  });

  it('keeps item identities on the canonical site origin', () => {
    expect(() =>
      feed([
        item({
          id: 'https://example.com/copied',
          link: 'https://example.com/copied',
        }),
      ]),
    ).toThrow('must stay on the site origin');
  });

  it('rejects duplicate identities and bounds the item count', () => {
    expect(() => feed([item(), item()])).toThrow('item id is duplicated');

    const xml = feed(
      [
        item(),
        item({
          id: 'https://teamleaderleo.com/blog/newer',
          link: 'https://teamleaderleo.com/blog/newer',
          publishedAt: '2026-07-30T12:00:00.000Z',
        }),
      ],
      1,
    );
    expect(xml).toContain('/blog/newer');
    expect(xml).not.toContain('/blog/older');
  });
});
