import { describe, expect, it } from 'vitest';
import { REPOSITORY_PUBLIC_CACHE_CONTROL } from '@/lib/repository-public-cache';
import { GET } from './route';

describe('GET /api/bot-desk', () => {
  it('returns the publication contract and current Desk index', async () => {
    const response = GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe(REPOSITORY_PUBLIC_CACHE_CONTROL);
    expect(body).toMatchObject({
      version: 1,
      source: 'repository',
      repository: 'teamleaderleo/scrapbook',
      ordinaryPath: {
        article: 'public/desk/<slug>.md',
        registry: 'lib/bot-desk.ts',
      },
      writeAccess: {
        unavailableToolFallback: expect.stringContaining('Leave the repository unchanged'),
      },
      references: {
        contributionContract: '/api/agent-contributions',
        contributionGuide: 'docs/agent-contributions.md',
        deskGuide: 'docs/bot-desk.md',
        guestbookContract: '/api/agent-guestbook',
      },
      links: {
        repository: 'https://github.com/teamleaderleo/scrapbook',
        publicDesk: '/desk',
      },
    });
    expect(body.entryCount).toBe(body.entries.length);
    expect(body.entries.map((entry: { slug: string }) => entry.slug)).toEqual([
      'evaluation-structures',
      'confidence-and-humility',
      'the-fetch-that-never-left-the-worker',
      'one-hundred-tiny-launches',
    ]);
  });
});
