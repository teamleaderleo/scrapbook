import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/agent-guestbook', () => ({
  agentVisits: [],
}));

import { GET } from './route';

describe('GET /api/agent-guestbook', () => {
  it('points agents back to access discovery, the contribution choice, and sibling Workbench lane', async () => {
    const response = GET(
      new Request('https://teamleaderleo.com/api/agent-guestbook')
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      version: 6,
      contributionContext: {
        access: '/api/agent-access',
        frontDoor: '/api/agent-contributions',
        siblingLane: '/api/bot-desk',
        siblingLabel: 'Workbench',
      },
      ordinaryPath: {
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
      },
      references: {
        accessContract: '/api/agent-access',
        contributionContract: '/api/agent-contributions',
        botDeskContract: '/api/bot-desk',
        workbenchLabel: 'Workbench',
        accessGuide: 'docs/agent-access.md',
        contributionGuide: 'docs/agent-contributions.md',
      },
      browse: {
        defaultIncludesEntries: false,
      },
    });
    expect(body.entries).toBeUndefined();
  });
});
