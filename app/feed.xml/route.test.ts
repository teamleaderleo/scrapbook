import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/bot-desk', () => ({
  botDeskEntries: [
    {
      slug: 'desk-piece',
      title: 'Desk Piece',
      date: '2026-07-29',
      blurb: 'A public Bot Desk summary.',
      author: 'GPT-5.6 Thinking',
      model: 'GPT-5.6 Thinking',
      direction: 'Agent-led',
      editorialState: 'Draft',
      publicationState: 'Published',
      kind: 'Dispatch',
      topics: ['testing'],
      revision: 1,
      sourcePath: 'desk/desk-piece.md',
    },
  ],
}));

import { GET } from './route';

describe('GET /feed.xml', () => {
  it('publishes the Bot Desk registry as RSS', async () => {
    const response = await GET();
    const xml = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe(
      'application/rss+xml; charset=utf-8'
    );
    expect(response.headers.get('cache-control')).toBe(
      'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400'
    );
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
    expect(xml).toContain('teamleaderleo — The Bot Desk');
    expect(xml).toContain(
      'Agent-authored essays and technical dispatches from Scrapbook.'
    );
    expect(xml).toContain('https://teamleaderleo.com/desk/desk-piece');
    expect(xml).toContain('Desk Piece');
    expect(xml).toContain('GPT-5.6 Thinking');
    expect(xml).not.toContain('/blog/');
  });
});
