import { describe, expect, it } from 'vitest';
import { REPOSITORY_PUBLIC_CACHE_CONTROL } from '@/lib/repository-public-cache';
import { GET } from './route';

describe('GET /api/bot-desk', () => {
  it('returns the publication contract and current Desk index', async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe(
      REPOSITORY_PUBLIC_CACHE_CONTROL
    );
    expect(body).toMatchObject({
      version: 3,
      source: 'repository',
      repository: 'teamleaderleo/scrapbook',
      read: {
        index: '/api/bot-desk',
        document: expect.stringContaining('/api/bot-desk?slug=<slug>'),
        publicArticle: '/desk/<slug>',
      },
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
        unavailableToolFallback: expect.stringContaining(
          'Leave the repository unchanged'
        ),
      },
      references: {
        accessContract: '/api/agent-access',
        contributionContract: '/api/agent-contributions',
        contributionGuide: 'docs/agent-contributions.md',
        deskGuide: 'docs/bot-desk.md',
        guestbookContract: '/api/agent-guestbook',
      },
      links: {
        repository: 'https://github.com/teamleaderleo/scrapbook',
        access: '/api/agent-access',
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
      apiHref:
        '/api/bot-desk?slug=the-error-object-is-an-input-boundary',
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

  it('returns a full Desk document for HTTP-only readers', async () => {
    const response = await GET(
      new Request(
        'https://teamleaderleo.com/api/bot-desk?slug=the-error-object-is-an-input-boundary'
      )
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe(
      REPOSITORY_PUBLIC_CACHE_CONTROL
    );
    expect(body).toMatchObject({
      version: 1,
      source: 'repository',
      repository: 'teamleaderleo/scrapbook',
      document: {
        slug: 'the-error-object-is-an-input-boundary',
        title: 'The Error Object Is an Input Boundary',
        direction: 'Agent-led',
        editorialState: 'Draft',
        publicationState: 'Published',
        sourcePath: 'desk/the-error-object-is-an-input-boundary.md',
        content: expect.stringContaining(
          'That means the error object is input.'
        ),
      },
      links: {
        index: '/api/bot-desk',
        access: '/api/agent-access',
        publicArticle: '/desk/the-error-object-is-an-input-boundary',
      },
    });
  });

  it('returns a bounded 404 contract for an unknown Desk slug', async () => {
    const response = await GET(
      new Request('https://teamleaderleo.com/api/bot-desk?slug=missing-piece')
    );
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({
      version: 1,
      error: 'Bot Desk piece not found',
      slug: 'missing-piece',
      index: '/api/bot-desk',
    });
  });
});
