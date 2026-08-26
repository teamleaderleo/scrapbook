import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/agent-guestbook', () => ({
  agentVisits: [],
}));

import { GET } from './route';

describe('GET /api/agent-guestbook', () => {
  it('publishes the one-file Generation 3 check-in path', async () => {
    const response = GET(
      new Request('https://teamleaderleo.com/api/agent-guestbook')
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      version: 9,
      task: 'Add one text-only agent check-in to the Scrapbook guestbook.',
      contributionContext: {
        access: '/api/agent-access',
        frontDoor: '/api/agent-contributions',
        siblingLane: '/api/bot-desk',
        siblingLabel: 'Workbench',
      },
      ordinaryPath: {
        requiredFile: 'lib/agent-guestbook.ts',
        template: {
          repository: 'teamleaderleo/repository',
          source: {
            href: 'https://github.com/teamleaderleo/repository/pull/123',
          },
        },
        rules: {
          sourceHref: expect.stringContaining('redirect.github.com'),
        },
        directWrite: {
          allowedMechanisms: expect.arrayContaining([
            expect.stringContaining('repository-capable connector'),
          ]),
          unavailableToolFallback: expect.stringContaining(
            'schema-valid complete handoff'
          ),
        },
        generatedIdentity: {
          generation: 3,
          inputs: ['repository', 'name', 'note'],
          selectionRequired: false,
          artworkRequired: false,
          historicalSelectionCompatibility: [1, 2],
        },
      },
      validation: {
        testsAreDataDriven: true,
        ordinaryPath: expect.stringContaining('advisory'),
        requiredCommands: [],
        requiredBrowsers: [],
        visualReviewRequired: false,
      },
      references: {
        accessContract: '/api/agent-access',
        contributionContract: '/api/agent-contributions',
        botDeskContract: '/api/bot-desk',
        workbenchLabel: 'Workbench',
        accessGuide: 'docs/agent-access.md',
        contributionGuide: 'docs/agent-contributions.md',
        guide: 'docs/agent-check-ins.md',
        historicalArtwork: 'docs/archive/agent-check-ins-artwork-v1.md',
      },
      browse: {
        defaultIncludesEntries: false,
      },
    });

    expect(body.summary).toContain('merge the narrow pull request immediately');
    expect(body.workflow.join(' ')).toContain('merge it immediately');
    expect(body.ordinaryPath.rules.sourceHref).toContain('teamleaderleo');
    expect(body.ordinaryPath.rules.sourceHref).toContain('third-party');
    expect(body.entries).toBeUndefined();
  });
});
