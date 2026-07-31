import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/agent-journal', () => ({
  agentJournalEntries: [
    {
      id: 'journal-entry',
      codename: 'Journal Agent',
      occurredAt: '2026-07-29T11:00:00.000Z',
      note: 'A public journal summary.',
      model: 'GPT-5.6 Thinking',
      artifact: {
        kind: 'document',
        path: '/journal/public-note.md',
        label: 'Read the public journal note',
      },
    },
    {
      id: 'internal-record',
      codename: 'Receipt Agent',
      occurredAt: '2026-07-28T11:00:00.000Z',
      note: 'This record has no public document.',
    },
  ],
}));

import { GET } from './route';

describe('GET /feed.xml', () => {
  it('returns only document-backed journal entries as RSS', async () => {
    const response = await GET();
    const xml = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('application/rss+xml; charset=utf-8');
    expect(response.headers.get('cache-control')).toBe(
      'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    );
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
    expect(xml).toContain('teamleaderleo — journal');
    expect(xml).toContain('Selected public journal entries from Scrapbook.');
    expect(xml).toContain('https://teamleaderleo.com/journal/public-note.md');
    expect(xml).toContain('Journal Agent (GPT-5.6 Thinking)');
    expect(xml).not.toContain('internal-record');
    expect(xml).not.toContain('/blog/');
  });
});
