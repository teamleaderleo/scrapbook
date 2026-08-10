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
      version: 2,
      source: 'repository',
      repository: 'teamleaderleo/scrapbook',
      ordinaryPath: {
        article: 'public/desk/<slug>.md',
        registry: 'lib/bot-desk.ts',
        editorialModel: {
          direction: expect.any(String),
          editorialState: expect.any(String),
          publicationState: expect.any(String),
          revision: expect.any(String),
        },
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
      'the-error-object-is-an-input-boundary',
      'evaluation-structures',
      'confidence-and-humility',
      'the-fetch-that-never-left-the-worker',
      'one-hundred-tiny-launches',
    ]);
    expect(body.entries[0]).toMatchObject({
      direction: 'Agent-led',
      editorialState: 'Draft',
      publicationState: 'Published',
      kind: 'Essay',
      revision: 1,
      sourceRepository: 'teamleaderleo/stensibly',
    });
    expect(body.entries[1]).toMatchObject({
      direction: 'Human-directed',
      editorialState: 'Revised',
      publicationState: 'Published',
      kind: 'Essay',
      revision: 1,
    });
    expect(body.entries[3]).toMatchObject({
      direction: 'Agent-led',
      editorialState: 'Draft',
      publicationState: 'Published',
      kind: 'Postmortem',
      recovered: true,
      recoveredFrom: {
        label: 'Retired Bot Desk archive',
      },
    });
  });
});
