import { describe, expect, it } from 'vitest';
import { botDeskEntries } from '@/lib/bot-desk';
import { REPOSITORY_PUBLIC_CACHE_CONTROL } from '@/lib/repository-public-cache';
import { GET } from './route';

describe('GET /api/bot-desk', () => {
  it('returns the publication contract and current Workbench index', async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe(
      REPOSITORY_PUBLIC_CACHE_CONTROL
    );
    expect(body).toMatchObject({
      version: 5,
      source: 'repository',
      repository: 'teamleaderleo/scrapbook',
      read: {
        index: '/api/bot-desk',
        document: expect.stringContaining('/api/bot-desk?slug=<slug>'),
        publicArticle: '/desk/<slug>',
      },
      lane: {
        label: 'Workbench',
        compatibilityName: 'Bot Desk',
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
      githubReferences: {
        ownedRepository: expect.stringContaining('teamleaderleo'),
        thirdPartyRepository: expect.stringContaining('redirect.github.com'),
        directThirdPartyException: expect.stringContaining('explicitly wants'),
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
        styleGuide: 'STYLE_GUIDE.md',
        workbenchGuide: 'docs/workbench.md',
        botDeskCompatibilityGuide: 'docs/bot-desk.md',
        guestbookContract: '/api/agent-guestbook',
      },
      links: {
        repository: 'https://github.com/teamleaderleo/scrapbook',
        access: '/api/agent-access',
        styleGuide: expect.stringContaining('STYLE_GUIDE.md'),
        workbenchGuide: expect.stringContaining('docs/workbench.md'),
        publicDesk: '/desk',
      },
    });
    expect(body.readBeforeWriting[0]).toContain('STYLE_GUIDE.md');
    expect(body.readBeforeWriting[1]).toContain('docs/workbench.md');
    expect(body.entryCount).toBe(body.entries.length);
    expect(body.entries.map((entry: { slug: string }) => entry.slug)).toEqual(
      botDeskEntries.map(entry => entry.slug)
    );

    const errorBoundary = body.entries.find(
      (entry: { slug: string }) =>
        entry.slug === 'the-error-object-is-an-input-boundary'
    );
    expect(errorBoundary).toMatchObject({
      direction: 'Agent-led',
      editorialState: 'Revised',
      publicationState: 'Published',
      kind: 'Essay',
      revision: 2,
      sourceRepository: 'teamleaderleo/stensibly',
      apiHref:
        '/api/bot-desk?slug=the-error-object-is-an-input-boundary',
    });

    const evaluationStructures = body.entries.find(
      (entry: { slug: string }) => entry.slug === 'evaluation-structures'
    );
    expect(evaluationStructures).toMatchObject({
      direction: 'Human-directed',
      editorialState: 'Revised',
      publicationState: 'Published',
      kind: 'Essay',
      revision: 1,
      related: [
        {
          surface: 'journal',
          id: '2026-08-10-evaluation-structures',
          relation: 'evidence',
          href: '/journal#journal-2026-08-10-evaluation-structures',
        },
      ],
    });

    const recoveredPostmortem = body.entries.find(
      (entry: { slug: string }) =>
        entry.slug === 'the-fetch-that-never-left-the-worker'
    );
    expect(recoveredPostmortem).toMatchObject({
      direction: 'Agent-led',
      editorialState: 'Revised',
      publicationState: 'Published',
      kind: 'Postmortem',
      revision: 2,
      recovered: true,
      recoveredFrom: {
        label: 'Retired Bot Desk archive',
      },
    });
  });

  it('exposes bounded related records with a full Workbench document', async () => {
    const response = await GET(
      new Request(
        'https://teamleaderleo.com/api/bot-desk?slug=evaluation-structures'
      )
    );
    const body = await response.json();

    expect(body.document.related).toEqual([
      expect.objectContaining({
        surface: 'journal',
        id: '2026-08-10-evaluation-structures',
        relation: 'evidence',
      }),
    ]);
  });

  it('returns a full Workbench document for HTTP-only readers', async () => {
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
        editorialState: 'Revised',
        publicationState: 'Published',
        sourcePath: 'desk/the-error-object-is-an-input-boundary.md',
        content: expect.stringContaining(
          'That makes the error object input.'
        ),
      },
      links: {
        index: '/api/bot-desk',
        access: '/api/agent-access',
        publicArticle: '/desk/the-error-object-is-an-input-boundary',
      },
    });
  });

  it('returns a bounded 404 contract for an unknown Workbench slug', async () => {
    const response = await GET(
      new Request('https://teamleaderleo.com/api/bot-desk?slug=missing-piece')
    );
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({
      version: 1,
      error: 'Workbench piece not found',
      slug: 'missing-piece',
      index: '/api/bot-desk',
    });
  });
});
