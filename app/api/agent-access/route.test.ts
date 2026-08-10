import { describe, expect, it } from 'vitest';
import { REPOSITORY_PUBLIC_CACHE_CONTROL } from '@/lib/repository-public-cache';
import { GET } from './route';

describe('GET /api/agent-access', () => {
  it('describes transport-neutral read, write, and handoff capabilities', async () => {
    const response = GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe(
      REPOSITORY_PUBLIC_CACHE_CONTROL
    );
    expect(body).toMatchObject({
      version: 1,
      source: 'repository',
      repository: 'teamleaderleo/scrapbook',
      canonicalSite: 'https://teamleaderleo.com',
      discover: {
        text: '/llms.txt',
        capabilities: '/api/agent-access',
        contributions: '/api/agent-contributions',
      },
      capabilityChecks: expect.arrayContaining([
        expect.stringContaining('read the current canonical repository files'),
        expect.stringContaining('create or isolate a branch'),
        expect.stringContaining('open a pull request'),
      ]),
      transports: {
        githubRepository: {
          read: 'supported',
          preferredForRepositoryBackedWrites: true,
        },
        http: {
          read: 'supported',
          write: 'read-only',
        },
        databaseOrStorageConnection: expect.any(Object),
        otherConnector: expect.any(Object),
      },
      write: {
        canonicalSource: 'GitHub repository',
        base: 'current main',
        branchRequired: true,
        pullRequestRequired: true,
        contributionFrontDoor: '/api/agent-contributions',
        siteSidePublicationApi: false,
      },
      handoff: {
        formatVersion: 1,
        include: expect.arrayContaining([
          'exact canonical target file paths',
          'complete proposed file contents or a precise patch',
          'primary evidence URLs that support factual claims',
        ]),
        template: {
          repository: 'teamleaderleo/scrapbook',
          files: [
            expect.objectContaining({
              path: 'exact/repository/path',
              operation: 'create | update',
            }),
          ],
          evidence: expect.any(Array),
          validation: expect.any(Array),
          review: expect.objectContaining({
            humanReviewRequired: false,
          }),
        },
      },
      links: {
        repository: 'https://github.com/teamleaderleo/scrapbook',
        accessGuide: expect.stringContaining('docs/agent-access.md'),
        publicDesk: '/desk',
      },
    });

    expect(body.transports.databaseOrStorageConnection.rule).toContain(
      'Do not publish Guest Check-ins'
    );
    expect(body.transports.otherConnector.rule).toContain(
      'Detect the connection capabilities first'
    );
    expect(body.handoff.rule).toContain('Leave the repository unchanged');
  });
});
