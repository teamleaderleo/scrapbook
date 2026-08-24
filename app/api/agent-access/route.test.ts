import { describe, expect, it } from 'vitest';
import { REPOSITORY_PUBLIC_CACHE_CONTROL } from '@/lib/repository-public-cache';
import { GET } from './route';

describe('GET /api/agent-access', () => {
  it('describes transport-neutral read, write, handoff, writing-guide, and GitHub-reference capabilities', async () => {
    const response = GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe(
      REPOSITORY_PUBLIC_CACHE_CONTROL
    );
    expect(body).toMatchObject({
      version: 3,
      source: 'repository',
      repository: 'teamleaderleo/scrapbook',
      canonicalSite: 'https://teamleaderleo.com',
      discover: {
        text: '/llms.txt',
        capabilities: '/api/agent-access',
        handoffSchema: '/api/agent-access/handoff-schema',
        contributions: '/api/agent-contributions',
        repositoryInstructions: 'AGENTS.md',
        styleGuide: 'STYLE_GUIDE.md',
        workbenchGuide: 'docs/workbench.md',
      },
      capabilityChecks: expect.arrayContaining([
        expect.stringContaining('read the current canonical repository files'),
        expect.stringContaining('create or isolate a branch'),
        expect.stringContaining('open a pull request'),
      ]),
      read: {
        publicSite: {
          work: '/work',
          learningRecords: '/space/records',
          workbench: '/desk',
        },
        machineContracts: {
          handoffSchema: '/api/agent-access/handoff-schema',
          botDesk: '/api/bot-desk',
          work: '/api/work',
          learningRecords: '/api/learning-records',
        },
        compatibility: expect.stringContaining('docs/workbench.md'),
        repositoryGuides: expect.arrayContaining([
          'STYLE_GUIDE.md',
          'docs/workbench.md',
          'docs/bot-desk.md',
        ]),
      },
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
      githubReferences: {
        ownedRepository: expect.stringContaining('teamleaderleo'),
        thirdPartyRepository: expect.stringContaining('redirect.github.com'),
        directThirdPartyException: expect.stringContaining('explicitly wants'),
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
        schema: '/api/agent-access/handoff-schema',
        include: expect.arrayContaining([
          'exact canonical target file paths',
          'complete proposed file contents or a precise patch',
          'primary evidence URLs using the ownership-based GitHub host rule',
        ]),
        template: {
          formatVersion: 1,
          repository: 'teamleaderleo/scrapbook',
          lane: 'repository-work',
          files: [
            expect.objectContaining({
              path: 'exact/repository/path',
              operation: 'update',
              content: expect.any(String),
              patch: null,
            }),
          ],
          evidence: expect.arrayContaining([
            expect.stringContaining('redirect.github.com'),
          ]),
          validation: expect.any(Array),
          review: expect.objectContaining({
            humanReviewRequired: false,
            reason: null,
          }),
        },
        evidenceRule: expect.stringContaining('redirect.github.com'),
      },
      links: {
        repository: 'https://github.com/teamleaderleo/scrapbook',
        styleGuide: expect.stringContaining('STYLE_GUIDE.md'),
        workbenchGuide: expect.stringContaining('docs/workbench.md'),
        accessGuide: expect.stringContaining('docs/agent-access.md'),
        publicWorkbench: '/desk',
        publicWork: '/work',
      },
    });

    expect(body.next.beforeSubstantiveWriting).toContain('STYLE_GUIDE.md');
    expect(body.next.beforeSubstantiveWriting).toContain('docs/workbench.md');
    expect(body.transports.databaseOrStorageConnection.rule).toContain(
      'Do not publish Guest Check-ins'
    );
    expect(body.transports.otherConnector.rule).toContain(
      'Detect the connection capabilities first'
    );
    expect(body.handoff.rule).toContain('Leave the repository unchanged');
  });
});
